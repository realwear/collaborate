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
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.realwear.acs.R
import com.realwear.acs.testutil.LocaleUtil
import com.realwear.acs.testutil.assertNodeWithTextIsDisplayed
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized
import java.util.Locale

@RunWith(AndroidJUnit4::class)
class HangingUpTest {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun testInMeetingComposable() {
        composeTestRule.setContent {
            HangingUp()
        }

        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.meeting_ended))
        composeTestRule.onAllNodesWithContentDescription(composeTestRule.activity.getString(R.string.meeting_ended))
            .assertCountEquals(1)
    }
}

@RunWith(Parameterized::class)
class HangUpLocaleTest(locale: String) {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @get:Rule
    val localeTestRule = LocaleUtil.LocaleTestRule(Locale(locale))

    @Test
    fun testLocale() {
        composeTestRule.setContent {
            HangingUp()
        }

        composeTestRule.onNodeWithText(composeTestRule.activity.getString(R.string.meeting_ended))
            .assertExists()
        composeTestRule.onAllNodesWithContentDescription(composeTestRule.activity.getString(R.string.meeting_ended))
            .assertCountEquals(1)
    }

    companion object {
        @JvmStatic
        @Parameterized.Parameters
        fun locales() = LocaleUtil.SUPPORTED_LOCALES
    }
}