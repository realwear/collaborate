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

import android.app.Activity
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.MutableLiveData
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.realwear.acs.R
import com.realwear.acs.testutil.LocaleUtil
import com.realwear.acs.testutil.assertNodeWithTextIsDisplayed
import com.realwear.acs.testutil.assertNodeWithTextIsNotDisplayed
import com.realwear.acs.viewmodel.IPermissionsRefusedViewModel
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized
import java.util.Locale

@RunWith(AndroidJUnit4::class)
class PermissionsRefusedTest {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun testInMeetingPermissionsDeniedComposable() {
        composeTestRule.setContent {
            PermissionsRefused(object : IPermissionsRefusedViewModel() {
                override val isPermissionsPermanentlyDenied = MutableLiveData(false)

                override fun arePermissionsPermanentlyDenied(activity: Activity): Boolean {
                    return false
                }

                override fun requestPermissions() {
                    // Do Nothing.
                }

                override fun onStateChanged(source: LifecycleOwner, event: Lifecycle.Event) {
                    // Do Nothing.
                }
            })
        }

        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting_explanation))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting_instructions_denied))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.request_permissions))

        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting_instructions_denied_permanent))
        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.open_settings))
    }

    @Test
    fun testInMeetingPermissionsDeniedPermanentlyComposable() {
        composeTestRule.setContent {
            PermissionsRefused(object : IPermissionsRefusedViewModel() {
                override val isPermissionsPermanentlyDenied = MutableLiveData(true)

                override fun arePermissionsPermanentlyDenied(activity: Activity): Boolean {
                    return false
                }

                override fun requestPermissions() {
                    // Do Nothing.
                }

                override fun onStateChanged(source: LifecycleOwner, event: Lifecycle.Event) {
                    // Do Nothing.
                }
            })
        }

        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting_explanation))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting_instructions_denied_permanent))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.open_settings))

        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting_instructions_denied))
        composeTestRule.assertNodeWithTextIsNotDisplayed(composeTestRule.activity.getString(R.string.request_permissions))
    }
}

@RunWith(Parameterized::class)
class PermissionsLocaleTest(locale: String) {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @get:Rule
    val localeTestRule = LocaleUtil.LocaleTestRule(Locale(locale))

    @Test
    fun testLocale() {
        composeTestRule.setContent {
            PermissionsRefused(object : IPermissionsRefusedViewModel() {
                override val isPermissionsPermanentlyDenied = MutableLiveData(false)

                override fun arePermissionsPermanentlyDenied(activity: Activity): Boolean {
                    return false
                }

                override fun requestPermissions() {
                    // Do Nothing.
                }

                override fun onStateChanged(source: LifecycleOwner, event: Lifecycle.Event) {
                    // Do Nothing.
                }
            })
        }

        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting_explanation))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting_instructions_denied))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.request_permissions))
    }

    @Test
    fun testPermanentLocale() {
        composeTestRule.setContent {
            PermissionsRefused(object : IPermissionsRefusedViewModel() {
                override val isPermissionsPermanentlyDenied = MutableLiveData(true)

                override fun arePermissionsPermanentlyDenied(activity: Activity): Boolean {
                    return false
                }

                override fun requestPermissions() {
                    // Do Nothing.
                }

                override fun onStateChanged(source: LifecycleOwner, event: Lifecycle.Event) {
                    // Do Nothing.
                }
            })
        }

        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting_explanation))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.permissions_required_meeting_instructions_denied_permanent))
        composeTestRule.assertNodeWithTextIsDisplayed(composeTestRule.activity.getString(R.string.open_settings))
    }

    companion object {
        @JvmStatic
        @Parameterized.Parameters
        fun locales() = LocaleUtil.SUPPORTED_LOCALES
    }
}