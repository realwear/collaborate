/**
 * Copyright (C) 2024 RealWear, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
package com.realwear.acs.dependency

import android.content.Context
import com.azure.android.communication.calling.Call
import com.azure.android.communication.calling.CallState
import com.azure.android.communication.calling.CallVideoStream
import com.azure.android.communication.calling.Features
import com.azure.android.communication.calling.MediaStatisticsCallFeature
import com.azure.android.communication.calling.MediaStatisticsReportReceivedListener
import com.azure.android.communication.calling.ParticipantsUpdatedEvent
import com.azure.android.communication.calling.ParticipantsUpdatedListener
import com.azure.android.communication.calling.PropertyChangedEvent
import com.azure.android.communication.calling.PropertyChangedListener
import com.azure.android.communication.calling.RemoteParticipant
import com.azure.android.communication.calling.VideoStreamSourceType
import com.azure.android.communication.calling.VideoStreamState
import com.azure.android.communication.calling.VideoStreamStateChangedEvent
import com.azure.android.communication.calling.VideoStreamStateChangedListener
import com.azure.android.communication.common.CommunicationIdentifier
import com.realwear.acs.model.Participant
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentCaptor
import org.mockito.Captor
import org.mockito.Mock
import org.mockito.Mockito
import org.mockito.MockitoAnnotations
import org.mockito.junit.MockitoJUnitRunner

@ExperimentalCoroutinesApi
@RunWith(MockitoJUnitRunner::class)
class CallTest {
    private lateinit var callWrapper: CallWrapper

    @Mock
    private lateinit var mockCall: Call

    @Mock
    private lateinit var mockRemoteParticipant: RemoteParticipant

    @Mock
    private lateinit var mockPropertyChangedEvent: PropertyChangedEvent

    @Mock
    private lateinit var mockParticipantsUpdatedEvent: ParticipantsUpdatedEvent

    @Mock
    private lateinit var mockVideoStreamStateChangedEvent: VideoStreamStateChangedEvent

    @Mock
    private lateinit var mockMediaStatisticsCallFeature: MediaStatisticsCallFeature

    @Mock
    private lateinit var mockCallVideoStream: CallVideoStream

    @Mock
    private lateinit var mockContext: Context

    @Captor
    private lateinit var propertyChangedEventListenerCaptor: ArgumentCaptor<PropertyChangedListener>

    @Captor
    private lateinit var participantsUpdatedListenerCaptor: ArgumentCaptor<ParticipantsUpdatedListener>

    @Captor
    private lateinit var videoStreamStateChangedListenerCaptor: ArgumentCaptor<VideoStreamStateChangedListener>

    @Captor
    private lateinit var mediaStatisticsReportReceivedListenerCaptor:
            ArgumentCaptor<MediaStatisticsReportReceivedListener>

    @Before
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        callWrapper = CallWrapper(mockCall)

        //
        // Mock video stream values.
        //
        Mockito.`when`(mockCallVideoStream.state).thenReturn(VideoStreamState.AVAILABLE)
        Mockito.`when`(mockCallVideoStream.sourceType).thenReturn(VideoStreamSourceType.SCREEN_SHARING)
        Mockito.`when`(mockVideoStreamStateChangedEvent.stream).thenReturn(mockCallVideoStream)
    }

    @Test
    fun testInitialState() {
        Mockito.`when`(mockCall.state).thenReturn(CallState.NONE)
        assertEquals(CallState.NONE, callWrapper.state)
        assertEquals(emptyList<Participant>(), callWrapper.getParticipants())
    }

    @Test
    fun testGetParticipants() {
        //
        // Create a dummy participant.
        //
        Mockito.`when`(mockRemoteParticipant.identifier).thenReturn(TEST_IDENTIFIER)
        Mockito.`when`(mockRemoteParticipant.displayName).thenReturn(TEST_DISPLAY_NAME)
        Mockito.`when`(mockRemoteParticipant.isSpeaking).thenReturn(TEST_IS_SPEAKING)
        Mockito.`when`(mockCall.remoteParticipants).thenReturn(listOf(mockRemoteParticipant))

        val result = callWrapper.getParticipants()

        assertEquals(
            listOf(Participant(TEST_IDENTIFIER.rawId, TEST_FIRST_NAME, TEST_LAST_NAME, TEST_IS_SPEAKING)),
            result
        )
    }

    @Test
    fun testSetOnStateChangedListener() {
        var stateChanged = false

        callWrapper.setOnStateChangedListener { stateChanged = true }
        Mockito.verify(mockCall).addOnStateChangedListener(propertyChangedEventListenerCaptor.capture())
        propertyChangedEventListenerCaptor.value.onPropertyChanged(mockPropertyChangedEvent)

        assertTrue(stateChanged)
    }

    @Test
    fun testRemoveOnStateChangedListener() {
        callWrapper.setOnStateChangedListener { }
        callWrapper.removeOnStateChangedListener()

        Mockito.verify(mockCall).removeOnStateChangedListener(propertyChangedEventListenerCaptor.capture())
    }

    @Test
    fun testSetOnRemoteParticipantsUpdatedListener() {
        var remoteParticipantUpdated = false

        callWrapper.setOnRemoteParticipantsUpdatedListener { remoteParticipantUpdated = true }
        Mockito.verify(mockCall).addOnRemoteParticipantsUpdatedListener(participantsUpdatedListenerCaptor.capture())
        participantsUpdatedListenerCaptor.value.onParticipantsUpdated(mockParticipantsUpdatedEvent)

        assertTrue(remoteParticipantUpdated)
    }

    @Test
    fun testRemoveOnRemoteParticipantsUpdatedListener() {
        callWrapper.setOnRemoteParticipantsUpdatedListener { }
        callWrapper.removeOnRemoteParticipantsUpdatedListener()

        Mockito.verify(mockCall).removeOnRemoteParticipantsUpdatedListener(participantsUpdatedListenerCaptor.capture())
    }

    @Test
    fun testAddOnRemoteParticipantVideoStreamStateChangedListener() {
        var videoStreamStateChanged = false
        addParticipantToCall()

        val listener: (Boolean, CallVideoStream?) -> Unit = { _, _ -> videoStreamStateChanged = true }
        callWrapper.addOnRemoteParticipantVideoStreamStateChangedListener(TEST_IDENTIFIER.rawId, listener)
        Mockito.verify(mockRemoteParticipant)
            .addOnVideoStreamStateChangedListener(videoStreamStateChangedListenerCaptor.capture())
        videoStreamStateChangedListenerCaptor.value.onVideoStreamStateChanged(mockVideoStreamStateChangedEvent)

        assertTrue(videoStreamStateChanged)
    }

    @Test
    fun testRemoveOnRemoteParticipantVideoStreamStateChangedListener() {
        addParticipantToCall()

        val listener: (Boolean, CallVideoStream?) -> Unit = { _, _ -> }
        callWrapper.addOnRemoteParticipantVideoStreamStateChangedListener(TEST_IDENTIFIER.rawId, listener)
        callWrapper.removeOnRemoteParticipantVideoStreamStateChangedListener(TEST_IDENTIFIER.rawId, listener)

        Mockito.verify(mockRemoteParticipant)
            .removeOnVideoStreamStateChangedListener(videoStreamStateChangedListenerCaptor.capture())
    }

    @Test
    fun testAddOnRemoteParticipantSpeakingChangedListener() {
        var speakingStateChanged = false
        addParticipantToCall()

        val listener: (Boolean) -> Unit = { _ -> speakingStateChanged = true }
        callWrapper.addOnRemoteParticipantSpeakingChangedListener(TEST_IDENTIFIER.rawId, listener)
        Mockito.verify(mockRemoteParticipant)
            .addOnIsSpeakingChangedListener(propertyChangedEventListenerCaptor.capture())
        propertyChangedEventListenerCaptor.value.onPropertyChanged(mockPropertyChangedEvent)

        assertTrue(speakingStateChanged)
    }

    @Test
    fun testRemoveOnRemoteParticipantSpeakingChangedListener() {
        addParticipantToCall()

        val listener: (Boolean) -> Unit = { _ -> }
        callWrapper.addOnRemoteParticipantSpeakingChangedListener(TEST_IDENTIFIER.rawId, listener)
        callWrapper.removeOnRemoteParticipantSpeakingChangedListener(TEST_IDENTIFIER.rawId, listener)

        Mockito.verify(mockRemoteParticipant)
            .removeOnIsSpeakingChangedListener(propertyChangedEventListenerCaptor.capture())
    }

    @Test
    fun testSetOnMutedByOthersListener() {
        var mutedByOthers = false
        Mockito.`when`(mockCall.isOutgoingAudioMuted).thenReturn(true)

        callWrapper.setOnMutedByOthersListener { mutedByOthers = true }
        Mockito.verify(mockCall).addOnOutgoingAudioStateChangedListener(propertyChangedEventListenerCaptor.capture())
        propertyChangedEventListenerCaptor.value.onPropertyChanged(mockPropertyChangedEvent)

        assertTrue(mutedByOthers)
    }

    @Test
    fun testSetOnMutedByOthersListenerDoesNotCallWhenAlreadyMutedByUser() {
        var mutedByOthers = false
        Mockito.`when`(mockCall.isOutgoingAudioMuted).thenReturn(false)

        callWrapper.setOnMutedByOthersListener { mutedByOthers = true }
        Mockito.verify(mockCall).addOnOutgoingAudioStateChangedListener(propertyChangedEventListenerCaptor.capture())
        propertyChangedEventListenerCaptor.value.onPropertyChanged(mockPropertyChangedEvent)

        assertFalse(mutedByOthers)
    }

    @Test
    fun testRemoveOnMutedByOthersListener() {
        callWrapper.setOnMutedByOthersListener { }
        callWrapper.removeOnMutedByOthersListener()

        Mockito.verify(mockCall).removeOnOutgoingAudioStateChangedListener(propertyChangedEventListenerCaptor.capture())
    }

    @Test
    fun testStartLoggingStatistics() {
        Mockito.`when`(mockCall.feature(Features.MEDIA_STATISTICS)).thenReturn(mockMediaStatisticsCallFeature)

        callWrapper.startLoggingStatistics()

        Mockito.verify(mockMediaStatisticsCallFeature)
            .addOnReportReceivedListener(mediaStatisticsReportReceivedListenerCaptor.capture())
    }

    @Test
    fun testStopLoggingStatistics() {
        Mockito.`when`(mockCall.feature(Features.MEDIA_STATISTICS)).thenReturn(mockMediaStatisticsCallFeature)

        callWrapper.startLoggingStatistics()
        callWrapper.stopLoggingStatistics()

        Mockito.verify(mockMediaStatisticsCallFeature)
            .removeOnReportReceivedListener(mediaStatisticsReportReceivedListenerCaptor.capture())
    }

    @Test
    fun testMuteMicWithMute() {
        callWrapper.muteMic(mockContext, true)

        Mockito.verify(mockCall).muteOutgoingAudio(mockContext)
    }

    @Test
    fun testMuteMicWithUnMute() {
        callWrapper.muteMic(mockContext, false)

        Mockito.verify(mockCall).unmuteOutgoingAudio(mockContext)
    }

    @Test
    fun testHangUp() {
        try {
            callWrapper.hangUp()
        } catch (ex: NullPointerException) {
            // Expected as not in a call.
        }

        Mockito.verify(mockCall).hangUp()
    }

    private fun addParticipantToCall() {
        //
        // Create a dummy participant.
        //
        Mockito.`when`(mockRemoteParticipant.identifier).thenReturn(TEST_IDENTIFIER)
        Mockito.`when`(mockRemoteParticipant.displayName).thenReturn(TEST_DISPLAY_NAME)
        Mockito.`when`(mockRemoteParticipant.isSpeaking).thenReturn(TEST_IS_SPEAKING)

        // Mock a list of fake users when faking adding users to a call.
        Mockito.`when`(mockParticipantsUpdatedEvent.addedParticipants).thenReturn(listOf(mockRemoteParticipant))

        // Add the participant to the call.
        callWrapper.setOnRemoteParticipantsUpdatedListener { }
        Mockito.verify(mockCall).addOnRemoteParticipantsUpdatedListener(participantsUpdatedListenerCaptor.capture())
        participantsUpdatedListenerCaptor.value.onParticipantsUpdated(mockParticipantsUpdatedEvent)
    }

    companion object {
        private val TEST_IDENTIFIER = CommunicationIdentifier.fromRawId("123")
        private const val TEST_FIRST_NAME = "John"
        private const val TEST_LAST_NAME = "Doe"
        private const val TEST_DISPLAY_NAME = "John Doe"
        private const val TEST_IS_SPEAKING = false
    }
}