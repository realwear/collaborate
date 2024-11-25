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