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

import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.ComponentActivity
import com.realwear.acs.BuildConfig
import java.net.URLEncoder

class ZoomWebAppInterface (
    private val activity: ComponentActivity,
) {
    private var webView: WebView? = null

    fun setWebView(webView: WebView) {
        this.webView = webView
    }
    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun isZoomAvailable(): Boolean {
        validateOrigin()

        return try {
            activity.packageManager.getPackageInfo(ZOOM_PACKAGE, 0)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }

        return true
    }

    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun launchZoomMeeting(zoomMeetingUrl: String): Boolean {
        validateOrigin()

        val intent = Intent(Intent.ACTION_VIEW)

        // URL encode the zoomMeetingUrl
        val encodedParam = URLEncoder.encode(zoomMeetingUrl, "UTF-8")

        @Suppress("SpellCheckingInspection")
        intent.data = Uri.parse("hffzoom://?zoomurl=$encodedParam")

        try {
            activity.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Log.e(TAG, "Handsfree for Zoom not found", e)
            return false
        }

        return true
    }

    private fun validateOrigin() {
        val exception = IllegalArgumentException("Invalid origin")

        webView?.post {
            val origin = webView?.url?.let { Uri.parse(it).host } ?: throw exception

            // Extract the origin from the site URL
            val siteOrigin = Uri.parse(BuildConfig.SITE_URL).host

            if (origin != siteOrigin && origin != LOADER_ORIGIN) {
                Log.e(TAG, "Invalid origin: $origin")
                throw exception
            }
        } ?: throw exception
    }

    companion object {

        private const val TAG = "ZoomWebAppInterface"

        private const val ZOOM_PACKAGE = "com.handsfreezoom.app"

        private const val LOADER_ORIGIN = "appassets.androidplatform.net"
    }
}
