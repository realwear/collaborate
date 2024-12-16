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
package com.realwear.acs.view.composable.loading

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.realwear.acs.R
import com.realwear.acs.testutil.TestMeetingViewModel
import com.realwear.acs.util.Utils
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class CallingTest {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun testCallingComposable() {
        val context = composeTestRule.activity

        composeTestRule.setContent { Calling(meetingViewModel = TestMeetingViewModel()) }

        composeTestRule.onNodeWithText(
            context.getString(
                R.string.call_loading_title,
                Utils.parseMeetingName(context, TestMeetingViewModel.MEETING_TITLE),
            )
        ).assertExists()
        composeTestRule.onNodeWithText(context.getString(R.string.meeting_loading_explanation))
            .assertExists()
        composeTestRule.onNodeWithText(context.getString(R.string.meeting_loading_instructions))
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
        composeTestRule.setContent { Calling(meetingViewModel = testMeetingViewModel) }

        composeTestRule.onNodeWithText(
            composeTestRule.activity.getString(R.string.leave_meeting).uppercase(),
            true
        ).performClick()

        // Check the meeting was hung up
        Assert.assertTrue(testMeetingViewModel.callHasBeenHungUp)
    }

    @Test
    fun testIconAnimation() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent { Calling(meetingViewModel = testMeetingViewModel) }

        composeTestRule.onNodeWithTag("LoadingAnimation").assertExists()
    }
}