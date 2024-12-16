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

import android.content.ActivityNotFoundException
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.lifecycle.lifecycleScope
import com.realwear.acs.repository.PermissionsRepository
import com.realwear.acs.ui.theme.TeamsForRealWearTheme
import com.realwear.acs.util.EisUtils
import com.realwear.acs.util.Utils
import com.realwear.acs.view.composable.loading.Calling
import com.realwear.acs.view.composable.loading.Loading
import com.realwear.acs.view.composable.loading.NetworkError
import com.realwear.acs.viewmodel.IMeetingViewModel.State
import com.realwear.acs.viewmodel.MeetingViewModel
import com.realwear.acs.viewmodel.PermissionsRefusedViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import timber.log.Timber

@AndroidEntryPoint
class MeetingActivity : ComponentActivity() {
    private val meetingViewModel: MeetingViewModel by viewModels()
    private val permissionsRefusedViewModel: PermissionsRefusedViewModel by viewModels()

    private var initialEisSetting = ""
    private var isEisBroadcastReceiverRegistered = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        volumeControlStream = AudioManager.STREAM_VOICE_CALL

        setContent {
            val context = LocalContext.current

            val currentState = meetingViewModel.currentState.collectAsState()
            val videoStreamRendererViewState = meetingViewModel.videoStreamRendererViewState.collectAsState(null)
            val pipRendererViewState = meetingViewModel.pipRendererViewState.collectAsState(null)

            val frameLayout = remember { FrameLayout(context) }
            val pipFrameLayout = remember { FrameLayout(context) }

            var showDialog by remember { mutableStateOf(false) }

            LaunchedEffect(Unit) {
                lifecycleScope.launch {
                    meetingViewModel.requestPermissionsEvent.collect {
                        Timber.i("Requesting permissions for joining meeting.")
                        requestPermissionsLauncher.launch(it)
                    }
                }

                lifecycleScope.launch {
                    permissionsRefusedViewModel.requestPermissionsEvent.collect {
                        Timber.i("Requesting permissions for joining meeting.")
                        requestPermissionsLauncher.launch(it)
                    }
                }

                if (meetingViewModel.currentState.value != State.PERMISSIONS_REFUSED) {
                    requestPermissionsLauncher.launch(PermissionsRepository.REQUIRED_PERMISSIONS)
                }
            }

            DisposableEffect(videoStreamRendererViewState.value) {
                frameLayout.removeAllViews()

                videoStreamRendererViewState.value?.let { videoView ->
                    pipFrameLayout.removeView(videoView.frameLayout)
                    frameLayout.addView(videoView.frameLayout)
                }
                onDispose {
                    frameLayout.removeAllViews()
                }
            }

            DisposableEffect(pipRendererViewState.value) {
                pipFrameLayout.removeAllViews()

                pipRendererViewState.value?.let { videoView ->
                    frameLayout.removeView(videoView.frameLayout)
                    pipFrameLayout.addView(videoView.frameLayout)
                }
                onDispose {
                    pipFrameLayout.removeAllViews()
                }
            }

            BackHandler {
                showDialog = true
            }

            TeamsForRealWearTheme {
                if (showDialog) {
                    EndMeetingDialog(
                        onConfirm = {
                            showDialog = false
                            meetingViewModel.hangUp()
                        },
                        onDismiss = { showDialog = false }
                    )
                }

                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .semantics { contentDescription = "hf_no_number" },
                    color = MaterialTheme.colorScheme.background
                ) {
                    Timber.i("Current state: ${currentState.value}")
                    when (currentState.value) {
                        State.LOADING -> Loading(meetingViewModel)

                        State.JOINING_MEETING -> Loading(meetingViewModel)

                        State.CALLING_PARTICIPANT -> Calling(meetingViewModel)

                        State.PERMISSIONS_REFUSED -> PermissionsRefused(permissionsRefusedViewModel)

                        State.NETWORK_ERROR -> NetworkError(meetingViewModel)

                        State.IN_LOBBY -> Lobby(meetingViewModel)

                        State.IN_TEAMS_LOBBY -> TeamsLobby(meetingViewModel)

                        State.IN_MEETING -> InMeeting(frameLayout, pipFrameLayout, meetingViewModel)

                        State.HANGING_UP -> HangingUp()

                        State.FINISHED -> {
                            Timber.i("Meeting finished. Closing activity.")
                            finish()
                        }
                    }
                }
            }
        }
    }

    override fun onPause() {
        meetingViewModel.onPause(this, this)

        resetEisSetting()

        super.onPause()
    }

    override fun onResume() {
        super.onResume()

        requestEisSetting()

        meetingViewModel.onResume(this, this)
    }

    private val cameraBroadcastReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val action = intent.action
            if (action == EisUtils.INTENT_GET_CAMERA_SETTINGS) {
                if (intent.hasExtra(EisUtils.STABILIZATION_LABEL)) {
                    unregisterReceiver(this)
                    isEisBroadcastReceiverRegistered = false

                    initialEisSetting = intent.getStringExtra(EisUtils.STABILIZATION_LABEL) ?: ""
                    Timber.i("Existing EIS is $initialEisSetting")
                }
            }
        }
    }

    private fun requestEisSetting() {
        registerReceiver(cameraBroadcastReceiver, IntentFilter(EisUtils.INTENT_GET_CAMERA_SETTINGS))
        isEisBroadcastReceiverRegistered = true

        EisUtils.requestImageStabilizationSettings(baseContext)
    }

    private fun resetEisSetting() {
        if (isEisBroadcastReceiverRegistered) {
            unregisterReceiver(cameraBroadcastReceiver)
            isEisBroadcastReceiverRegistered = false
        }

        if (initialEisSetting.isNotEmpty()) {
            Timber.i("Resetting EIS to $initialEisSetting")
            EisUtils.setImageStabilizationMode(baseContext, initialEisSetting)
        }
    }

    private val requestPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        Timber.i("Permissions results received.")
        val meetingType = intent.getStringExtra(MEETING_TYPE) ?: ""
        if (meetingType.isNullOrBlank() || meetingType !in MeetingType.values().map { it.name }) {
            Timber.e("Meeting type not found in intent.")
            finish()
            return@registerForActivityResult
        }

        when (MeetingType.valueOf(meetingType)) {
            MeetingType.MEETING -> handleMeetingIntent(permissions)
            MeetingType.CALL -> handleCallIntent(permissions)
        }
    }

    private fun handleMeetingIntent(permissions: Map<String, Boolean>) {
        val userToken = intent.getStringExtra(USER_TOKEN) ?: ""
        if (userToken.isNullOrBlank()) {
            Timber.e("User token not found in intent.")
            finish()
            return
        }

        val meetingAddress = intent.getStringExtra(MEETING_LINK) ?: ""
        if (meetingAddress.isNullOrBlank()) {
            Timber.e("Meeting link not found in intent.")
            finish()
            return
        }

        val participantName = Utils.parseLocalParticipantName(intent.getStringExtra(PARTICIPANT_NAME), Build.MODEL)
        val meetingName = intent.getStringExtra(MEETING_NAME) ?: ""

        meetingViewModel.onPermissionsResult(
            this,
            this,
            permissions,
            userToken,
            meetingAddress,
            participantName,
            meetingName
        )
    }

    private fun handleCallIntent(permissions: Map<String, Boolean>) {
        val userToken = intent.getStringExtra(USER_TOKEN) ?: ""
        if (userToken.isNullOrBlank()) {
            Timber.e("User token not found in intent.")
            finish()
            return
        }

        val participantId = intent.getStringExtra(PARTICIPANT_ID) ?: ""
        if (participantId.isNullOrBlank()) {
            Timber.e("Participant ID not found in intent.")
            finish()
            return
        }

        meetingViewModel.onPermissionsResultForCall(
            this,
            this,
            permissions,
            userToken,
            participantId
        )
    }

    companion object {
        private const val MEETING_TYPE = "meeting_type"
        private const val USER_TOKEN = "user_token"
        private const val MEETING_LINK = "meeting_link"
        private const val PARTICIPANT_NAME = "participant_name"
        private const val MEETING_NAME = "meeting_name"
        private const val PARTICIPANT_ID = "participant_id"

        private enum class MeetingType {
            MEETING,
            CALL
        }

        fun joinMeeting(
            context: Context,
            userToken: String,
            meetingLink: String,
            participantName: String?,
            meetingName: String?
        ): Boolean {
            if (userToken.isBlank() || meetingLink.isBlank()) {
                return false
            }

            try {
                val intent = Intent(context, MeetingActivity::class.java).apply {
                    putExtra(MEETING_TYPE, MeetingType.MEETING.name)
                    putExtra(USER_TOKEN, userToken)
                    putExtra(MEETING_LINK, meetingLink)
                    putExtra(PARTICIPANT_NAME, participantName)
                    putExtra(MEETING_NAME, meetingName)
                }
                context.startActivity(intent)
            } catch (ex: ActivityNotFoundException) {
                Timber.e("Failed to start MeetingActivity", ex)
                return false
            }

            return true
        }

        fun callParticipant(context: Context, userToken: String, participantId: String): Boolean {
            if (userToken.isBlank() || participantId.isBlank()) {
                return false
            }

            try {
                val intent = Intent(context, MeetingActivity::class.java).apply {
                    putExtra(MEETING_TYPE, MeetingType.CALL.name)
                    putExtra(USER_TOKEN, userToken)
                    putExtra(PARTICIPANT_ID, participantId)
                }
                context.startActivity(intent)
            } catch (ex: ActivityNotFoundException) {
                Timber.e("Failed to start MeetingActivity", ex)
                return false
            }

            return true
        }
    }
}
