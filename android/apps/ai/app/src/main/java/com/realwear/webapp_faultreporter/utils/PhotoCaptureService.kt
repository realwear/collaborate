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