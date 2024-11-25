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
