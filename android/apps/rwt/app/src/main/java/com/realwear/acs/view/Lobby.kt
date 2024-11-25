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
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.microsoft.fluentui.tokenized.controls.Button
import com.realwear.acs.DevicesPreview
import com.realwear.acs.R
import com.realwear.acs.util.PreviewUtils
import com.realwear.acs.util.Utils.parseMeetingName
import com.realwear.acs.viewmodel.IMeetingViewModel

@Composable
fun Lobby(meetingViewModel: IMeetingViewModel = viewModel()) {
    val context = LocalContext.current
    val meetingName by meetingViewModel.meetingName.observeAsState("")

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Box {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = stringResource(id = R.string.lobby_explanation),
                        style = MaterialTheme.typography.titleLarge
                    )
                    Spacer(modifier = Modifier.padding(8.dp))
                    Text(
                        stringResource(id = R.string.lobby_instructions),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.5f))
                    .padding(16.dp)
                    .align(Alignment.TopCenter)
            ) {
                Text(
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center,
                    text = stringResource(id = R.string.lobby_title, parseMeetingName(context, meetingName)),
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White
                )
            }

            Surface(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(vertical = 16.dp),
                color = Color.Transparent
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.BottomCenter
                ) {
                    Button(
                        text = stringResource(id = R.string.leave_meeting),
                        onClick = { meetingViewModel.hangUp() }
                    )
                }
            }
        }
    }
}

@DevicesPreview
@Composable
fun LobbyPreview() {
    Lobby(meetingViewModel = PreviewUtils.previewMeetingViewModel())
}