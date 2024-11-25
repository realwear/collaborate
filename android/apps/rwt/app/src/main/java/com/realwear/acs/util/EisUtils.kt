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
