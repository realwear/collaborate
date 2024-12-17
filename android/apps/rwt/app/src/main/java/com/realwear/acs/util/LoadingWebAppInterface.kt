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

import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.ComponentActivity
import com.realwear.acs.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import timber.log.Timber

class LoadingWebAppInterface(
    private val activity: ComponentActivity,
    private val apkDownloader: ApkDownloader
) {
    private var webView: WebView? = null

    fun setWebView(webView: WebView) {
        this.webView = webView
    }

    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun isWebViewUpToDate(): Boolean {
        validateOrigin()

        if (!HMT1_MODELS.contains(Build.MODEL)) {
            return true
        }

        return try {
            val pm = activity.packageManager
            val packageInfo = pm.getPackageInfo("com.google.android.webview", 0)
            return packageInfo.longVersionCode >= WEB_VIEW_VERSION_CODE
        } catch (e: PackageManager.NameNotFoundException) {
            Timber.w("WebView package not found")
            return false
        }
    }

    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun updateWebView() {
        validateOrigin()

        apkDownloader.updateWebView(WEB_VIEW_URL, "webview.apk")
    }

    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun downloadProgress(): Float {
        validateOrigin()

        return apkDownloader.downloadProgress
    }

    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun webViewSize(): Int {
        validateOrigin()

        return WEB_VIEW_SIZE
    }

    @JavascriptInterface
    @Suppress("unused")
    fun restartActivity() {
        validateOrigin()

        CoroutineScope(Dispatchers.Main).launch {
            activity.recreate()
        }
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
        private const val TAG = "WebAppInterface"

        private const val LOADER_ORIGIN = "appassets.androidplatform.net"

        private const val WEB_VIEW_VERSION_CODE = 4638_0_74_03 // 95.0.4638.74
        private const val WEB_VIEW_URL =
            "https://rwcloudappmarketplace.blob.core.windows.net/apps/WebView_95forHMT.apk"
        private const val WEB_VIEW_SIZE = 90

        private val HMT1_MODELS = listOf("T1100G", "T1200G", "T1100S")
    }
}
