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
package com.realwear.acs.view

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewmodel.compose.viewModel
import com.microsoft.fluentui.tokenized.controls.Button
import com.realwear.acs.DevicesPreview
import com.realwear.acs.R
import com.realwear.acs.viewmodel.IPermissionsRefusedViewModel

@Composable
fun PermissionsRefused(permissionsRefusedViewModel: IPermissionsRefusedViewModel = viewModel()) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val permanentlyDenied = permissionsRefusedViewModel.isPermissionsPermanentlyDenied.observeAsState()

    DisposableEffect(lifecycleOwner) {
        lifecycleOwner.lifecycle.addObserver(permissionsRefusedViewModel)

        onDispose {
            lifecycleOwner.lifecycle.removeObserver(permissionsRefusedViewModel)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = stringResource(id = R.string.permissions_required_meeting),
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = stringResource(id = R.string.permissions_required_meeting_explanation),
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        if (permanentlyDenied.value == true) {
            Text(
                text = stringResource(id = R.string.permissions_required_meeting_instructions_denied_permanent),
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center
            )
        } else {
            Text(
                text = stringResource(id = R.string.permissions_required_meeting_instructions_denied),
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center
            )
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (permanentlyDenied.value == true) {
            Button(
                text = stringResource(id = R.string.open_settings),
                onClick = {
                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.fromParts("package", context.packageName, null)
                    }
                    context.startActivity(intent)
                }
            )
        } else {
            Button(
                text = stringResource(id = R.string.request_permissions),
                onClick = { permissionsRefusedViewModel.requestPermissions() }
            )
        }
    }
}

@Composable
@DevicesPreview
fun PermissionsRefusedPreview() {
    PermissionsRefused(object : IPermissionsRefusedViewModel() {
        override val isPermissionsPermanentlyDenied = MutableLiveData(false)

        override fun arePermissionsPermanentlyDenied(activity: Activity): Boolean {
            return false
        }

        override fun requestPermissions() {
            // Do Nothing.
        }

        override fun onStateChanged(source: LifecycleOwner, event: Lifecycle.Event) {
            // Do Nothing.
        }
    })
}

@Composable
@DevicesPreview
fun PermissionsRefusedPermanentlyPreview() {
    PermissionsRefused(object : IPermissionsRefusedViewModel() {
        override val isPermissionsPermanentlyDenied = MutableLiveData(true)

        override fun arePermissionsPermanentlyDenied(activity: Activity): Boolean {
            return false
        }

        override fun requestPermissions() {
            // Do Nothing.
        }

        override fun onStateChanged(source: LifecycleOwner, event: Lifecycle.Event) {
            // Do Nothing.
        }
    })
}

