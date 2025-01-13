/**
 * Copyright (C) 2024 RealWear, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.realwear.acs.viewmodel

import android.app.Activity
import android.app.Application
import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.LifecycleOwner
import com.azure.android.communication.calling.CallState
import com.realwear.acs.dependency.ICall
import com.realwear.acs.dependency.IFrameLayout
import com.realwear.acs.model.Participant
import com.realwear.acs.testutil.TestAcsRepository
import com.realwear.acs.testutil.TestAcsRepository.VideoStreamRequest
import com.realwear.acs.testutil.TestApplication
import com.realwear.acs.testutil.TestCall
import com.realwear.acs.testutil.TestCallAgent
import com.realwear.acs.testutil.TestCallClient
import com.realwear.acs.testutil.TestFrameLayout
import com.realwear.acs.testutil.TestTranscriptionRepository
import com.realwear.acs.viewmodel.IMeetingViewModel.Camera
import com.realwear.acs.viewmodel.IMeetingViewModel.State
import com.realwear.acs.viewmodel.IMeetingViewModel.StreamingState
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.MockitoAnnotations
import org.mockito.junit.MockitoJUnitRunner

@ExperimentalCoroutinesApi
@RunWith(MockitoJUnitRunner::class)
class MeetingViewModelTest {
    @get:Rule
    var instantTaskExecutorRule = InstantTaskExecutorRule()

    @ExperimentalCoroutinesApi
    private val testDispatcher = StandardTestDispatcher()

    @ExperimentalCoroutinesApi
    private val testScope = TestScope(testDispatcher)

    @Mock
    lateinit var activity: Activity

    @Mock
    lateinit var mockApplication: Application

    @Mock
    lateinit var lifecycleOwner: LifecycleOwner

    private val callClient = TestCallClient()
    private val testCall = TestCall()
    private val testCallAgent = TestCallAgent(testCall)
    private val testAcsRepository = TestAcsRepository(testCallAgent)
    private val testTranscriptionRepository = TestTranscriptionRepository()

    private lateinit var application: TestApplication
    private lateinit var viewModel: MeetingViewModel

    @Before
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        `when`(mockApplication.getString(ArgumentMatchers.anyInt())).thenReturn("")

        application = TestApplication(mockApplication)

        viewModel = MeetingViewModel(
            application,
            testDispatcher,
            testDispatcher,
            callClient,
            testAcsRepository,
            testTranscriptionRepository
        )
    }

    @Test
    fun testInitialState() = testScope.runTest {
        assertEquals(State.LOADING, viewModel.currentState.value)
        assertEquals(0, viewModel.participants.value.size)
        assertEquals(Camera.CLASSIC, viewModel.currentCamera.value)
        assertEquals(StreamingState.LIVE, viewModel.micState.value)
        assertEquals(StreamingState.LIVE, viewModel.cameraState.value)
        assertEquals(false, viewModel.isCameraDisplayDisabled.value)
        assertEquals(false, viewModel.isCameraDisplayPipDisabled.value)
        assertEquals(1, viewModel.zoomLevel.value)
        assertEquals(false, viewModel.isFlashOn.value)
        assertEquals(false, viewModel.isFreezeFrame.value)
        assertEquals(false, viewModel.isTranscriptionOn.value)
    }

    @Test
    fun testUserEntersLobbyOnConnect() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)

        assertEquals(State.IN_LOBBY, viewModel.currentState.value)
        assertEquals(0, viewModel.participants.value.size)
    }

    @Test
    fun testCallIsStartedOnConnect() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)

        assertTrue(testAcsRepository.hasJoinCallBeenCalled)
        assertTrue(testCallAgent.hasJoinBeenCalled)
    }

    @Test
    fun testCallFinishesWithNoReason() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallEndReason(ICall.CallEndedReason.NONE)
        testCall.setCallState(CallState.DISCONNECTED)

        assertEquals(State.FINISHED, viewModel.currentState.value)
    }

    @Test
    fun testCallFinishesWithNetworkError() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallEndReason(ICall.CallEndedReason.NETWORK_ERROR)
        testCall.setCallState(CallState.DISCONNECTED)

        assertEquals(State.NETWORK_ERROR, viewModel.currentState.value)
    }

    @Test
    fun testHangingUpCall() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.CONNECTED)

        viewModel.hangUp()

        assertEquals(State.HANGING_UP, viewModel.currentState.value)
    }

    @Test
    fun testHangingUpCallComplete() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.CONNECTED)

        viewModel.hangUp()
        testCall.setCallEndReason(ICall.CallEndedReason.USER_HUNG_UP)
        testCall.setCallState(CallState.DISCONNECTED)
        testCall.completeHangup()

        assertEquals(State.FINISHED, viewModel.currentState.value)
    }

    @Test
    fun testConnectingWithExistingParticipantsEntersCallScreen() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        assertEquals(State.IN_MEETING, viewModel.currentState.value)
    }

    @Test
    fun testConnectingWithExistingParticipantSendsMainCamera() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(State.IN_MEETING, viewModel.currentState.value)
        assertEquals(listOf(VideoStreamRequest.CLASSIC_CAMERA), testAcsRepository.videoStreamRequests)
    }

    @Test
    fun testConnectingWithExistingParticipantSharingScreen() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.JOINING_MEETING, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)

        testCall.setCallState(CallState.CONNECTED)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(State.IN_MEETING, viewModel.currentState.value)
        assertEquals(
            listOf(
                VideoStreamRequest.REMOTE,
                VideoStreamRequest.CLASSIC_CAMERA, // PIP starting with screen share.
                VideoStreamRequest.CLASSIC_CAMERA // PIP starting with meeting start.
            ), testAcsRepository.videoStreamRequests
        )
        assertTrue(testAcsRepository.hasStreamClassicCameraVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasDisplayThermalVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasStreamThermalVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasDisplayThermalVideoStreamBeenCalled)
    }

    @Test
    fun testLastParticipantLeavingReturnsToLobby() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        testCall.removeParticipant(TEST_PARTICIPANT1)

        assertEquals(State.IN_LOBBY, viewModel.currentState.value)
    }

    @Test
    fun testSwitchingToThermalCamera() = testScope.runTest {
        val frameLayouts = mutableListOf<IFrameLayout?>()
        val job = viewModel.videoStreamRendererViewState.onEach { frameLayout -> frameLayouts.add(frameLayout) }
            .launchIn(this)
        val testVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(testVideoStreamRendererView)

        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(Camera.THERMAL, viewModel.currentCamera.value)
        assertEquals(StreamingState.LIVE, viewModel.cameraState.value)
        assertEquals(listOf(null, testVideoStreamRendererView), frameLayouts)

        job.cancel()
    }

    @Test
    fun testSwitchingToThermalCameraShowChangingState() = testScope.runTest {
        testAcsRepository.setTestVideoStreamRendererView(TestFrameLayout(activity))

        viewModel.switchToThermalCamera(activity)

        assertEquals(Camera.CHANGING, viewModel.currentCamera.value)
        assertEquals(StreamingState.CHANGING, viewModel.cameraState.value)
    }

    @Test
    fun testSwitchingToClassicCamera() = testScope.runTest {
        val frameLayouts = mutableListOf<IFrameLayout?>()
        val job = viewModel.videoStreamRendererViewState.onEach { frameLayout -> frameLayouts.add(frameLayout) }
            .launchIn(this)
        val thermalVideoStreamRendererView = TestFrameLayout(activity)
        val classicVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(thermalVideoStreamRendererView)

        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()
        testAcsRepository.setTestVideoStreamRendererView(classicVideoStreamRendererView)
        viewModel.switchToClassicCamera(activity, lifecycleOwner)
        testDispatcher.scheduler.advanceUntilIdle()

        assertTrue(testAcsRepository.hasStreamClassicCameraVideoStreamBeenCalled)
        assertTrue(testAcsRepository.hasDisplayClassicCameraVideoStreamBeenCalled)
        assertTrue(testAcsRepository.hasStreamThermalVideoStreamBeenCalled)
        assertTrue(testAcsRepository.hasDisplayThermalVideoStreamBeenCalled)
        assertEquals(Camera.CLASSIC, viewModel.currentCamera.value)
        assertEquals(listOf(null, thermalVideoStreamRendererView, classicVideoStreamRendererView), frameLayouts)

        job.cancel()
    }

    @Test
    fun testViewModelIsCleanedUpIfCallEnded() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        assertTrue(testCall.stateChangedListenerIsSet)
        assertTrue(testCall.remoteParticipantsUpdatedListenerIsSet)
        assertTrue(testCall.statisticsAreReporting)

        viewModel.hangUp()
        testCall.setCallEndReason(ICall.CallEndedReason.USER_HUNG_UP)
        testCall.setCallState(CallState.DISCONNECTED)
        testCall.completeHangup()

        assertEquals(State.FINISHED, viewModel.currentState.value)
        assertTrue(testAcsRepository.hasCleanupBeenCalled)
        assertTrue(testCallAgent.hasDisposeBeenCalled)
        assertFalse(testCall.stateChangedListenerIsSet)
        assertFalse(testCall.remoteParticipantsUpdatedListenerIsSet)
        assertFalse(testCall.statisticsAreReporting)
    }

    @Test
    fun testListenersAreUnsubscribedIfCallEndsWithUnknownReason() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        assertTrue(testCall.stateChangedListenerIsSet)
        assertTrue(testCall.remoteParticipantsUpdatedListenerIsSet)
        assertTrue(testCall.statisticsAreReporting)

        testCall.setCallEndReason(ICall.CallEndedReason.NONE)
        testCall.setCallState(CallState.DISCONNECTED)

        assertEquals(State.FINISHED, viewModel.currentState.value)
        assertTrue(testAcsRepository.hasCleanupBeenCalled)
        assertTrue(testCallAgent.hasDisposeBeenCalled)
        assertFalse(testCall.stateChangedListenerIsSet)
        assertFalse(testCall.remoteParticipantsUpdatedListenerIsSet)
        assertFalse(testCall.statisticsAreReporting)
    }

    @Test
    fun testViewModelIsCleanedUpIfCallEndedEarly() = testScope.runTest {
        assertEquals(State.LOADING, viewModel.currentState.value)

        viewModel.hangUp()

        assertEquals(State.FINISHED, viewModel.currentState.value)
        assertTrue(testAcsRepository.hasCleanupBeenCalled)
        assertFalse(testCallAgent.hasDisposeBeenCalled) // Call wasn't set up
        assertFalse(testCall.stateChangedListenerIsSet)
        assertFalse(testCall.remoteParticipantsUpdatedListenerIsSet)
        assertFalse(testCall.statisticsAreReporting)
    }

    @Test
    fun testFinishedStateOnlyCalledOnceWhenHangingUpCall() = testScope.runTest {
        val states = mutableListOf<State>()
        val job = viewModel.currentState.onEach { state -> states.add(state) }.launchIn(this)

        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.hangUp()
        testCall.completeHangup()

        testCall.setCallEndReason(ICall.CallEndedReason.USER_HUNG_UP)
        testCall.setCallState(CallState.DISCONNECTED)

        testDispatcher.scheduler.advanceUntilIdle()
        job.cancel()

        assertEquals(listOf(State.JOINING_MEETING, State.FINISHED), states)
    }

    @Test
    fun testFinishedStateOnlyCalledOnceWhenHangingUpCallEarly() = testScope.runTest {
        val states = mutableListOf<State>()
        val job = viewModel.currentState.onEach { state -> states.add(state) }.launchIn(this)

        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.hangUp()
        testCall.completeHangup()

        testCall.setCallEndReason(ICall.CallEndedReason.USER_HUNG_UP)
        testCall.setCallState(CallState.DISCONNECTED)

        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(listOf(State.LOADING, State.FINISHED), states)

        job.cancel()
    }

    @Test
    fun testCameraStreamsArentStartedWhenJoiningToLobby() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)

        assertEquals(State.IN_LOBBY, viewModel.currentState.value)
        assertFalse(testAcsRepository.hasStreamClassicCameraVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasDisplayClassicCameraVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasStreamThermalVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasDisplayThermalVideoStreamBeenCalled)
    }

    @Test
    fun testCameraStreamsAreStoppedWhenReturningToLobby() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        // Rest to ensure no camera streams are restarted later.
        testAcsRepository.hasStreamClassicCameraVideoStreamBeenCalled = false
        testAcsRepository.hasDisplayClassicCameraVideoStreamBeenCalled = false
        testAcsRepository.hasStreamThermalVideoStreamBeenCalled = false
        testAcsRepository.hasDisplayThermalVideoStreamBeenCalled = false

        testCall.removeParticipant(TEST_PARTICIPANT1)

        assertEquals(State.IN_LOBBY, viewModel.currentState.value)
        assertFalse(testAcsRepository.hasStreamClassicCameraVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasDisplayClassicCameraVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasStreamThermalVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasDisplayThermalVideoStreamBeenCalled)
        assertTrue(testAcsRepository.hasStopStreamingBeenCalled)
    }

    @Test
    fun testCameraStreamsAreStartedWhenLeavingLobby() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        assertTrue(testAcsRepository.hasStreamClassicCameraVideoStreamBeenCalled)
        assertTrue(testAcsRepository.hasDisplayClassicCameraVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasStreamThermalVideoStreamBeenCalled)
        assertFalse(testAcsRepository.hasDisplayThermalVideoStreamBeenCalled)
    }

    @Test
    fun testStartingScreenSharePutsMainCameraToPip() = testScope.runTest {
        testAcsRepository.setTestVideoStreamRendererView(TestFrameLayout(activity))
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(
            listOf(
                VideoStreamRequest.CLASSIC_CAMERA,
                VideoStreamRequest.REMOTE,
                VideoStreamRequest.CLASSIC_CAMERA // PIP
            ),
            testAcsRepository.videoStreamRequests
        )
        assertNotNull(viewModel.pipRendererViewState.value)
    }

    @Test
    fun testStartingScreenSharePutsThermalCameraToPip() = testScope.runTest {
        testAcsRepository.setTestVideoStreamRendererView(TestFrameLayout(activity))
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(
            listOf(
                VideoStreamRequest.CLASSIC_CAMERA,
                VideoStreamRequest.THERMAL,
                VideoStreamRequest.REMOTE,
                VideoStreamRequest.THERMAL // PIP
            ),
            testAcsRepository.videoStreamRequests
        )
        assertNotNull(viewModel.pipRendererViewState.value)
    }

    @Test
    fun testSwitchingToThermalCameraWhenInPip() = testScope.runTest {
        testAcsRepository.setTestVideoStreamRendererView(TestFrameLayout(activity))
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(
            listOf(
                VideoStreamRequest.CLASSIC_CAMERA,
                VideoStreamRequest.REMOTE,
                VideoStreamRequest.CLASSIC_CAMERA, // PIP
                VideoStreamRequest.THERMAL
            ),
            testAcsRepository.videoStreamRequests
        )
        assertNotNull(viewModel.pipRendererViewState.value)
    }

    @Test
    fun testSwitchingToMainCameraWhenInPip() = testScope.runTest {
        testAcsRepository.setTestVideoStreamRendererView(TestFrameLayout(activity))
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.switchToClassicCamera(activity, lifecycleOwner)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(
            listOf(
                VideoStreamRequest.CLASSIC_CAMERA,
                VideoStreamRequest.THERMAL,
                VideoStreamRequest.REMOTE,
                VideoStreamRequest.THERMAL, // PIP
                VideoStreamRequest.CLASSIC_CAMERA
            ),
            testAcsRepository.videoStreamRequests
        )
        assertNotNull(viewModel.pipRendererViewState.value)
    }

    @Test
    fun testTurningCameraOffWhenInPip() = testScope.runTest {
        testAcsRepository.setTestVideoStreamRendererView(TestFrameLayout(activity))
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(
            listOf(
                VideoStreamRequest.CLASSIC_CAMERA,
                VideoStreamRequest.REMOTE,
                VideoStreamRequest.CLASSIC_CAMERA
            ),
            testAcsRepository.videoStreamRequests
        )
        assertEquals(true, viewModel.isPipActive.value)
        assertNull(viewModel.pipRendererViewState.value)
    }

    @Test
    fun testStartingScreenShareWhenCameraIsOffShowsPipWithCameraOff() = testScope.runTest {
        testAcsRepository.setTestVideoStreamRendererView(TestFrameLayout(activity))
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(
            listOf(
                VideoStreamRequest.CLASSIC_CAMERA,
                VideoStreamRequest.REMOTE,
            ),
            testAcsRepository.videoStreamRequests
        )
        assertEquals(true, viewModel.isPipActive.value)
        assertNull(viewModel.pipRendererViewState.value)
    }

    @Test
    fun testEndingScreenShareWhenCameraIsOffHidesPip() = testScope.runTest {
        testAcsRepository.setTestVideoStreamRendererView(TestFrameLayout(activity))
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, false)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(false, viewModel.isPipActive.value)
        assertNull(viewModel.pipRendererViewState.value)
    }

    @Test
    fun testScreenSharingParticipantLeavingCall() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.addParticipant(TEST_PARTICIPANT2)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testCall.removeParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(
            listOf(
                VideoStreamRequest.CLASSIC_CAMERA,
                VideoStreamRequest.REMOTE,
                VideoStreamRequest.CLASSIC_CAMERA, // PIP
                VideoStreamRequest.CLASSIC_CAMERA,
            ),
            testAcsRepository.videoStreamRequests
        )
    }

    @Test
    fun testScreenSharingParticipantLeavingCallToLobby() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testCall.removeParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(State.IN_LOBBY, viewModel.currentState.value)
        assertEquals(
            listOf(
                VideoStreamRequest.CLASSIC_CAMERA,
                VideoStreamRequest.REMOTE,
                VideoStreamRequest.CLASSIC_CAMERA // PIP
            ),
            testAcsRepository.videoStreamRequests
        )
    }

    @Test
    fun testThermalCameraIsReShownWhenComingBackFromLobby() = testScope.runTest {
        val testVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(testVideoStreamRendererView)
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.CONNECTED)
        testCall.addParticipant(TEST_PARTICIPANT1)
        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(Camera.THERMAL, viewModel.currentCamera.value)

        testCall.removeParticipant(TEST_PARTICIPANT1)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(Camera.THERMAL, viewModel.currentCamera.value)
        assertEquals(
            listOf(VideoStreamRequest.CLASSIC_CAMERA, VideoStreamRequest.THERMAL, VideoStreamRequest.THERMAL),
            testAcsRepository.videoStreamRequests
        )
    }

    @Test
    fun testParticipantsAreOrderedByWhenTheyJoined() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.addParticipant(TEST_PARTICIPANT2)
        testCall.addParticipant(TEST_PARTICIPANT3)
        testCall.addParticipant(TEST_PARTICIPANT4)
        testCall.addParticipant(TEST_PARTICIPANT5)
        testCall.setCallState(CallState.CONNECTED)

        assertEquals(
            listOf(
                TEST_PARTICIPANT1,
                TEST_PARTICIPANT2,
                TEST_PARTICIPANT3,
                TEST_PARTICIPANT4,
                TEST_PARTICIPANT5
            ),
            viewModel.participants.value
        )
    }

    @Test
    fun testTalkingParticipantDoesNotMoveWhenAlreadyDisplayed() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.addParticipant(TEST_PARTICIPANT2)
        testCall.setCallState(CallState.CONNECTED)

        testCall.startParticipantTalking(TEST_PARTICIPANT2, true)

        assertEquals(
            arrayListOf(
                TEST_PARTICIPANT1,
                TEST_PARTICIPANT2.copy(isTalking = true)
            ),
            viewModel.participants.value
        )
    }

    @Test
    fun testTalkingParticipantMovesToTopIfTheyAreNotShownAndNoOneIsTalking() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.addParticipant(TEST_PARTICIPANT2)
        testCall.addParticipant(TEST_PARTICIPANT3)
        testCall.addParticipant(TEST_PARTICIPANT4)
        testCall.addParticipant(TEST_PARTICIPANT5)
        testCall.setCallState(CallState.CONNECTED)

        testCall.startParticipantTalking(TEST_PARTICIPANT5, true)

        assertEquals(
            listOf(
                TEST_PARTICIPANT5.copy(isTalking = true),
                TEST_PARTICIPANT2,
                TEST_PARTICIPANT3,
                TEST_PARTICIPANT4,
                TEST_PARTICIPANT1,
            ),
            viewModel.participants.value
        )
    }

    @Test
    fun testTalkingParticipantMovesToBottomOfExistingTalkers() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT2.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT3.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT4)
        testCall.addParticipant(TEST_PARTICIPANT5)
        testCall.setCallState(CallState.CONNECTED)

        testCall.startParticipantTalking(TEST_PARTICIPANT5, true)

        assertEquals(
            listOf(
                TEST_PARTICIPANT1.copy(isTalking = true),
                TEST_PARTICIPANT2.copy(isTalking = true),
                TEST_PARTICIPANT3.copy(isTalking = true),
                TEST_PARTICIPANT5.copy(isTalking = true),
                TEST_PARTICIPANT4,
            ),
            viewModel.participants.value
        )
    }

    @Test
    fun testTalkingParticipantDoesNotAppearIfNoRoom() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT2.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT3.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT4.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT5)
        testCall.setCallState(CallState.CONNECTED)

        testCall.startParticipantTalking(TEST_PARTICIPANT5, true)

        assertEquals(
            listOf(
                TEST_PARTICIPANT1.copy(isTalking = true),
                TEST_PARTICIPANT2.copy(isTalking = true),
                TEST_PARTICIPANT3.copy(isTalking = true),
                TEST_PARTICIPANT4.copy(isTalking = true),
                TEST_PARTICIPANT5.copy(isTalking = true),
            ),
            viewModel.participants.value
        )
    }

    @Test
    fun testExistingTalkingParticipantAppearsWhenRoomBecomesAvailableDueToParticipantStopTalking() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT2.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT3.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT4.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT5.copy(isTalking = true))
        testCall.setCallState(CallState.CONNECTED)

        testCall.startParticipantTalking(TEST_PARTICIPANT3, false)

        assertEquals(
            listOf(
                TEST_PARTICIPANT1.copy(isTalking = true),
                TEST_PARTICIPANT2.copy(isTalking = true),
                TEST_PARTICIPANT5.copy(isTalking = true),
                TEST_PARTICIPANT4.copy(isTalking = true),
                TEST_PARTICIPANT3,
            ),
            viewModel.participants.value
        )
    }

    @Test
    fun testExistingTalkingParticipantAppearsWhenRoomBecomesAvailableDueToParticipantLeaving() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT2.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT3.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT4.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT5.copy(isTalking = true))
        testCall.setCallState(CallState.CONNECTED)

        testCall.removeParticipant(TEST_PARTICIPANT3)

        assertEquals(
            listOf(
                TEST_PARTICIPANT1.copy(isTalking = true),
                TEST_PARTICIPANT2.copy(isTalking = true),
                TEST_PARTICIPANT5.copy(isTalking = true),
                TEST_PARTICIPANT4.copy(isTalking = true)
            ),
            viewModel.participants.value
        )
    }

    @Test
    fun testLongestExistingTalkingParticipantAppearsWhenRoomBecomesAvailableDueToParticipantStopTalking() =
        testScope.runTest {
            viewModel.onPermissionsResult(
                activity,
                lifecycleOwner,
                emptyMap(),
                USER_TOKEN,
                MEETING_LINK,
                PARTICIPANT_NAME,
                MEETING_NAME
            )
            testDispatcher.scheduler.advanceUntilIdle()

            testCall.addParticipant(TEST_PARTICIPANT1.copy(isTalking = true))
            testCall.addParticipant(TEST_PARTICIPANT2.copy(isTalking = true))
            testCall.addParticipant(TEST_PARTICIPANT3.copy(isTalking = true))
            testCall.addParticipant(TEST_PARTICIPANT4.copy(isTalking = true))
            testCall.addParticipant(TEST_PARTICIPANT5)
            testCall.addParticipant(TEST_PARTICIPANT6)
            testCall.setCallState(CallState.CONNECTED)

            testCall.startParticipantTalking(TEST_PARTICIPANT6, true)
            testCall.startParticipantTalking(TEST_PARTICIPANT5, true)
            testCall.startParticipantTalking(TEST_PARTICIPANT2, false)

            assertEquals(
                listOf(
                    TEST_PARTICIPANT1.copy(isTalking = true),
                    TEST_PARTICIPANT6.copy(isTalking = true),
                    TEST_PARTICIPANT3.copy(isTalking = true),
                    TEST_PARTICIPANT4.copy(isTalking = true),
                    TEST_PARTICIPANT5.copy(isTalking = true),
                    TEST_PARTICIPANT2,
                ),
                viewModel.participants.value
            )
        }

    @Test
    fun testLongestExistingTalkingParticipantAppearsWhenRoomBecomesAvailableDueToParticipantLeaving() =
        testScope.runTest {
            viewModel.onPermissionsResult(
                activity,
                lifecycleOwner,
                emptyMap(),
                USER_TOKEN,
                MEETING_LINK,
                PARTICIPANT_NAME,
                MEETING_NAME
            )
            testDispatcher.scheduler.advanceUntilIdle()

            testCall.addParticipant(TEST_PARTICIPANT1.copy(isTalking = true))
            testCall.addParticipant(TEST_PARTICIPANT2.copy(isTalking = true))
            testCall.addParticipant(TEST_PARTICIPANT3.copy(isTalking = true))
            testCall.addParticipant(TEST_PARTICIPANT4.copy(isTalking = true))
            testCall.addParticipant(TEST_PARTICIPANT5)
            testCall.addParticipant(TEST_PARTICIPANT6)
            testCall.setCallState(CallState.CONNECTED)

            testCall.startParticipantTalking(TEST_PARTICIPANT6, true)
            testCall.startParticipantTalking(TEST_PARTICIPANT5, true)
            testCall.removeParticipant(TEST_PARTICIPANT2)

            assertEquals(
                listOf(
                    TEST_PARTICIPANT1.copy(isTalking = true),
                    TEST_PARTICIPANT6.copy(isTalking = true),
                    TEST_PARTICIPANT3.copy(isTalking = true),
                    TEST_PARTICIPANT4.copy(isTalking = true),
                    TEST_PARTICIPANT5.copy(isTalking = true)
                ),
                viewModel.participants.value
            )
        }

    @Test
    fun testTalkingParticipantReplacesNonTalkingParticipantInMiddleOfTopList() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT2)
        testCall.addParticipant(TEST_PARTICIPANT3.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT4.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT5)
        testCall.setCallState(CallState.CONNECTED)

        testCall.startParticipantTalking(TEST_PARTICIPANT5, true)

        assertEquals(
            listOf(
                TEST_PARTICIPANT1.copy(isTalking = true),
                TEST_PARTICIPANT5.copy(isTalking = true),
                TEST_PARTICIPANT3.copy(isTalking = true),
                TEST_PARTICIPANT4.copy(isTalking = true),
                TEST_PARTICIPANT2,
            ),
            viewModel.participants.value
        )
    }

    @Test
    fun testTalkingParticipantReplacesHighestNonTalkingParticipantInMiddleOfTopList() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.addParticipant(TEST_PARTICIPANT1.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT2)
        testCall.addParticipant(TEST_PARTICIPANT3)
        testCall.addParticipant(TEST_PARTICIPANT4.copy(isTalking = true))
        testCall.addParticipant(TEST_PARTICIPANT5)
        testCall.setCallState(CallState.CONNECTED)

        testCall.startParticipantTalking(TEST_PARTICIPANT5, true)

        assertEquals(
            listOf(
                TEST_PARTICIPANT1.copy(isTalking = true),
                TEST_PARTICIPANT5.copy(isTalking = true),
                TEST_PARTICIPANT3,
                TEST_PARTICIPANT4.copy(isTalking = true),
                TEST_PARTICIPANT2,
            ),
            viewModel.participants.value
        )
    }

    @Test
    fun testMutingMicrophone() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.muteMic(true)
        assertEquals(StreamingState.OFF, viewModel.micState.value)
        assertTrue(testCall.microphoneIsMuted)
    }

    @Test
    fun testUnmutingMicrophone() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        viewModel.muteMic(true)

        viewModel.muteMic(false)

        assertEquals(StreamingState.LIVE, viewModel.micState.value)
        assertFalse(testCall.microphoneIsMuted)
    }

    @Test
    fun testMutingMicrophoneManuallyDoesNotTriggerToast() = testScope.runTest {
        val toastMessages = mutableListOf<String>()
        val job = viewModel.toastMessage.onEach { message -> toastMessages.add(message) }.launchIn(this)

        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.muteMic(true)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(emptyList<String>(), toastMessages)
        assertEquals(StreamingState.OFF, viewModel.micState.value)
        assertTrue(testCall.microphoneIsMuted)

        job.cancel()
    }

    @Test
    fun testMutedByOthersTriggersToast() = testScope.runTest {
        val toastMessages = mutableListOf<String>()
        val job = viewModel.toastMessage.onEach { message -> toastMessages.add(message) }.launchIn(this)

        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.muteByOther()
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(1, toastMessages.size)
        assertEquals(StreamingState.OFF, viewModel.micState.value)
        assertTrue(testCall.microphoneIsMuted)

        job.cancel()
    }

    @Test
    fun testHidingMainCamera() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)

        assertEquals(StreamingState.OFF, viewModel.cameraState.value)
        assertTrue(testAcsRepository.hasStopStreamingBeenCalled)
        assertTrue(testCallAgent.hasStopOutgoingVideoBeenCalled)
    }

    @Test
    fun testHidingThermalCamera() = testScope.runTest {
        val testVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(testVideoStreamRendererView)
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(Camera.THERMAL, viewModel.currentCamera.value)

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)

        assertEquals(StreamingState.OFF, viewModel.cameraState.value)
        assertTrue(testAcsRepository.hasStopStreamingBeenCalled)
        assertTrue(testCallAgent.hasStopOutgoingVideoBeenCalled)
    }

    @Test
    fun testHidingMainCameraThenSwitchingToThermalCamera() = testScope.runTest {
        val testVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(testVideoStreamRendererView)
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)
        viewModel.switchToThermalCamera(activity)

        assertEquals(StreamingState.OFF, viewModel.cameraState.value)
        assertEquals(Camera.THERMAL, viewModel.currentCamera.value)
    }

    @Test
    fun testHidingMainCameraThenShowingThermalCamera() = testScope.runTest {
        val testVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(testVideoStreamRendererView)
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)
        viewModel.switchToThermalCamera(activity)
        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.LIVE)

        assertEquals(StreamingState.LIVE, viewModel.cameraState.value)
        assertEquals(Camera.THERMAL, viewModel.currentCamera.value)
    }

    @Test
    fun testHidingThermalCameraThenSwitchingToMainCamera() = testScope.runTest {
        val testVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(testVideoStreamRendererView)
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.switchToThermalCamera(activity)
        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)
        viewModel.switchToClassicCamera(activity, lifecycleOwner)

        assertEquals(StreamingState.OFF, viewModel.cameraState.value)
        assertEquals(Camera.CLASSIC, viewModel.currentCamera.value)
    }

    @Test
    fun testHidingThermalCameraThenShowingMainCamera() = testScope.runTest {
        val testVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(testVideoStreamRendererView)
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.switchToThermalCamera(activity)
        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)
        viewModel.switchToClassicCamera(activity, lifecycleOwner)
        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.LIVE)

        assertEquals(StreamingState.LIVE, viewModel.cameraState.value)
        assertEquals(Camera.CLASSIC, viewModel.currentCamera.value)
    }

    @Test
    fun testVideoIsStoppedOnPause() = testScope.runTest {
        val testVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(testVideoStreamRendererView)
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.onPause(activity, lifecycleOwner)

        assertEquals(StreamingState.PAUSED, viewModel.cameraState.value)
    }

    @Test
    fun testVideoIsRestartedOnResume() = testScope.runTest {
        val testVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(testVideoStreamRendererView)
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.onPause(activity, lifecycleOwner)
        viewModel.onResume(activity, lifecycleOwner)

        assertEquals(StreamingState.LIVE, viewModel.cameraState.value)
    }

    @Test
    fun testVideoDoesNotStartOnResumeIfStoppedBefore() = testScope.runTest {
        val testVideoStreamRendererView = TestFrameLayout(activity)
        testAcsRepository.setTestVideoStreamRendererView(testVideoStreamRendererView)
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)
        viewModel.onPause(activity, lifecycleOwner)
        viewModel.onResume(activity, lifecycleOwner)

        assertEquals(StreamingState.OFF, viewModel.cameraState.value)
    }

    @Test
    fun testCallDoesNotRestartWhenRestartingApp() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.CONNECTED)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)

        testCallAgent.hasJoinBeenCalled = false
        testAcsRepository.hasJoinCallBeenCalled = false
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        assertFalse(testCallAgent.hasJoinBeenCalled)
        assertFalse(testAcsRepository.hasJoinCallBeenCalled)
        assertEquals(State.IN_LOBBY, viewModel.currentState.value)
    }

    @Test
    fun testReturningToMainCameraFromRemote() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)
        assertEquals(StreamingState.LIVE, viewModel.cameraState.value)
        assertEquals(Camera.CLASSIC, viewModel.currentCamera.value)

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, false)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(
            listOf(
                VideoStreamRequest.CLASSIC_CAMERA,
                VideoStreamRequest.REMOTE,
                VideoStreamRequest.CLASSIC_CAMERA, // PIP
                VideoStreamRequest.CLASSIC_CAMERA
            ),
            testAcsRepository.videoStreamRequests
        )
        assertEquals(State.IN_MEETING, viewModel.currentState.value)
        assertEquals(StreamingState.LIVE, viewModel.cameraState.value)
    }

    @Test
    fun testReturningToThermalCameraFromRemote() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)
        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()
        assertEquals(State.IN_MEETING, viewModel.currentState.value)
        assertEquals(StreamingState.LIVE, viewModel.cameraState.value)
        assertEquals(Camera.THERMAL, viewModel.currentCamera.value)

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, false)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(
            listOf(
                VideoStreamRequest.CLASSIC_CAMERA,
                VideoStreamRequest.THERMAL,
                VideoStreamRequest.REMOTE,
                VideoStreamRequest.THERMAL, // PIP
                VideoStreamRequest.THERMAL
            ),
            testAcsRepository.videoStreamRequests
        )
        assertEquals(State.IN_MEETING, viewModel.currentState.value)
        assertEquals(StreamingState.LIVE, viewModel.cameraState.value)
    }

    @Test
    fun testUserEntersTeamsLobby() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.setCallState(CallState.IN_LOBBY)

        assertEquals(State.IN_TEAMS_LOBBY, viewModel.currentState.value)
    }

    @Test
    fun testUserEntersLobbyWhenLetInWithNoUsers() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.setCallState(CallState.CONNECTED)

        assertEquals(State.IN_LOBBY, viewModel.currentState.value)
    }

    @Test
    fun testUserEntersCallWhenLetInWithUsers() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        assertEquals(State.IN_MEETING, viewModel.currentState.value)
    }

    @Test
    fun testTurningOffCameraDisablesCameraDisplay() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)

        assertEquals(true, viewModel.isCameraDisplayDisabled.value)
        assertEquals(false, viewModel.isCameraDisplayPipDisabled.value)
    }

    @Test
    fun testTurningOffCameraInPipDisablesCameraPipDisplay() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)

        assertEquals(false, viewModel.isCameraDisplayDisabled.value)
        assertEquals(true, viewModel.isCameraDisplayPipDisabled.value)
    }

    @Test
    fun testTurningOffCameraThenGoingToPipDisablesCameraPipDisplay() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(false, viewModel.isCameraDisplayDisabled.value)
        assertEquals(true, viewModel.isCameraDisplayPipDisabled.value)
    }

    @Test
    fun testTurningOffCameraThenLeavingPipDisablesCameraDisplay() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.setCameraState(activity, lifecycleOwner, StreamingState.OFF)
        testDispatcher.scheduler.advanceUntilIdle()

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, false)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(true, viewModel.isCameraDisplayDisabled.value)
        assertEquals(false, viewModel.isCameraDisplayPipDisabled.value)
    }

    @Test
    fun testCameraIsPausedWhenNavigatingHomeWhileScreenShareIsActive() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.onPause(activity, lifecycleOwner)
        testDispatcher.scheduler.advanceUntilIdle()

        // ACS calls remoteParticipantVideoStreamStateChangedListener when pausing video stream.
        testCall.startParticipantScreenShare(TEST_PARTICIPANT1, true)
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(StreamingState.PAUSED, viewModel.cameraState.value)
    }

    @Test
    fun testCanFreezeMainCamera() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        assertTrue(viewModel.canFreezeFrame())
    }

    @Test
    fun testCanNotFreezeThermalCamera() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)
        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()

        assertFalse(viewModel.canFreezeFrame())
    }

    @Test
    fun testFreezingMainCamera() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.freezeFrame(true)

        assertEquals(State.IN_MEETING, viewModel.currentState.value)
        assertEquals(true, viewModel.isFreezeFrame.value)
        assertEquals(true, testAcsRepository.isFreezeFrame)
    }

    @Test
    fun testCanZoomMainCamera() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        assertTrue(viewModel.canZoom())
    }

    @Test
    fun testCanNotZoomThermalCamera() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)
        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()

        assertFalse(viewModel.canZoom())
    }

    @Test
    fun testZoomingIn() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        val result = viewModel.zoomIn()

        assertTrue(result)
        assertEquals(2, viewModel.zoomLevel.value)
    }

    @Test
    fun testZoomingInTooFar() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.setZoom(5)
        val result = viewModel.zoomIn()

        assertFalse(result)
        assertEquals(5, viewModel.zoomLevel.value)
    }

    @Test
    fun testZoomingOut() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.setZoom(4)
        val result = viewModel.zoomOut()

        assertTrue(result)
        assertEquals(3, viewModel.zoomLevel.value)
    }

    @Test
    fun testZoomingOutTooFar() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.setZoom(1)
        val result = viewModel.zoomOut()

        assertFalse(result)
        assertEquals(1, viewModel.zoomLevel.value)
    }

    @Test
    fun testSettingZoomLevels() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        assertFalse(viewModel.setZoom(0))
        assertTrue(viewModel.setZoom(1))
        assertTrue(viewModel.setZoom(2))
        assertTrue(viewModel.setZoom(3))
        assertTrue(viewModel.setZoom(4))
        assertTrue(viewModel.setZoom(5))
        assertFalse(viewModel.setZoom(6))
    }

    @Test
    fun testCanSetFlashMainCamera() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        assertTrue(viewModel.canSetFlash())
    }

    @Test
    fun testCanNotSetFlashThermalCamera() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)
        viewModel.switchToThermalCamera(activity)
        testDispatcher.scheduler.advanceUntilIdle()

        assertFalse(viewModel.canSetFlash())
    }

    @Test
    fun testTurningOnFlash() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)

        viewModel.setFlash(true)

        assertEquals(true, viewModel.isFlashOn.value)
    }

    @Test
    fun testTurningOffFlash() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()
        testCall.setCallState(CallState.IN_LOBBY)

        testCall.addParticipant(TEST_PARTICIPANT1)
        testCall.setCallState(CallState.CONNECTED)
        viewModel.setFlash(true)

        viewModel.setFlash(false)

        assertEquals(false, viewModel.isFlashOn.value)
    }

    @Test
    fun testCanUseTranscription() = testScope.runTest {
        testTranscriptionRepository.canUseTranscription = true
        assertTrue(viewModel.canUseTranscription())
    }

    @Test
    fun testCanNotUseTranscription() = testScope.runTest {
        testTranscriptionRepository.canUseTranscription = false
        assertFalse(viewModel.canUseTranscription())
    }

    @Test
    fun testStartingIncomingTranscription() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.startIncomingTranscription()

        assertEquals(true, viewModel.isTranscriptionOn.value)
        assertTrue(testCallAgent.hasGetIncomingAudioQueueBeenCalled)
        assertTrue(testTranscriptionRepository.hasSetupBeenCalled)
        assertTrue(testTranscriptionRepository.hasStartIncomingTranscriptionBeenCalled)
        assertTrue(testCallAgent.hasCaptureIncomingAudioBeenCalled)
        assertFalse(testCallAgent.hasReleaseIncomingAudioQueueBeenCalled)
    }

    @Test
    fun testStartingIncomingTranscriptionWhenSetUpFails() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        testTranscriptionRepository.isSetupSuccessful = false
        viewModel.startIncomingTranscription()

        assertEquals(false, viewModel.isTranscriptionOn.value)
        assertTrue(testCallAgent.hasGetIncomingAudioQueueBeenCalled)
        assertTrue(testTranscriptionRepository.hasSetupBeenCalled)
        assertFalse(testTranscriptionRepository.hasStartIncomingTranscriptionBeenCalled)
        assertFalse(testCallAgent.hasCaptureIncomingAudioBeenCalled)
        assertTrue(testCallAgent.hasReleaseIncomingAudioQueueBeenCalled)
    }

    @Test
    fun testStartingIncomingTranscriptionWhenAlreadyRunning() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        // Start successfully, then reset all flags
        viewModel.startIncomingTranscription()
        testDispatcher.scheduler.advanceUntilIdle()
        testCallAgent.hasGetIncomingAudioQueueBeenCalled = false
        testTranscriptionRepository.hasSetupBeenCalled = false
        testTranscriptionRepository.hasStartIncomingTranscriptionBeenCalled = false
        testCallAgent.hasCaptureIncomingAudioBeenCalled = false

        // Try to start a second time
        viewModel.startIncomingTranscription()
        testDispatcher.scheduler.advanceUntilIdle()

        assertEquals(true, viewModel.isTranscriptionOn.value)
        assertFalse(testCallAgent.hasGetIncomingAudioQueueBeenCalled)
        assertFalse(testTranscriptionRepository.hasSetupBeenCalled)
        assertFalse(testTranscriptionRepository.hasStartIncomingTranscriptionBeenCalled)
        assertFalse(testCallAgent.hasCaptureIncomingAudioBeenCalled)
        assertFalse(testCallAgent.hasReleaseIncomingAudioQueueBeenCalled)
    }

    @Test
    fun testStoppingIncomingTranscription() = testScope.runTest {
        viewModel.onPermissionsResult(
            activity,
            lifecycleOwner,
            emptyMap(),
            USER_TOKEN,
            MEETING_LINK,
            PARTICIPANT_NAME,
            MEETING_NAME
        )
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.stopIncomingTranscription()

        assertEquals(false, viewModel.isTranscriptionOn.value)
        assertTrue(testCallAgent.hasReleaseIncomingAudioBeenCalled)
        assertTrue(testTranscriptionRepository.hasStopIncomingTranscription)
        assertTrue(testTranscriptionRepository.hasTeardownBeenCalled)
        assertTrue(testCallAgent.hasReleaseIncomingAudioQueueBeenCalled)
    }

    companion object {
        const val USER_TOKEN = "FAKE_USER_TOKEN"
        const val MEETING_LINK = "https://teams.microsoft.com/l/meetup-join/1234567890"
        const val PARTICIPANT_NAME = "John Doe"
        const val MEETING_NAME = "Test Meeting"

        val TEST_PARTICIPANT1 = Participant(identifier = "1", firstName = "User", lastName = "1", isTalking = false)
        val TEST_PARTICIPANT2 = Participant(identifier = "2", firstName = "User", lastName = "2", isTalking = false)
        val TEST_PARTICIPANT3 = Participant(identifier = "3", firstName = "User", lastName = "3", isTalking = false)
        val TEST_PARTICIPANT4 = Participant(identifier = "4", firstName = "User", lastName = "4", isTalking = false)
        val TEST_PARTICIPANT5 = Participant(identifier = "5", firstName = "User", lastName = "5", isTalking = false)
        val TEST_PARTICIPANT6 = Participant(identifier = "6", firstName = "User", lastName = "6", isTalking = false)
    }
}
