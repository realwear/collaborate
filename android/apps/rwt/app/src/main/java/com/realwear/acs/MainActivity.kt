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

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.realwear.acs.WebAppInterface.Companion.Event
import com.realwear.acs.ui.theme.TeamsForRealWearTheme
import com.realwear.acs.util.ApkDownloader
import com.realwear.acs.util.LoadingWebAppInterface
import com.realwear.acs.util.ZoomWebAppInterface
import com.realwear.acs.view.RealWearWebView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers

class MainActivity : ComponentActivity() {
    private lateinit var apkDownloader: ApkDownloader

    private lateinit var webAppInterface: WebAppInterface
    private lateinit var loadingWebAppInterface: LoadingWebAppInterface
    private lateinit var zoomWebAppInterface: ZoomWebAppInterface

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val barcodeLauncher =
            registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
                webAppInterface.onBarcodeResult(result)
            }

        apkDownloader = ApkDownloader(baseContext, CoroutineScope(Dispatchers.IO))

        webAppInterface = WebAppInterface(this, contentResolver, barcodeLauncher)
        loadingWebAppInterface = LoadingWebAppInterface(this, apkDownloader)
        zoomWebAppInterface = ZoomWebAppInterface(this)

        setContent {
            TeamsForRealWearTheme {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .semantics { contentDescription = "hf_no_number" },
                    color = MaterialTheme.colorScheme.background
                ) {
                    RealWearWebView(webAppInterface, loadingWebAppInterface, zoomWebAppInterface)
                }
            }
        }
    }

    override fun onPause() {
        webAppInterface.onEvent(Event.ON_PAUSE)
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        webAppInterface.onEvent(Event.ON_RESUME)
    }
}
