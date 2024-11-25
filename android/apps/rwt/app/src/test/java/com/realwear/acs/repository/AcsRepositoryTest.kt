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
