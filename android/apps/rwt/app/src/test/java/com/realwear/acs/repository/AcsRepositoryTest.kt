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
package com.realwear.acs.repository

import android.app.Application
import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.realwear.acs.repository.AcsRepository.Companion.CurrentRenderer
import com.realwear.acs.testutil.TestApplication
import com.realwear.acs.testutil.TestCall
import com.realwear.acs.testutil.TestCallAgent
import com.realwear.acs.testutil.TestCameraRepository
import com.realwear.acs.testutil.TestEisManager
import com.realwear.acs.testutil.TestOutgoingVideoStream
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.junit.MockitoJUnitRunner

@ExperimentalCoroutinesApi
@RunWith(MockitoJUnitRunner::class)
class AcsRepositoryTest {
    @get:Rule
    var instantTaskExecutorRule = InstantTaskExecutorRule()

    @ExperimentalCoroutinesApi
    private val testDispatcher = StandardTestDispatcher()

    @ExperimentalCoroutinesApi
    private val testScope = TestScope(testDispatcher)

    @Mock
    lateinit var mockApplication: Application

    private lateinit var acsRepository: AcsRepository
    private lateinit var testApplication: TestApplication

    private val testMainCameraRepository = TestCameraRepository(testScope)
    private val testThermalRepository = TestCameraRepository(testScope)

    private val testMainCameraOutgoingVideoStream = TestOutgoingVideoStream()
    private val testThermalOutgoingVideoStream = TestOutgoingVideoStream()

    private val testCall = TestCall()
    private val testCallAgent = TestCallAgent(testCall)

    private val testEisManager = TestEisManager()

    @Before
    fun setUp() {
        MockitoAnnotations.openMocks(this)

        acsRepository = AcsRepository(
            testMainCameraRepository,
            testThermalRepository,
            testMainCameraOutgoingVideoStream,
            testThermalOutgoingVideoStream,
            null,
            testEisManager
        )
        testApplication = TestApplication(mockApplication)
    }

    @Test
    fun testInitialState() = testScope.runTest {
        assertEquals(CurrentRenderer.NONE, acsRepository.currentRenderer)
    }

    @Test
    fun testDisplayClassicCameraVideoStreamUpdatesState() = testScope.runTest {
        acsRepository.displayClassicCameraVideoStream(testApplication)
        assertEquals(CurrentRenderer.CLASSIC_CAMERA, acsRepository.currentRenderer)
    }

    @Test
    fun testDisplayThermalCameraVideoStreamUpdatesState() = testScope.runTest {
        acsRepository.displayThermalVideoStream(testApplication, testScope)
        assertEquals(CurrentRenderer.THERMAL, acsRepository.currentRenderer)
    }

    @Test
    fun testDisplayRemoteVideoStreamUpdatesState() = testScope.runTest {
        acsRepository.displayRemoteVideoStream(testApplication, null)
        assertEquals(CurrentRenderer.REMOTE, acsRepository.currentRenderer)
    }

    @Test
    fun testFreezingFrameCameras() = testScope.runTest {
        acsRepository.freezeFrame(true)
        assertEquals(true, testMainCameraRepository.isFreezeFrame)
        assertEquals(true, testThermalRepository.isFreezeFrame)
    }

    @Test
    fun testCameraCalibrationIconAppears() = testScope.runTest {
        var calibratingList = mutableListOf<Boolean>()
        val calibrationStateJob = testScope.launch {
            acsRepository.calibrationState.collect { calibrating ->
                calibratingList.add(calibrating)
            }
        }

        acsRepository.streamThermalVideoStream(testApplication.application, testScope, testCallAgent)

        testThermalRepository.setCalibrationState(true)
        testDispatcher.scheduler.advanceUntilIdle()

        acsRepository.cleanUp(testApplication, testScope)
        testDispatcher.scheduler.advanceUntilIdle()

        calibrationStateJob.cancel()
        calibrationStateJob.join()

        assertEquals(listOf(false, true, false), calibratingList)
    }

    @Test
    fun testSetZoom() = testScope.runTest {
        acsRepository.setZoom(2)

        assertEquals(-1, testThermalRepository.zoomLevel)
        assertEquals(2, testMainCameraRepository.zoomLevel)
    }

    @Test
    fun testFlash() = testScope.runTest {
        acsRepository.setFlash(true)

        assertFalse( testThermalRepository.isFlashOn)
        assertTrue(testMainCameraRepository.isFlashOn)
    }
}
