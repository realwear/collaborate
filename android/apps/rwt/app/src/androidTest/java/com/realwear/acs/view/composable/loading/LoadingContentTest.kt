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
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.realwear.acs.R
import com.realwear.acs.testutil.TestMeetingViewModel
import com.realwear.acs.testutil.assertNodeWithTagIsNotDisplayed
import com.realwear.acs.util.Utils.parseMeetingName
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LoadingContentTest {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun testLoadingContentComposable() {
        val context = composeTestRule.activity
        composeTestRule.setContent {
            LoadingContent(
                meetingViewModel = TestMeetingViewModel(),
                icon = R.drawable.supervised_user_circle_24dp,
                animate = true,
                titleResource = R.string.meeting_loading_title,
                explanation = context.getString(R.string.meeting_loading_explanation),
                instruction = context.getString(R.string.meeting_loading_instructions)
            )
        }

        // Check the loading content is displayed
        composeTestRule.onNodeWithText(
            context.getString(
                R.string.meeting_loading_title,
                parseMeetingName(context, TestMeetingViewModel.MEETING_TITLE),
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
    fun testLeavingMeetingButton() {
        val context = composeTestRule.activity
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            LoadingContent(
                meetingViewModel = testMeetingViewModel,
                icon = R.drawable.supervised_user_circle_24dp,
                animate = true,
                titleResource = R.string.meeting_loading_title,
                explanation = context.getString(R.string.meeting_loading_explanation),
                instruction = context.getString(R.string.meeting_loading_instructions)
            )
        }

        composeTestRule.onNodeWithText(
            composeTestRule.activity.getString(R.string.leave_meeting).uppercase(),
            true
        ).performClick()

        // Check the meeting was hung up
        Assert.assertTrue(testMeetingViewModel.callHasBeenHungUp)
    }

    @Test
    fun testIconAnimation() {
        val context = composeTestRule.activity
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            LoadingContent(
                meetingViewModel = testMeetingViewModel,
                icon = R.drawable.supervised_user_circle_24dp,
                animate = true,
                titleResource = R.string.meeting_loading_title,
                explanation = context.getString(R.string.meeting_loading_explanation),
                instruction = context.getString(R.string.meeting_loading_instructions)
            )
        }

        composeTestRule.onNodeWithTag("LoadingAnimation").assertExists()
    }

    @Test
    fun testIconStatic() {
        val context = composeTestRule.activity
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent {
            LoadingContent(
                meetingViewModel = testMeetingViewModel,
                icon = R.drawable.error_24px,
                animate = false,
                titleResource = R.string.meeting_loading_title,
                explanation = context.getString(R.string.meeting_loading_explanation),
                instruction = context.getString(R.string.meeting_loading_instructions)
            )
        }

        composeTestRule.assertNodeWithTagIsNotDisplayed("LoadingAnimation")
    }
}