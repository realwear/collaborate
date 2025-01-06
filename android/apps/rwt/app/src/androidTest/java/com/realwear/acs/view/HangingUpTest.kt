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