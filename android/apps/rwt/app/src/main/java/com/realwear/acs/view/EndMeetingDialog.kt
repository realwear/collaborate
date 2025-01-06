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

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.microsoft.fluentui.tokenized.controls.Button
import com.microsoft.fluentui.util.getStringResource
import com.realwear.acs.DevicesPreview
import com.realwear.acs.R
import com.realwear.acs.ui.theme.TeamsForRealWearTheme

@Composable
fun EndMeetingDialog(onConfirm: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        modifier = Modifier.semantics { contentDescription = "hf_no_number" },
        onDismissRequest = { onDismiss() },
        title = { Text(getStringResource(id = R.string.leave_meeting_title)) },
        text = { Text(getStringResource(id = R.string.leave_meeting_explanation)) },
        confirmButton = {
            Button(text = getStringResource(id = R.string.leave_meeting).uppercase(), onClick = onConfirm)
        },
        dismissButton = {
            Button(text = getStringResource(id = R.string.cancel).uppercase(), onClick = onDismiss)
        }
    )
}

@DevicesPreview
@Composable
fun EndMeetingDialogLightPreview() {
    TeamsForRealWearTheme(darkTheme = false, dynamicColor = false) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        )
        EndMeetingDialog(onConfirm = {}, onDismiss = {})
    }
}

@DevicesPreview
@Composable
fun EndCallDialogDarkPreview() {
    TeamsForRealWearTheme(darkTheme = true, dynamicColor = false) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        )
        EndMeetingDialog(onConfirm = {}, onDismiss = {})
    }
}