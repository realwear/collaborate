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
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.realwear.acs.testutil.TestMeetingViewModel
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_A_ACTIVE_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_A_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_B_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_C_ACTIVE_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_C_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_D_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_E_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.TestMeetingViewModel.Companion.PARTICIPANT_OVERFLOW_CONTENT_DESCRIPTION
import com.realwear.acs.testutil.assertNodeWithContentDescriptionIsNotDisplayed
import com.realwear.acs.testutil.onAllNodesWithContentDescriptionDisplayedCount
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ParticipantOverlayTest {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun testParticipantOverlayComposable() {
        composeTestRule.setContent { ParticipantOverlay(meetingViewModel = TestMeetingViewModel()) }

        // Check the participants are displayed
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_B_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_C_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_D_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_E_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_OVERFLOW_CONTENT_DESCRIPTION).assertCountEquals(0)
    }

    @Test
    fun testParticipantLeaving() {
        val mockViewModel = TestMeetingViewModel()
        composeTestRule.setContent { ParticipantOverlay(meetingViewModel = mockViewModel) }

        // Remove participant a
        composeTestRule.runOnUiThread {
            mockViewModel.removeParticipant("a")
        }
        composeTestRule.waitForIdle()

        // Check the participant is no longer displayed
        composeTestRule.assertNodeWithContentDescriptionIsNotDisplayed(PARTICIPANT_A_CONTENT_DESCRIPTION)

        // Check the remaining participants are as expected
        composeTestRule.onAllNodesWithContentDescriptionDisplayedCount(PARTICIPANT_B_CONTENT_DESCRIPTION, 1)
        composeTestRule.onAllNodesWithContentDescriptionDisplayedCount(PARTICIPANT_C_CONTENT_DESCRIPTION, 1)
        composeTestRule.assertNodeWithContentDescriptionIsNotDisplayed(PARTICIPANT_D_CONTENT_DESCRIPTION)
        composeTestRule.assertNodeWithContentDescriptionIsNotDisplayed(PARTICIPANT_E_CONTENT_DESCRIPTION)
        composeTestRule.assertNodeWithContentDescriptionIsNotDisplayed(PARTICIPANT_OVERFLOW_CONTENT_DESCRIPTION)
    }

    @Test
    fun testParticipantJoining() {
        val mockViewModel = TestMeetingViewModel()
        composeTestRule.setContent { ParticipantOverlay(meetingViewModel = mockViewModel) }

        // Add participant d
        composeTestRule.runOnUiThread {
            mockViewModel.addParticipant("d")
        }
        composeTestRule.waitForIdle()

        // Check all the correct participants are displayed
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_B_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_C_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_D_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_E_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_OVERFLOW_CONTENT_DESCRIPTION).assertCountEquals(0)
    }

    @Test
    fun testParticipantJoiningCausesTruncation() {
        val mockViewModel = TestMeetingViewModel()
        composeTestRule.setContent { ParticipantOverlay(meetingViewModel = mockViewModel) }

        // Add participants to max that can be displayed
        composeTestRule.runOnUiThread {
            mockViewModel.addParticipant("d")
            mockViewModel.addParticipant("e")
        }
        composeTestRule.waitForIdle()

        // Check the correct participants are displayed, as well as the overflow indicator
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_B_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_C_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_D_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_E_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_OVERFLOW_CONTENT_DESCRIPTION).assertCountEquals(1)
    }

    @Test
    fun testTruncatedParticipantLeavingRemovesTruncation() {
        val mockViewModel = TestMeetingViewModel()
        composeTestRule.setContent { ParticipantOverlay(meetingViewModel = mockViewModel) }

        // Add participants to cause truncation
        composeTestRule.runOnUiThread {
            mockViewModel.addParticipant("d")
            mockViewModel.addParticipant("e")
        }
        composeTestRule.waitForIdle()

        // Remove truncated participant
        composeTestRule.runOnUiThread {
            mockViewModel.removeParticipant("e")
        }
        composeTestRule.waitForIdle()

        // Check all the participants are displayed, and that the overflow indicator is removed
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_B_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_C_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_D_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_E_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.assertNodeWithContentDescriptionIsNotDisplayed(PARTICIPANT_OVERFLOW_CONTENT_DESCRIPTION)
    }

    @Test
    fun testMiddleParticipantLeavingRemovesTruncation() {
        val mockViewModel = TestMeetingViewModel()
        composeTestRule.setContent { ParticipantOverlay(meetingViewModel = mockViewModel) }

        // Add participants to cause truncation
        composeTestRule.runOnUiThread {
            mockViewModel.addParticipant("d")
            mockViewModel.addParticipant("e")
        }
        composeTestRule.waitForIdle()

        // Remove truncated participant
        composeTestRule.runOnUiThread {
            mockViewModel.removeParticipant("c")
        }
        composeTestRule.waitForIdle()

        // Check the correct participants are displayed, and that the overflow indicator is removed
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_B_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_C_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_D_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_E_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.assertNodeWithContentDescriptionIsNotDisplayed(PARTICIPANT_OVERFLOW_CONTENT_DESCRIPTION)
    }

    @Test
    fun testTalkingUserIsHighlighted() {
        val mockViewModel = TestMeetingViewModel()
        composeTestRule.setContent { ParticipantOverlay(meetingViewModel = mockViewModel) }

        // Mark first participant as talking
        composeTestRule.runOnUiThread {
            mockViewModel.isParticipantTalking("a", true)
        }
        composeTestRule.waitForIdle()

        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_ACTIVE_CONTENT_DESCRIPTION).assertCountEquals(1)
    }

    @Test
    fun testMultipleTalkingUsersAreHighlighted() {
        val mockViewModel = TestMeetingViewModel()
        composeTestRule.setContent { ParticipantOverlay(meetingViewModel = mockViewModel) }

        // Mark first participant as talking
        composeTestRule.runOnUiThread {
            mockViewModel.isParticipantTalking("a", true)
            mockViewModel.isParticipantTalking("c", true)
        }
        composeTestRule.waitForIdle()

        // Check the participants are highlighted
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_A_ACTIVE_CONTENT_DESCRIPTION).assertCountEquals(1)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_C_CONTENT_DESCRIPTION).assertCountEquals(0)
        composeTestRule.onAllNodesWithContentDescription(PARTICIPANT_C_ACTIVE_CONTENT_DESCRIPTION).assertCountEquals(1)
    }
}