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

import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber
import java.io.IOException

class ApkDownloader(
    private val context: Context,
    private val coroutineScope: CoroutineScope
) {
    private val downloadManager: DownloadManager =
        context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

     var downloadProgress = 0f
         private set

    fun updateWebView(apkUrl: String, fileName: String) {
        coroutineScope.launch {
            downloadAndInstallApk(apkUrl, fileName)
        }
    }

    private suspend fun downloadAndInstallApk(apkUrl: String, fileName: String) {
        try {
            val request = DownloadManager.Request(Uri.parse(apkUrl))
                .setTitle("Downloading APK")
                .setDescription("Please wait while the APK is being downloaded.")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(false)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)

            val downloadId = downloadManager.enqueue(request)

            monitorDownloadProgress(downloadId)
            val fileUri = withContext(Dispatchers.IO) {
                waitForDownloadCompletion(downloadId)
            }

            if (fileUri != null) {
                downloadProgress = 100f
                installApk(fileUri)
            } else {
                Timber.e("Download failed for an unknown reason.")
                downloadProgress = -1f
            }
        } catch (e: IllegalArgumentException) {
            Timber.e(e, "Invalid download request")
            downloadProgress = -1f
        } catch (e: SecurityException) {
            Timber.e(e, "Permission denied when downloading update.")
            downloadProgress = -1f
        } catch (e: IOException) {
            Timber.e(e, "I/O error when downloading update.")
            downloadProgress = -1f
        }
    }

    private suspend fun monitorDownloadProgress(downloadId: Long) {
        withContext(Dispatchers.IO) {
            var isDownloading = true
            while (isDownloading) {
                val query = DownloadManager.Query().setFilterById(downloadId)
                val cursor = downloadManager.query(query)

                if (cursor.moveToFirst()) {
                    val totalBytes =
                        cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                    val downloadedBytes =
                        cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))

                    if (totalBytes > 0) {
                        val progress = downloadedBytes.toFloat() / totalBytes.toFloat()
                        downloadProgress = progress
                    }

                    val status =
                        cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                    if (status == DownloadManager.STATUS_SUCCESSFUL || status == DownloadManager.STATUS_FAILED) {
                        isDownloading = false
                    }
                }

                cursor.close()
                kotlinx.coroutines.delay(1000) // Check progress every second
            }
        }
    }

    private suspend fun waitForDownloadCompletion(downloadId: Long): Uri? {
        return withContext(Dispatchers.IO) {
            var fileUri: Uri? = null
            var downloadComplete = false

            while (!downloadComplete) {
                val query = DownloadManager.Query().setFilterById(downloadId)
                val cursor = downloadManager.query(query)

                if (cursor.moveToFirst()) {
                    val status =
                        cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))

                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        fileUri = downloadManager.getUriForDownloadedFile(downloadId)
                        downloadComplete = true
                    } else if (status == DownloadManager.STATUS_FAILED) {
                        downloadComplete = true
                    }
                }

                cursor.close()
                kotlinx.coroutines.delay(1000)
            }

            fileUri
        }
    }

    private fun installApk(apkUri: Uri) {
        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
        }

        try {
            context.startActivity(installIntent)
        } catch (e: SecurityException) {
            Timber.e(e, "Permission denied for APK installation")
        } catch (e: IllegalArgumentException) {
            Timber.e(e, "Invalid URI or data type: ${e.message}")
        } catch (e: ActivityNotFoundException) {
            Timber.e(e, "No suitable app to handle APK installation: ${e.message}")
        }
    }
}
