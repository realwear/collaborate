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
package com.realwear.acs.repository

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import timber.log.Timber

interface IPermissionsRepository {
    fun hasPermissions(context: Context, permissions: Array<String>): Boolean
    fun havePermissionsBeenDenied(activity: Activity, permissions: Array<String>): Boolean
}

class PermissionsRepository : IPermissionsRepository {
    override fun hasPermissions(context: Context, permissions: Array<String>): Boolean {
        permissions.forEach {
            val granted = ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
            Timber.i("Permission: $it - $granted")
            if (!granted) {
                return false
            }
        }
        return true
    }

    override fun havePermissionsBeenDenied(activity: Activity, permissions: Array<String>): Boolean {
        return permissions.filter {
            ContextCompat.checkSelfPermission(activity, it) == PackageManager.PERMISSION_DENIED
        }.any {
            !ActivityCompat.shouldShowRequestPermissionRationale(activity, it)
        }
    }

    companion object {
        private val BLUETOOTH_PERMISSIONS = if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            arrayOf(
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_FINE_LOCATION
            )
        } else {
            arrayOf(Manifest.permission.BLUETOOTH_CONNECT)
        }

        val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA,
        ) + BLUETOOTH_PERMISSIONS
    }
}