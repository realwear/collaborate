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
package com.realwear.acs

import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.res.Configuration
import android.net.Uri
import android.provider.Settings
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultLauncher
import com.google.gson.Gson
import com.realwear.acs.view.MeetingActivity

class WebAppInterface(
    private val activity: ComponentActivity,
    private val contentResolver: android.content.ContentResolver,
    private val barcodeLauncher: ActivityResultLauncher<Intent>,
) {
    private var webView: WebView? = null
    private var barcodeResultCallback: String? = null

    fun setWebView(webView: WebView) {
        this.webView = webView
    }

    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun startConfigurator() {
        validateOrigin()

        activity.packageManager.getLaunchIntentForPackage("com.realwear.configuration")?.let {
            activity.startActivity(it)
        } ?: Log.e(TAG, "Configurator app not found")
    }

    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun joinMeeting(userToken: String, meetingLink: String, participantName: String?, meetingName: String?): Boolean {
        validateOrigin()
        return MeetingActivity.joinMeeting(activity, userToken, meetingLink, participantName, meetingName)
    }

    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun launchBarcodeReader(callback: String): Boolean {
        validateOrigin()

        barcodeResultCallback = callback

        val intent = Intent(ACTION_BARCODE)

        try {
            barcodeLauncher.launch(intent)
        } catch (e: ActivityNotFoundException) {
            Log.e(TAG, "Barcode reader app not found", e)
            barcodeResultCallback = null
            return false
        }

        return true
    }

    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun getDeviceSerialNumber(): String? {
        validateOrigin()

        return runCatching {
            Settings.Global::class.java.getDeclaredField("KIRK_SN")
                ?.let { Settings.Global.getString(contentResolver, it[null]?.toString()) }
        }.onFailure { e ->
            Log.e(TAG, "Error while getting the serial number", e)
        }.getOrNull()
    }

    @JavascriptInterface
    @Suppress("unused")
    fun isDarkMode(): Boolean {
        // Returns true if the current device is set to night mode
        val nightModeFlags: Int =
            webView?.resources?.configuration?.uiMode?.and(Configuration.UI_MODE_NIGHT_MASK) ?: 0

        return nightModeFlags == Configuration.UI_MODE_NIGHT_YES
    }

    @JavascriptInterface
    @Suppress("unused")
    fun getDeviceInformation(): String {
        validateOrigin()

        // Create an object containing Build.MANUFACTURER, Build.MODEL, Build.VERSION.RELEASE, and Build.VERSION.SDK_INT
        val deviceInfo = mapOf(
            "manufacturer" to android.os.Build.MANUFACTURER,
            "model" to android.os.Build.MODEL,
            "release" to android.os.Build.VERSION.RELEASE,
            "sdkInt" to android.os.Build.VERSION.SDK_INT,
            "firmwareVersion" to android.os.Build.DISPLAY
        )

        return Gson().toJson(deviceInfo)
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

    fun onBarcodeResult(result: ActivityResult?) {
        val barcodeContent = result?.data?.getStringExtra(EXTRA_RESULT) ?: ""
        webView?.evaluateJavascript("javascript:$barcodeResultCallback('$barcodeContent')", null)
        barcodeResultCallback = null
    }

    fun onEvent(event: Event) {
        val scriptToRun = "document.dispatchEvent(new CustomEvent('${event.value}'))";

        webView?.evaluateJavascript(
            scriptToRun,
            null
        ) ?: Log.e(TAG, "Failed to send event as webview is missing")
    }

    companion object {
        private const val TAG = "WebAppInterface"

        private const val LOADER_ORIGIN = "appassets.androidplatform.net"

        private const val ACTION_BARCODE = "com.realwear.barcodereader.intent.action.SCAN_BARCODE"
        private const val EXTRA_RESULT = "com.realwear.barcodereader.intent.extra.RESULT"

        enum class Event(val value: String) {
            ON_PAUSE("rwt_onPause"),
            ON_RESUME("rwt_onResume")
        }
    }
}
