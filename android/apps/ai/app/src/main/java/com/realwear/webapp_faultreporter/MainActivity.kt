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
package com.realwear.webapp_faultreporter

import android.Manifest
import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import com.realwear.webapp_faultreporter.ui.theme.WebApp_FaultReporterTheme
import com.realwear.webapp_faultreporter.utils.AzureApiUtils
import com.realwear.webapp_faultreporter.utils.AzureApiUtils.API_CODE2
import com.realwear.webapp_faultreporter.utils.AzureApiUtils.API_REFRESH2
import com.realwear.webapp_faultreporter.utils.AzureApiUtils.API_TOKEN2
import com.realwear.webapp_faultreporter.utils.LocalWebServer
import com.realwear.webapp_faultreporter.utils.PhotoCaptureService
import com.realwear.webapp_faultreporter.utils.WebAppInterface
import timber.log.Timber

const val TAG = "FAULT_REPORTER"

//const val siteUrl = "http://localhost:3330"
//const val siteUrl = "https://realwear-ai-marketplace-dev-f2eda3huaddvcuha.eastus2-01.azurewebsites.net"; // Staging URL
//const val siteUrl = "https://realwear-ai-marketplace-demo-c8dwbpe4a7abbugc.eastus2-01.azurewebsites.net"; // Demo URL
//const val siteUrl = "https://realwear-ai-marketplace-live-b3fnhnc8fzcvbvgh.eastus2-01.azurewebsites.net"; // Demo URL
//const val siteUrl = "https://realwear-365-demo-f4f7bahuh7dwasbq.eastus2-01.azurewebsites.net";

class MainActivity : ComponentActivity() {
    private lateinit var photoCaptureService: PhotoCaptureService
    private lateinit var localWebServer: LocalWebServer
    private lateinit var webView: WebView
    private lateinit var webAppInterface: WebAppInterface

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        photoCaptureService = PhotoCaptureService(this)
        localWebServer = LocalWebServer(this, photoCaptureService, BuildConfig.SITE_URL)
        webAppInterface = WebAppInterface(BuildConfig.SITE_URL)

        localWebServer.start(lifecycleScope)

        setContent {
            WebApp_FaultReporterTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    RealWearWebView(webAppInterface) { webViewInstance ->
                        webView = webViewInstance
                        webAppInterface.setWebView(webView)
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        localWebServer.stop()
        super.onDestroy()
    }

    @SuppressLint("MissingSuperCall")
    override fun onBackPressed() {
        this.webView.url?.let {
            // Strip off the beginning of the URL and return just the path and query
            val path = it.substringAfter(BuildConfig.SITE_URL)

            // If the path is empty, then we are at the root of the site
            if (path.isEmpty()) {
                finish()

                return
            }

            // If the path is not empty, then we are not at the root of the site
            // and we should navigate back in the WebView
            if (this.webView.canGoBack()) {
                this.webView.goBack()

                return
            }

            // If the path is not empty and we cannot navigate back in the WebView,
            // then we are at the root of the site and we should exit the app
            finish()
        } ?: run {
            finish()
        }
    }
}

@Composable
fun RealWearWebView(webAppInterface: WebAppInterface, onWebViewCreated: (WebView) -> Unit) {
    val assetLoader = WebViewAssetLoader.Builder()
        .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(LocalContext.current))
        .build()

    var pendingPermissionRequest by remember { mutableStateOf<PermissionRequest?>(null) }
    val requestMultiplePermissionsLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        pendingPermissionRequest?.let { request ->
            val granted = permissions.entries.all { it.value }

            if (granted) {
                val grantedResources = request.resources.mapNotNull {
                    when (it) {
                        PermissionRequest.RESOURCE_VIDEO_CAPTURE -> PermissionRequest.RESOURCE_VIDEO_CAPTURE
                        PermissionRequest.RESOURCE_AUDIO_CAPTURE -> PermissionRequest.RESOURCE_AUDIO_CAPTURE
                        else -> {
                            Log.e(TAG, "Unknown permission $it")
                            null
                        }
                    }
                }.toTypedArray()
                request.grant(grantedResources)
            } else {
                request.deny()
            }
            pendingPermissionRequest = null
        }
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )

                // Only allow debugging on debug builds
                if (BuildConfig.DEBUG) {
                    WebView.setWebContentsDebuggingEnabled(true)
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                        Log.i(TAG, "Console: ${consoleMessage.message()}")
                        return true
                    }

                    override fun onPermissionRequest(request: PermissionRequest) {
                        pendingPermissionRequest = request

                        val permissionsToRequest = mutableListOf<String>()
                        request.resources.forEach {
                            when (it) {
                                PermissionRequest.RESOURCE_VIDEO_CAPTURE -> permissionsToRequest.add(
                                    Manifest.permission.CAMERA
                                )

                                PermissionRequest.RESOURCE_AUDIO_CAPTURE -> permissionsToRequest.add(
                                    Manifest.permission.RECORD_AUDIO
                                )

                                else -> {
                                    Log.e(TAG, "Not allowed to request permission $it")
                                    pendingPermissionRequest = null
                                    request.deny()
                                }
                            }
                        }

                        if (permissionsToRequest.isNotEmpty()) {
                            requestMultiplePermissionsLauncher.launch(permissionsToRequest.toTypedArray())
                        } else {
                            // Handle any unexpected cases or deny by default
                            request.deny()
                        }
                    }
                }

                addJavascriptInterface(webAppInterface, "AndroidInterface")

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

                // RUN "yarn deploy_loader" to populate the assets directory for the loader

                val redirectUrl = java.net.URLEncoder.encode(BuildConfig.SITE_URL, "UTF-8")
                val pingUrl = java.net.URLEncoder.encode(BuildConfig.SITE_URL, "UTF-8")
                val url =
                    "https://appassets.androidplatform.net/index.html?redirectUrl=${redirectUrl}&pingUrl=${pingUrl}"
                loadUrl(url)
                onWebViewCreated(this)
            }
        }
    )
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
fun GreetingPreview() {
    WebApp_FaultReporterTheme {
        RealWearWebView(WebAppInterface("")) {
            //
        }
    }
}
