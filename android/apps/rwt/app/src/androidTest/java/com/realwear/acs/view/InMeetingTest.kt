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
package com.realwear.acs.view

import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsNotDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.realwear.acs.R
import com.realwear.acs.testutil.LocaleUtil
import com.realwear.acs.testutil.TestMeetingViewModel
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_A_ACTIVE_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_A_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_B_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_C_ACTIVE_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_C_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_OVERFLOW_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.assertNodeWithTagIsNotDisplayed
import com.realwear.acs.testutil.assertNodeWithTextIsDisplayed
import com.realwear.acs.testutil.assertNodeWithTextIsNotDisplayed
import com.realwear.acs.viewmodel.IMeetingViewModel
import com.realwear.acs.viewmodel.IMeetingViewModel.StreamingState
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized
import java.util.Locale

@RunWith(AndroidJUnit4::class)
class InMeetingTest {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun testInMeetingComposable() {
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = TestMeetingViewModel()
            )
        }

        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_ACTIVE_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_B_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_C_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_C_ACTIVE_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_OVERFLOW_CONTENT_DESCRIPTION).assertCountEquals(0)

        // Check that the buttons are displayed
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.hide_camera))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.mute_mic))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.thermal_camera))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.leave_meeting))
    }

    @Test
    fun testLeavingMeeting() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = testMeetingViewModel
            )
        }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting).uppercase())
            .performClick()

        // Check the meeting was hung up
        Assert.assertTrue(testMeetingViewModel.callHasBeenHungUp)
    }

    @Test
    fun testSwitchingCameraChangesButtonText() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = testMeetingViewModel
            )
        }
        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.classic_camera))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.thermal_camera))

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.thermal_camera)).performClick()

        // Check the state changes
        Assert.assertEquals(IMeetingViewModel.Camera.THERMAL, testMeetingViewModel.currentCamera.value)
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.classic_camera))
        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.thermal_camera))
    }

    @Test
    fun testThermalCameraButtonHiddenWhenNotAvailable() {
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = TestMeetingViewModel().apply {
                    thermalCameraIsAvailable = false
                }
            )
        }

        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.thermal_camera))
    }

    @Test
    fun testMuteMicChangesButtonText() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = testMeetingViewModel
            )
        }
        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.unmute_mic))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.mute_mic))

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.mute_mic)).performClick()

        // Check the state changes
        Assert.assertEquals(StreamingState.OFF, testMeetingViewModel.micState.value)
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.unmute_mic))
        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.mute_mic))
    }

    @Test
    fun testHideCameraChangesButtonText() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = testMeetingViewModel
            )
        }
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.hide_camera))
        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.show_camera))

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.hide_camera)).performClick()

        // Check the state changes
        Assert.assertEquals(StreamingState.OFF, testMeetingViewModel.cameraState.value)
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.show_camera))
        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.hide_camera))
    }

    @Test
    fun testShowingPip() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = testMeetingViewModel
            )
        }
        composeTestRule.assertNodeWithTagIsNotDisplayed(PIP_TAG)

        composeTestRule.runOnUiThread {
            testMeetingViewModel.showPip()
        }

        composeTestRule.onNodeWithTag(PIP_TAG).assertExists()
    }

    @Test
    fun testPipIsShownWhenCameraIsHidden() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = testMeetingViewModel
            )
        }

        composeTestRule.runOnUiThread {
            testMeetingViewModel.setCameraState(composeTestRule.activity, composeTestRule.activity, StreamingState.OFF)
            testMeetingViewModel.showPip()
        }

        composeTestRule.onNodeWithTag(PIP_TAG).assertExists()
    }

    @Test
    fun testShowingCalibrationIcon() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = testMeetingViewModel
            )
        }

        composeTestRule.assertNodeWithTagIsNotDisplayed(IRIS_TAG)

        composeTestRule.runOnUiThread {
            testMeetingViewModel.startCalibration(true)
        }

        composeTestRule.onNodeWithTag(IRIS_TAG).assertExists()
    }

    @Test
    fun testHidingCalibrationIcon() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = testMeetingViewModel
            )
        }
        composeTestRule.assertNodeWithTagIsNotDisplayed(IRIS_TAG)

        composeTestRule.runOnUiThread {
            testMeetingViewModel.startCalibration(true)
            testMeetingViewModel.startCalibration(false)
        }

        composeTestRule.assertNodeWithTagIsNotDisplayed(IRIS_TAG)
    }

    @Test
    fun testDisablingCameraShowsIcon() {
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = TestMeetingViewModel().apply {
                    disableCameraDisplay(true)
                }
            )
        }

        composeTestRule.onNodeWithTag(CAMERA_HIDDEN_TAG).assertExists()
    }

    @Test
    fun testDisablingCameraShowsIconWhenInPip() {
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = TestMeetingViewModel().apply {
                    showPip()
                    disableCameraDisplayPip(true)
                }
            )
        }

        composeTestRule.onNodeWithTag(PIP_HIDDEN_PIP_TAG).assertExists()
    }


    companion object {
        const val PIP_TAG = "PIP"
        const val IRIS_TAG = "IRIS"

        const val CAMERA_HIDDEN_TAG = "CAMERA_HIDDEN"
        const val PIP_HIDDEN_PIP_TAG = "PIP_HIDDEN"
    }
}

@RunWith(Parameterized::class)
class InMeetingLocaleTest(locale: String) {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @get:Rule
    val localeTestRule = LocaleUtil.LocaleTestRule(Locale(locale))

    @Test
    fun testDefaultLocale() {
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = TestMeetingViewModel().apply {
                    thermalCameraIsAvailable = true
                }
            )
        }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.hide_camera))
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.mute_mic))
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.thermal_camera))
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting))
            .assertExists()
    }

    @Test
    fun testHiddenCameraLocale() {
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = TestMeetingViewModel()
            )
        }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.hide_camera))
            .performClick()

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.show_camera))
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.mute_mic))
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting))
            .assertExists()
    }

    @Test
    fun testMutedMicLocale() {
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = TestMeetingViewModel()
            )
        }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.mute_mic))
            .performClick()

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.hide_camera))
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.unmute_mic))
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting))
            .assertExists()
    }

    @Test
    fun testThermalCameraLocale() {
        composeTestRule.setContent {
            InMeeting(
                frameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Yellow.copy(alpha = 0.3f).toArgb())
                },
                pipFrameLayout = FrameLayout(composeTestRule.activity).apply {
                    setBackgroundColor(Color.Green.copy(alpha = 0.3f).toArgb())
                },
                meetingViewModel = TestMeetingViewModel().apply {
                    thermalCameraIsAvailable = true
                }
            )
        }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.thermal_camera))
            .performClick()

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.hide_camera))
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.mute_mic))
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.classic_camera))
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting))
            .assertExists()
    }

    companion object {
        @JvmStatic
        @Parameterized.Parameters
        fun locales() = LocaleUtil.SUPPORTED_LOCALES
    }
}
