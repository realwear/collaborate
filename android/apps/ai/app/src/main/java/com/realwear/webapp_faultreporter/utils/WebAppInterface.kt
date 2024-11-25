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

import android.net.Uri
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView

class WebAppInterface(
    private val siteUrl: String
) {
    private var webView: WebView? = null

    fun setWebView(webView: WebView) {
        this.webView = webView
    }

    @JavascriptInterface
    @Suppress("unused") // Called from JavaScript
    fun getPortNumber(): Int {
        validateOrigin()
        return LocalWebServer.PORT
    }

    private fun validateOrigin() {
        val exception = IllegalArgumentException("Invalid origin")

        webView?.post {
            val origin = webView?.url?.let { Uri.parse(it).host } ?: throw exception

            // Extract the origin from the site URL
            val siteOrigin = Uri.parse(siteUrl).host

            if (origin != siteOrigin && origin != LOADER_ORIGIN) {
                Log.e(TAG, "Invalid origin: $origin")
                throw exception
            }
        } ?: throw exception
    }


    companion object {
        private const val TAG = "WebAppInterface"

        private const val LOADER_ORIGIN = "appassets.androidplatform.net"
    }
}
