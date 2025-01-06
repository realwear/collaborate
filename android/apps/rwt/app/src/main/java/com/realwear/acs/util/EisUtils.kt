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
package com.realwear.acs.util

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import timber.log.Timber

object EisUtils {
    fun requestImageStabilizationSettings(context: Context) {
        Timber.i("Requesting EIS settings.")
        val intent = Intent(INTENT_GET_CAMERA_SETTINGS).apply {
            component = ComponentName(ANDROID_SETTINGS_PKG, RW_CAMERA_GET_RECEIVER)
        }

        val receivers =
            context.packageManager.queryBroadcastReceivers(intent, PackageManager.GET_META_DATA)
        if (receivers.isNotEmpty()) context.sendBroadcast(intent)
        else Timber.e("No receiver for image stabilization settings request.")
    }

    fun setImageStabilizationMode(context: Context, mode: String) {
        Timber.i("Setting EIS to $mode")
        val intent = Intent(INTENT_SET_CAMERA_SETTINGS)
        intent.putExtra(STABILIZATION_LABEL, mode)
        intent.component = ComponentName(ANDROID_SETTINGS_PKG, RW_CAMERA_SET_RECEIVER)
        context.sendBroadcast(intent)
    }

    private const val ANDROID_SETTINGS_PKG = "com.android.settings"

    const val INTENT_GET_CAMERA_SETTINGS = "com.android.settings.realwear_camera_GET"
    private const val INTENT_SET_CAMERA_SETTINGS = "com.android.settings.realwear_camera_SET"

    private const val RW_CAMERA_GET_RECEIVER = "com.android.settings.RealwearCameraGetReceiver"
    private const val RW_CAMERA_SET_RECEIVER = "com.android.settings.RealwearCameraSetReceiver"

    const val STABILIZATION_LABEL = "eis"
    const val STABILIZATION_ON = "on"
    const val STABILIZATION_OFF = "off"
}
