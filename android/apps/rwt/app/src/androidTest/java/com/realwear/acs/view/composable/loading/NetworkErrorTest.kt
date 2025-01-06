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
package com.realwear.acs.view.composable.loading

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.realwear.acs.R
import com.realwear.acs.testutil.TestMeetingViewModel
import com.realwear.acs.testutil.assertNodeWithTagIsNotDisplayed
import com.realwear.acs.util.Utils
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NetworkErrorTest {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun testNetworkErrorComposable() {
        val context = composeTestRule.activity

        composeTestRule.setContent { NetworkError(meetingViewModel = TestMeetingViewModel()) }

        composeTestRule.onNodeWithText(
            context.getString(
                R.string.network_error_title,
                Utils.parseMeetingName(context, TestMeetingViewModel.MEETING_TITLE),
            )
        ).assertExists()
        composeTestRule.onNodeWithText(context.getString(R.string.network_error_explanation))
            .assertExists()
        composeTestRule.onNodeWithText(context.getString(R.string.network_error_instructions))
            .assertExists()

        // Check the leave meeting button exists
        composeTestRule.onNodeWithText(
            composeTestRule.activity.getString(R.string.leave_meeting).uppercase(),
            true
        ).assertExists()
    }

    @Test
    fun testLeavingMeeting() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent { NetworkError(meetingViewModel = testMeetingViewModel) }

        composeTestRule.onNodeWithText(
            composeTestRule.activity.getString(R.string.leave_meeting).uppercase(),
            true
        ).performClick()

        // Check the meeting was hung up
        Assert.assertTrue(testMeetingViewModel.callHasBeenHungUp)
    }

    @Test
    fun testIconIsStatic() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent { NetworkError(meetingViewModel = testMeetingViewModel) }

        composeTestRule.assertNodeWithTagIsNotDisplayed("LoadingAnimation")
    }
}