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
package com.realwear.acs.view.composable.loading

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewmodel.compose.viewModel
import com.realwear.acs.DevicesPreview
import com.realwear.acs.R
import com.realwear.acs.util.PreviewUtils
import com.realwear.acs.util.Utils.parseMeetingName
import com.realwear.acs.viewmodel.IMeetingViewModel

@Composable
fun Loading(meetingViewModel: IMeetingViewModel = viewModel()) {
    val context = LocalContext.current
    val meetingName by meetingViewModel.meetingName.observeAsState("")

    LoadingContent(
        meetingViewModel = meetingViewModel,
        icon = R.drawable.supervised_user_circle_24dp,
        animate = true,
        title = stringResource(id = R.string.meeting_loading_title, parseMeetingName(context, meetingName)),
        explanation = stringResource(id = R.string.meeting_loading_explanation),
        instruction = stringResource(id = R.string.meeting_loading_instructions)
    )
}

@Composable
@DevicesPreview
private fun LoadingPreview() {
    Loading(meetingViewModel = PreviewUtils.previewMeetingViewModel())
}