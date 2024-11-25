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

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.realwear.acs.R
import com.realwear.acs.testutil.TestMeetingViewModel
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.MEETING_TITLE
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TeamsLobbyTest {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun testTeamsLobbyComposable() {
        composeTestRule.setContent { TeamsLobby(TestMeetingViewModel()) }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.lobby_title, MEETING_TITLE))
            .assertIsDisplayed()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.teams_lobby_explanation))
            .assertIsDisplayed()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.teams_lobby_instructions))
            .assertIsDisplayed()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting)).assertIsDisplayed()
    }

    @Test
    fun testLeavingMeetingFromTeamsLobby() {
        val testMeetingViewModel = TestMeetingViewModel()
        composeTestRule.setContent { TeamsLobby(testMeetingViewModel) }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting)).performClick()

        // Check the meeting was hung up
        Assert.assertTrue(testMeetingViewModel.callHasBeenHungUp)
    }
}