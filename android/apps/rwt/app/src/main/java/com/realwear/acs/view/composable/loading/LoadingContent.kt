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
package com.realwear.acs.view.composable.loading

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.microsoft.fluentui.tokenized.controls.Button
import com.realwear.acs.DevicesPreview
import com.realwear.acs.R
import com.realwear.acs.ui.theme.TeamsForRealWearTheme
import com.realwear.acs.util.PreviewUtils
import com.realwear.acs.util.Utils.parseMeetingName
import com.realwear.acs.viewmodel.IMeetingViewModel

@Composable
fun LoadingContent(
    meetingViewModel: IMeetingViewModel = viewModel(),
    icon: Int,
    animate: Boolean,
    titleResource: Int,
    explanation: String,
    instruction: String
) {
    val context = LocalContext.current
    val meetingName by meetingViewModel.meetingName.observeAsState("")

    Box(
        modifier = Modifier
            .background(MaterialTheme.colorScheme.background)
            .padding(top = 40.dp),
        contentAlignment = Alignment.TopCenter
    ) {
        Box(contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Spacer(modifier = Modifier.weight(1f))

                Text(
                    text = stringResource(id = titleResource, parseMeetingName(context, meetingName)),
                    style = MaterialTheme.typography.titleLarge
                )

                Spacer(modifier = Modifier.weight(2.5f))

                Text(
                    text = explanation,
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.padding(8.dp))
                Text(
                    instruction,
                    style = MaterialTheme.typography.bodyMedium
                )

                Spacer(modifier = Modifier.weight(1f))
            }

            LoadingIcon(modifier = Modifier.fillMaxSize(), icon = icon, animate = animate)
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            contentAlignment = Alignment.BottomEnd
        ) {
            Button(
                text = stringResource(id = R.string.leave_meeting),
                onClick = { meetingViewModel.hangUp() }
            )
        }
    }
}

@Composable
@DevicesPreview
private fun LoadingContentPreview() {
    TeamsForRealWearTheme(dynamicColor = false) {
        LoadingContent(
            meetingViewModel = PreviewUtils.previewMeetingViewModel(),
            icon = R.drawable.supervised_user_circle_24dp,
            animate = true,
            titleResource = R.string.meeting_loading_title,
            explanation = "Explanation about the current state",
            instruction = "Instructions on what to try next"
        )
    }
}