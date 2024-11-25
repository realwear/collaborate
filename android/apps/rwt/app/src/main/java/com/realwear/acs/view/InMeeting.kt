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

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.viewmodel.compose.viewModel
import com.microsoft.fluentui.theme.token.controlTokens.ButtonTokens
import com.microsoft.fluentui.tokenized.controls.Button
import com.realwear.acs.DevicesPreview
import com.realwear.acs.R
import com.realwear.acs.ui.theme.TeamsForRealWearTheme
import com.realwear.acs.util.PreviewUtils.previewMeetingViewModel
import com.realwear.acs.viewmodel.IMeetingViewModel
import com.realwear.acs.viewmodel.IMeetingViewModel.Camera
import com.realwear.acs.viewmodel.IMeetingViewModel.StreamingState

private const val PIP_SIZE_PERCENT = 0.20f

private const val SPEECH_EVENT = "com.realwear.wearhf.intent.action.SPEECH_EVENT"
private const val SPEECH_EVENT_COMMAND = "command"

@Composable
fun InMeeting(
    frameLayout: FrameLayout,
    pipFrameLayout: FrameLayout,
    meetingViewModel: IMeetingViewModel = viewModel()
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val activity = context as? Activity
    val window = (context as? Activity)?.window

    val currentCamera = meetingViewModel.currentCamera.observeAsState(Camera.CLASSIC)
    val micState = meetingViewModel.micState.observeAsState(StreamingState.LIVE)
    val cameraState = meetingViewModel.cameraState.observeAsState(StreamingState.LIVE)
    val isPipActive = meetingViewModel.isPipActive.observeAsState(false)
    val isCameraCalibrating = meetingViewModel.isCameraCalibrating.observeAsState(false)
    val isFlashOn = meetingViewModel.isFlashOn.observeAsState(false)

    val isCameraDisplayDisabled = meetingViewModel.isCameraDisplayDisabled.observeAsState(false)
    val isCameraDisplayPipDisabled = meetingViewModel.isCameraDisplayPipDisabled.observeAsState(false)

    val isFreezeFrame = meetingViewModel.isFreezeFrame.observeAsState(false)

    var isThermalCameraAvailable by remember { mutableStateOf(false) }

    var videoFrameSize by remember { mutableStateOf(854 to 456) }

    var asrBroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == SPEECH_EVENT) {
                when (val command = intent.getStringExtra(SPEECH_EVENT_COMMAND)) {
                    context.getString(R.string.freeze_frame) -> {
                        meetingViewModel.freezeFrame(true)
                    }

                    context.getString(R.string.unfreeze) -> {
                        meetingViewModel.freezeFrame(false)
                    }

                    context.getString(R.string.zoom_in) -> {
                        if (!meetingViewModel.zoomIn()) {
                            Toast.makeText(context, R.string.zoom_max, Toast.LENGTH_SHORT).show()
                        }
                    }

                    context.getString(R.string.zoom_out) -> {
                        if (!meetingViewModel.zoomOut()) {
                            Toast.makeText(context, R.string.zoom_min, Toast.LENGTH_SHORT).show()
                        }
                    }

                    context.getString(R.string.flash_on),
                    context.getString(R.string.flash_light_on),
                    context.getString(R.string.torch_on) -> {
                        meetingViewModel.setFlash(true)
                    }

                    context.getString(R.string.flash_off),
                    context.getString(R.string.flash_light_off),
                    context.getString(R.string.torch_off) -> {
                        meetingViewModel.setFlash(false)
                    }

                    else -> {
                        (1..5).find { level ->
                            command == context.getString(R.string.zoom_level, level)
                        }?.let { level ->
                            meetingViewModel.setZoom(level)
                        }
                    }
                }
            }
        }
    }

    LaunchedEffect(meetingViewModel) {
        isThermalCameraAvailable = meetingViewModel.thermalCameraIsAvailable()
    }

    LaunchedEffect(Unit) {
        meetingViewModel.toastMessage.collect { message ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    DisposableEffect(Unit) {
        window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        context.registerReceiver(asrBroadcastReceiver, IntentFilter(SPEECH_EVENT))

        onDispose {
            context.unregisterReceiver(asrBroadcastReceiver)
            window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    Box(modifier = Modifier
        .fillMaxSize()
        .onSizeChanged { size ->
            videoFrameSize = size.width to size.height
        }) {
        if (isCameraDisplayDisabled.value) {
            Image(
                painter = painterResource(id = R.drawable.videocam_off_24px),
                contentDescription = stringResource(id = R.string.camera_hidden),
                modifier = Modifier
                    .fillMaxSize(0.5f)
                    .align(Alignment.Center)
                    .testTag("CAMERA_HIDDEN"),
                colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onBackground)
            )
        } else {
            AndroidView(
                factory = { frameLayout },
                modifier = Modifier.fillMaxSize()
            )
        }

        val pipWidth = (videoFrameSize.first * PIP_SIZE_PERCENT).toInt()
        val pipHeight = (videoFrameSize.second * PIP_SIZE_PERCENT).toInt()

        if (isPipActive.value) {
            if (isCameraDisplayPipDisabled.value) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .width(pipWidth.dp)
                        .height(pipHeight.dp)
                        .border(1.dp, MaterialTheme.colorScheme.onBackground)
                        .background(MaterialTheme.colorScheme.background)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.videocam_off_24px),
                        contentDescription = stringResource(id = R.string.camera_hidden),
                        modifier = Modifier
                            .fillMaxSize(0.5f)
                            .align(Alignment.Center)
                            .testTag("PIP_HIDDEN"),
                        colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onBackground)
                    )
                }
            } else {
                AndroidView(
                    factory = { pipFrameLayout },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .width(pipWidth.dp)
                        .height(pipHeight.dp)
                        .border(1.dp, MaterialTheme.colorScheme.onBackground)
                        .background(MaterialTheme.colorScheme.background)
                        .testTag("PIP")
                )
            }
        }

        if (isCameraCalibrating.value) {
            Iris()
        }
    }

    Column {
        Surface(modifier = Modifier.fillMaxWidth(), color = Color.Transparent) {
            Box(
                modifier = Modifier.fillMaxSize()
            ) {
                ParticipantOverlay(meetingViewModel)
            }
        }
    }

    val generateInvisibleCommands: () -> String = {
        val commands = buildList {
            if (meetingViewModel.canFreezeFrame()) {
                add(
                    if (isFreezeFrame.value) context.getString(R.string.unfreeze)
                    else context.getString(R.string.freeze_frame)
                )
            }

            if (meetingViewModel.canZoom()) {
                add(context.getString(R.string.zoom_in))
                add(context.getString(R.string.zoom_out))
                addAll((1..5).map { context.getString(R.string.zoom_level, it) })
            }

            if (meetingViewModel.canSetFlash()) {
                if (isFlashOn.value) {
                    add(context.getString(R.string.flash_off))
                    add(context.getString(R.string.flash_light_off))
                    add(context.getString(R.string.torch_off))
                } else {
                    add(context.getString(R.string.flash_on))
                    add(context.getString(R.string.flash_light_on))
                    add(context.getString(R.string.torch_on))
                }
            }
        }

        "hf_show_help_commands:" + commands.joinToString(",") +
                "|hf_add_commands:" + commands.joinToString("|")
    }

    Surface(modifier = Modifier.fillMaxWidth(), color = Color.Transparent) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 16.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Row {
                if (cameraState.value == StreamingState.LIVE) {
                    Button(
                        text = stringResource(id = R.string.hide_camera),
                        onClick = {
                            activity?.let {
                                meetingViewModel.setCameraState(
                                    it,
                                    lifecycleOwner,
                                    StreamingState.OFF
                                )
                            }
                        }
                    )
                } else {
                    Button(
                        text = stringResource(id = R.string.show_camera),
                        onClick = {
                            activity?.let {
                                meetingViewModel.setCameraState(
                                    it,
                                    lifecycleOwner,
                                    StreamingState.LIVE
                                )
                            }
                        }
                    )
                }
                Spacer(Modifier.width(16.dp))

                if (micState.value == StreamingState.LIVE) {
                    Button(
                        text = stringResource(id = R.string.mute_mic),
                        onClick = { meetingViewModel.muteMic(true) }
                    )
                } else {
                    Button(
                        text = stringResource(id = R.string.unmute_mic),
                        onClick = { meetingViewModel.muteMic(false) }
                    )
                }
                Spacer(Modifier.width(16.dp))

                if (isThermalCameraAvailable) {
                    if (currentCamera.value == Camera.CLASSIC) {
                        Button(
                            text = stringResource(id = R.string.thermal_camera),
                            onClick = { activity?.let { meetingViewModel.switchToThermalCamera(it) } }
                        )
                    } else if (currentCamera.value == Camera.THERMAL) {
                        Button(
                            text = stringResource(id = R.string.classic_camera),
                            onClick = { activity?.let { meetingViewModel.switchToClassicCamera(it, lifecycleOwner) } }
                        )
                    } else {
                        Button(
                            enabled = false,
                            icon = ImageVector.vectorResource(id = R.drawable.pending_24px),
                            onClick = {}
                        )
                    }
                    Spacer(Modifier.width(16.dp))
                }

                Button(
                    text = stringResource(id = R.string.leave_meeting),
                    onClick = { meetingViewModel.hangUp() }
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .semantics { contentDescription = "${generateInvisibleCommands.invoke()}" },
            )
        }
    }
}

@Composable
private fun Iris() {
    Column(modifier = Modifier.fillMaxSize()) {
        Spacer(modifier = Modifier.weight(1f))
        Box(
            modifier = Modifier
                .size(75.dp)
                .align(Alignment.CenterHorizontally)
                .testTag("IRIS")
        ) {
            IrisAnimation()
        }
        Spacer(modifier = Modifier.weight(3f))
    }
}

@DevicesPreview
@Composable
fun InMeetingPreview() {
    val context = LocalContext.current

    TeamsForRealWearTheme(dynamicColor = false) {
        InMeeting(
            frameLayout = FrameLayout(context),
            pipFrameLayout = FrameLayout(context),
            meetingViewModel = previewMeetingViewModel()
        )
    }
}

@DevicesPreview
@Composable
fun InMeetingPipPreview() {
    val context = LocalContext.current

    TeamsForRealWearTheme(dynamicColor = false) {
        InMeeting(
            frameLayout = FrameLayout(context),
            pipFrameLayout = FrameLayout(context),
            meetingViewModel = previewMeetingViewModel(enablePip = true)
        )
    }
}

@DevicesPreview
@Composable
fun InMeetingCameraOffPreview() {
    val context = LocalContext.current

    TeamsForRealWearTheme(dynamicColor = false) {
        InMeeting(
            frameLayout = FrameLayout(context),
            pipFrameLayout = FrameLayout(context),
            meetingViewModel = previewMeetingViewModel(
                enablePip = true,
                disableCameraDisplay = true,
                disableCameraDisplayPip = true
            )
        )
    }
}
