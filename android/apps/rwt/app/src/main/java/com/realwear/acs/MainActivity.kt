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
