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

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.microsoft.fluentui.theme.token.controlTokens.AvatarStatus
import com.microsoft.fluentui.tokenized.persona.Avatar
import com.microsoft.fluentui.tokenized.persona.Person
import com.realwear.acs.util.PreviewUtils
import com.realwear.acs.viewmodel.IMeetingViewModel
import com.realwear.acs.viewmodel.MeetingViewModel

@Composable
fun ParticipantOverlay(meetingViewModel: IMeetingViewModel = viewModel()) {
    val participants by meetingViewModel.participants.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        LazyColumn(modifier = Modifier.fillMaxWidth()) {
            items(participants.take(MeetingViewModel.MAX_PARTICIPANTS_TO_DISPLAY)) { participant ->
                Avatar(
                    modifier = Modifier.padding(8.dp),
                    person = Person(
                        firstName = participant.firstName,
                        lastName = participant.lastName,
                        email = "",
                        isActive = true,
                        status = AvatarStatus.Available,
                    ),
                    enableActivityRings = participant.isTalking,
                    enablePresence = false,
                )
            }

            if (participants.size > MeetingViewModel.MAX_PARTICIPANTS_TO_DISPLAY) {
                item {
                    Avatar(
                        modifier = Modifier.padding(8.dp),
                        overflowCount = participants.size - MeetingViewModel.MAX_PARTICIPANTS_TO_DISPLAY
                    )
                }
            }
        }
    }
}

@Composable
@Preview
fun ParticipantOverlayPreview() {
    ParticipantOverlay(meetingViewModel = PreviewUtils.previewMeetingViewModel(5))
}