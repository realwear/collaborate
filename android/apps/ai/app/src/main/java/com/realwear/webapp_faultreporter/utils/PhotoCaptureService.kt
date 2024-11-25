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
package com.realwear.webapp_faultreporter.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import kotlinx.coroutines.channels.Channel
import java.io.File
import java.io.IOException

class PhotoCaptureService(private val activity: ComponentActivity) {
    private val photoResultChannel = Channel<Uri?>(Channel.CONFLATED)
    private var currentPhotoUri: Uri? = null

    private val requestPermissionLauncher =
        activity.registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted: Boolean ->
            if (isGranted) {
                launchCamera()
            } else {
                photoResultChannel.trySend(null)
            }
        }

    private val takePictureLauncher =
        activity.registerForActivityResult(ActivityResultContracts.TakePicture()) { success ->
            if (success) {
                photoResultChannel.trySend(currentPhotoUri)
            } else {
                photoResultChannel.trySend(null)
            }
        }

    suspend fun capturePhoto(): Uri? {
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
        } else {
            launchCamera()
        }

        return photoResultChannel.receive() ?: null
    }

    private fun launchCamera() {
        val photoFile: File? = try {
            createImageFile(activity)
        } catch (ex: IOException) {
            null
        }
        photoFile?.also {
            currentPhotoUri = FileProvider.getUriForFile(activity, "${activity.packageName}.provider", it)
            takePictureLauncher.launch(currentPhotoUri)
        }
    }

    private fun createImageFile(context: Context): File {
        val storageDir: File = context.cacheDir
        return File.createTempFile(
            "JPEG_${System.currentTimeMillis()}_",
            ".jpg",
            storageDir
        ).apply {
            // Save a file path for ACTION_VIEW intents
            currentFilePath = absolutePath
        }
    }

    companion object {
        private var currentFilePath: String? = null
    }
}