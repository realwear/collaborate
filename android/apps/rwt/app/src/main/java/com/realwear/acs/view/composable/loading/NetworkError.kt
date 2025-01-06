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

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewmodel.compose.viewModel
import com.realwear.acs.DevicesPreview
import com.realwear.acs.R
import com.realwear.acs.util.PreviewUtils
import com.realwear.acs.viewmodel.IMeetingViewModel

@Composable
fun NetworkError(meetingViewModel: IMeetingViewModel = viewModel()) {
    LoadingContent(
        meetingViewModel = meetingViewModel,
        icon = R.drawable.error_24px,
        animate = false,
        titleResource = R.string.network_error_title,
        explanation = stringResource(id = R.string.network_error_explanation),
        instruction = stringResource(id = R.string.network_error_instructions)
    )
}

@Composable
@DevicesPreview
private fun NetworkErrorPreview() {
    NetworkError(meetingViewModel = PreviewUtils.previewMeetingViewModel())
}