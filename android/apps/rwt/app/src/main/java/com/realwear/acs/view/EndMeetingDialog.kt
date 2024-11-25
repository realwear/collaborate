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