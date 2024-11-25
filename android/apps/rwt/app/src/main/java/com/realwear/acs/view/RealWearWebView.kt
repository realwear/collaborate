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
package com.realwear.acs.view

import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import com.realwear.acs.BuildConfig
import com.realwear.acs.WebAppInterface
import com.realwear.acs.util.AzureApiUtils
import com.realwear.acs.util.AzureApiUtils.API_CODE2
import com.realwear.acs.util.AzureApiUtils.API_REFRESH2
import com.realwear.acs.util.AzureApiUtils.API_TOKEN2
import com.realwear.acs.util.LoadingWebAppInterface
import com.realwear.acs.util.Utils
import com.realwear.acs.util.ZoomWebAppInterface
import timber.log.Timber

private const val TAG = "RealWearWebView"
private val SITE_URL = Utils.generateSiteUrl(BuildConfig.SITE_URL)

@Composable
fun RealWearWebView(
    webAppInterface: WebAppInterface,
    loadingWebAppInterface: LoadingWebAppInterface,
    zoomWebAppInterface: ZoomWebAppInterface
) {
    val assetLoader = WebViewAssetLoader.Builder()
        .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(LocalContext.current))
        .build()

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )

                webAppInterface.setWebView(this)
                zoomWebAppInterface.setWebView(this)
                loadingWebAppInterface.setWebView(this)

                if (BuildConfig.DEBUG) {
                    WebView.setWebContentsDebuggingEnabled(true)
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                        Timber.i("Console: ${consoleMessage.message()}")
                        return true
                    }
                }

                webViewClient = object : WebViewClient() {
                    override fun shouldInterceptRequest(
                        view: WebView,
                        request: WebResourceRequest
                    ): WebResourceResponse? {

                        val scope = request.requestHeaders[AzureApiUtils.HEADER_SCOPE]
                        val clientId = request.requestHeaders[AzureApiUtils.HEADER_CLIENT_ID]
                        val tenantId =
                            request.requestHeaders[AzureApiUtils.HEADER_TENANT_ID]
                                ?: AzureApiUtils.DEFAULT_TENANT_ID

                        if (request.url.path == API_CODE2) {
                            if (clientId == null) {
                                Timber.e("No client id header found for code request")
                                return AzureApiUtils.RESPONSE_400
                            }

                            if (scope == null) {
                                Timber.e("No scope header found for code request")
                                return AzureApiUtils.RESPONSE_400
                            }

                            return AzureApiUtils.handleApiCode(clientId, tenantId, scope)
                        }

                        if (request.url.path == API_TOKEN2) {
                            if (clientId == null) {
                                Timber.e("No client id header found for code request")
                                return AzureApiUtils.RESPONSE_400
                            }

                            if (scope == null) {
                                Timber.e("No scope header found for token request")
                                return AzureApiUtils.RESPONSE_400
                            }

                            val deviceCode =
                                request.requestHeaders[AzureApiUtils.HEADER_DEVICE_CODE] ?: run {
                                    Timber.e("No device code header found for token request")
                                    return AzureApiUtils.RESPONSE_400
                                }

                            return AzureApiUtils.handleApiToken(
                                clientId,
                                tenantId,
                                deviceCode,
                                scope
                            )
                        }

                        if (request.url.path == API_REFRESH2) {
                            if (clientId == null) {
                                Timber.e("No client id header found for code request")
                                return AzureApiUtils.RESPONSE_400
                            }

                            if (scope == null) {
                                Timber.e("No scope header found for token request")
                                return AzureApiUtils.RESPONSE_400
                            }

                            val refreshToken =
                                request.requestHeaders[AzureApiUtils.HEADER_REFRESH_TOKEN] ?: run {
                                    Timber.e("No refresh token found for token request")
                                    return AzureApiUtils.RESPONSE_400
                                }

                            return AzureApiUtils.handleApiRefresh(
                                clientId,
                                tenantId,
                                refreshToken,
                                scope
                            )
                        }

                        return assetLoader.shouldInterceptRequest(request.url)
                    }
                }

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    mediaPlaybackRequiresUserGesture = false
                }

                addJavascriptInterface(webAppInterface, "AndroidInterface")
                addJavascriptInterface(loadingWebAppInterface, "LoadingAndroidInterface")
                addJavascriptInterface(zoomWebAppInterface, "ZoomAndroidInterface")

                loadUrl(SITE_URL)
            }
        }
    )
}
