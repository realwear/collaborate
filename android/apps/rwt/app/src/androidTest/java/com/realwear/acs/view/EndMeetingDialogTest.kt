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
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.realwear.acs.R
import com.realwear.acs.testutil.LocaleUtil
import com.realwear.acs.testutil.onNodeWithText
import org.junit.Assert
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized
import java.util.Locale

@RunWith(AndroidJUnit4::class)
class EndMeetingDialogTest {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun testEndCallDialogComposable() {
        composeTestRule.setContent { EndMeetingDialog(onConfirm = {}, onDismiss = {}) }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting_title), false)
            .assertIsDisplayed()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting_explanation))
            .assertIsDisplayed()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting).uppercase(), true)
            .assertIsDisplayed()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.cancel).uppercase())
            .assertIsDisplayed()
    }

    @Test
    fun testConfirmingDialog() {
        var confirmed = false
        var dismissed = false
        composeTestRule.setContent {
            EndMeetingDialog(onConfirm = {
                confirmed = true
            }, onDismiss = {
                dismissed = true
            })
        }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting).uppercase(), true)
            .performClick()

        Assert.assertTrue(confirmed)
        Assert.assertFalse(dismissed)
    }

    @Test
    fun testDismissingDialog() {
        var confirmed = false
        var dismissed = false
        composeTestRule.setContent {
            EndMeetingDialog(onConfirm = {
                confirmed = true
            }, onDismiss = {
                dismissed = true
            })
        }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.cancel).uppercase()).performClick()

        Assert.assertFalse(confirmed)
        Assert.assertTrue(dismissed)
    }
}

@RunWith(Parameterized::class)
class EndCallDialogLocaleTest(locale: String) {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @get:Rule
    val localeTestRule = LocaleUtil.LocaleTestRule(Locale(locale))

    @Test
    fun testLocale() {
        composeTestRule.setContent {
            EndMeetingDialog(onConfirm = {}, onDismiss = {})
        }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting_title), false)
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting_explanation))
            .assertExists()

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.cancel).uppercase())
            .assert(hasClickAction())
            .assertExists()
        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.leave_meeting).uppercase(), true)
            .assertExists()
    }

    companion object {
        @JvmStatic
        @Parameterized.Parameters
        fun locales() = LocaleUtil.SUPPORTED_LOCALES
    }
}