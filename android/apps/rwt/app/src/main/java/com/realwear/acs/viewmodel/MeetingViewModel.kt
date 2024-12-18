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
package com.realwear.acs.viewmodel

import android.app.Activity
import android.content.Context
import android.os.Build
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.azure.android.communication.calling.CallState
import com.azure.android.communication.calling.CallVideoStream
import com.realwear.acs.R
import com.realwear.acs.dependency.IApplication
import com.realwear.acs.dependency.ICall
import com.realwear.acs.dependency.ICallAgent
import com.realwear.acs.dependency.ICallClient
import com.realwear.acs.dependency.IFrameLayout
import com.realwear.acs.hilt.AppModule
import com.realwear.acs.model.Participant
import com.realwear.acs.model.ParticipantListeners
import com.realwear.acs.model.UpdatedParticipants
import com.realwear.acs.repository.IAcsRepository
import com.realwear.acs.util.thermal.ThermalUtil
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ActivityContext
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class MeetingViewModel @Inject constructor(
    private val appContext: IApplication,
    @AppModule.IoDispatcher private val ioDispatcher: CoroutineDispatcher,
    @AppModule.MainDispatcher private val mainDispatcher: CoroutineDispatcher,
    private val callClient: ICallClient,
    private val acsRepository: IAcsRepository
) : IMeetingViewModel() {
    private val _currentState = MutableStateFlow(State.LOADING)
    val currentState: StateFlow<State> get() = _currentState

    private val _requestPermissionsEvent = MutableSharedFlow<Array<String>>()
    val requestPermissionsEvent: SharedFlow<Array<String>> get() = _requestPermissionsEvent

    private val _videoStreamRendererViewState = MutableStateFlow<IFrameLayout?>(null)
    val videoStreamRendererViewState: StateFlow<IFrameLayout?> get() = _videoStreamRendererViewState

    private val _pipRendererViewState = MutableStateFlow<IFrameLayout?>(null)
    val pipRendererViewState: StateFlow<IFrameLayout?> get() = _pipRendererViewState

    private val _participants = MutableStateFlow<List<Participant>>(emptyList())
    override val participants: StateFlow<List<Participant>> get() = _participants

    private val _meetingName = MutableLiveData("")
    override val meetingName: LiveData<String> = _meetingName

    private val _currentCamera = MutableLiveData(Camera.CLASSIC)
    override val currentCamera: LiveData<Camera> = _currentCamera

    private val _micState = MutableLiveData(StreamingState.LIVE)
    override val micState: LiveData<StreamingState> = _micState

    private val _cameraState = MutableLiveData(StreamingState.LIVE)
    override val cameraState: LiveData<StreamingState> = _cameraState

    private val _toastMessage = MutableSharedFlow<String>()
    override val toastMessage = _toastMessage.asSharedFlow()

    private val _isPipActive = MutableLiveData(false)
    override val isPipActive: LiveData<Boolean> = _isPipActive

    private val _isFreezeFrame = MutableLiveData(false)
    override val isFreezeFrame: LiveData<Boolean> = _isFreezeFrame

    private var cameraCalibrationStateJob: Job? = null
    private val _isCameraCalibrating = MutableLiveData(false)
    override val isCameraCalibrating: LiveData<Boolean> = _isCameraCalibrating

    private val _isCameraDisplayDisabled = MutableLiveData(false)
    override val isCameraDisplayDisabled: LiveData<Boolean> = _isCameraDisplayDisabled

    private val _isCameraDisplayPipDisabled = MutableLiveData(false)
    override val isCameraDisplayPipDisabled: LiveData<Boolean> = _isCameraDisplayPipDisabled

    private val _zoomLevel = MutableLiveData(1)
    override val zoomLevel: LiveData<Int> = _zoomLevel

    private val _isFlashOn = MutableLiveData(false)
    override val isFlashOn: LiveData<Boolean> = _isFlashOn

    private var call: ICall? = null
    private var callAgent: ICallAgent? = null

    private var currentVideoStreamer: String? = null

    private var userToken = ""
    private var meetingLink = ""
    private var participantName = ""

    private var participantId = ""

    private val participantStateListenersMap = mutableMapOf<String, ParticipantListeners>()

    override fun onPause(activity: Activity, lifecycleOwner: LifecycleOwner) {
        if (_currentState.value == State.IN_MEETING && _cameraState.value == StreamingState.LIVE) {
            setCameraState(activity, lifecycleOwner, StreamingState.PAUSED)
        }

        cameraCalibrationStateJob?.cancel()
        cameraCalibrationStateJob = null
    }

    override fun onResume(activity: Activity, lifecycleOwner: LifecycleOwner) {
        if (_currentState.value == State.IN_MEETING && _cameraState.value == StreamingState.PAUSED) {
            setCameraState(activity, lifecycleOwner, StreamingState.LIVE)
        }

        cameraCalibrationStateJob = viewModelScope.launch(ioDispatcher) {
            acsRepository.calibrationState.collect {
                withContext(mainDispatcher) {
                    _isCameraCalibrating.value = it
                }
            }
        }
    }

    override fun switchToThermalCamera(activity: Activity) {
        Timber.i("Switching to thermal camera.")
        if (_cameraState.value == StreamingState.OFF) {
            Timber.i("Camera is off. Not starting thermal camera.")
            _currentCamera.value = Camera.THERMAL
            return
        }

        if (_cameraState.value == StreamingState.CHANGING) {
            Timber.w("Cannot switch camera to thermal while camera is changing.")
            return
        }

        _cameraState.value = StreamingState.CHANGING
        _currentCamera.value = Camera.CHANGING
        _isFreezeFrame.value = false

        viewModelScope.launch(ioDispatcher) {
            acsRepository.stopStreaming(appContext, viewModelScope).get()
            acsRepository.streamThermalVideoStream(activity, viewModelScope, callAgent).get()
            displayCamera(Camera.THERMAL).also {
                withContext(mainDispatcher) { _currentCamera.value = Camera.THERMAL }
            }
            Timber.i("Thermal camera streaming")
        }
    }

    override fun switchToClassicCamera(activity: Activity, lifecycleOwner: LifecycleOwner) {
        Timber.i("Switching to main camera.")
        if (_cameraState.value == StreamingState.OFF) {
            Timber.i("Camera is off. Not starting main camera.")
            _currentCamera.value = Camera.CLASSIC
            return
        }

        if (_cameraState.value == StreamingState.CHANGING) {
            Timber.w("Cannot switch camera to thermal while camera is changing.")
            return
        }

        _cameraState.value = StreamingState.CHANGING
        _currentCamera.value = Camera.CHANGING
        _isFreezeFrame.value = false

        viewModelScope.launch(ioDispatcher) {
            acsRepository.stopStreaming(appContext, viewModelScope).get()
            acsRepository.streamClassicCameraVideoStream(activity, viewModelScope, callAgent, lifecycleOwner)
            displayCamera(Camera.CLASSIC).also {
                withContext(mainDispatcher) { _currentCamera.value = Camera.CLASSIC }
            }
            Timber.i("Main camera streaming")
        }
    }

    override fun setCameraState(activity: Activity, lifecycleOwner: LifecycleOwner, state: StreamingState) {
        Timber.i("Setting camera state to $state.")
        _cameraState.value = state

        if (_cameraState.value == StreamingState.LIVE) {
            _isCameraDisplayDisabled.value = false
            _isCameraDisplayPipDisabled.value = false

            _isFreezeFrame.value = false

            if (_currentCamera.value == Camera.THERMAL) {
                acsRepository.streamThermalVideoStream(activity, viewModelScope, callAgent)
            } else {
                acsRepository.streamClassicCameraVideoStream(activity, viewModelScope, callAgent, lifecycleOwner)
            }

            displayCurrentCamera()
        } else {
            callAgent?.stopOutgoingVideo(appContext.application)
            acsRepository.stopStreaming(appContext, viewModelScope)

            if (currentVideoStreamer == null) {
                Timber.i("Removing camera stream.")
                _videoStreamRendererViewState.value = null
                _isCameraDisplayDisabled.value = true
            } else {
                Timber.i("Removing camera stream from PIP.")
                _pipRendererViewState.value = null
                _isCameraDisplayPipDisabled.value = true
            }
        }
    }

    override suspend fun thermalCameraIsAvailable(): Boolean {
        // If running on less than Android 11, return false
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            return false
        }

        //
        // If the current camera is already thermal then we know it's compatible.
        // Calling isThermalCameraAvailable when starting the thermal camera causes a crash.
        // This happens when returning to a call from the lobby when the thermal camera is active.
        //
        return currentCamera.value == Camera.THERMAL || ThermalUtil.isThermalCameraAvailable(appContext.application)
    }

    fun onPermissionsResult(
        activityContext: Activity,
        lifecycleOwner: LifecycleOwner,
        permissions: Map<String, Boolean>,
        userToken: String,
        meetingAddress: String,
        participantName: String,
        meetingName: String
    ) {
        if (permissions.all { it.value }) {
            Timber.i("Permissions granted. Joining meeting. ${_currentState.value}")
            if (_currentState.value == State.LOADING || _currentState.value == State.PERMISSIONS_REFUSED) {
                _currentState.value = State.JOINING_MEETING

                this.userToken = userToken
                this.meetingLink = meetingAddress
                this.participantName = participantName
                this._meetingName.value = meetingName

                joinTeamsMeeting(activityContext, lifecycleOwner)
            } else {
                Timber.i("Meeting already joined.")
            }
        } else {
            Timber.e("Required permissions denied.")
            _currentState.value = State.PERMISSIONS_REFUSED
        }
    }

    fun onPermissionsResultForCall(
        activityContext: Activity,
        lifecycleOwner: LifecycleOwner,
        permissions: Map<String, Boolean>,
        userToken: String,
        participantId: String,
    ) {
        if (permissions.all { it.value }) {
            Timber.i("Permissions granted. Calling participant. ${_currentState.value}")

            if (_currentState.value == State.LOADING || _currentState.value == State.PERMISSIONS_REFUSED) {
                _currentState.value = State.CALLING_PARTICIPANT

                this.userToken = userToken
                this.participantId = participantId

                joinTeamsCall(activityContext, lifecycleOwner)
            } else {
                Timber.i("Meeting already joined.")
            }
        } else {
            Timber.e("Required permissions denied.")
            _currentState.value = State.PERMISSIONS_REFUSED
        }
    }

    private fun joinTeamsMeeting(@ActivityContext activityContext: Context, lifecycleOwner: LifecycleOwner) {
        if (currentState.value != State.JOINING_MEETING) {
            Timber.w("Meeting already joined.")
            return
        }

        viewModelScope.launch(ioDispatcher) {
            if (callAgent == null) {
                Timber.i("Creating call agent.")
                callAgent = acsRepository.createCallAgent(appContext, callClient, userToken, participantName)
            } else {
                Timber.e("Call agent already initialized.")
            }

            call = acsRepository.joinCall(appContext, callAgent, meetingLink)

            call?.setOnStateChangedListener(createOnStateChangedListener(activityContext, lifecycleOwner))
            call?.setOnRemoteParticipantsUpdatedListener(
                createOnRemoteParticipantsUpdatedListener(
                    activityContext,
                    lifecycleOwner
                )
            )
            call?.setOnMutedByOthersListener(createOnMutedListener())
            call?.startLoggingStatistics()
        }
    }

    private fun joinTeamsCall(@ActivityContext activityContext: Context, lifecycleOwner: LifecycleOwner) {
        if (currentState.value != State.CALLING_PARTICIPANT) {
            Timber.w("Call already in progress.")
            return
        }

        viewModelScope.launch(ioDispatcher) {
            if (callAgent == null) {
                Timber.i("Creating call agent.")
                callAgent = acsRepository.createTeamsCallAgent(appContext, callClient, userToken)
            } else {
                Timber.e("Call agent already initialized.")
            }

            call = acsRepository.callUser(appContext, callAgent, participantId)

            call?.setOnStateChangedListener(createOnStateChangedListener(activityContext, lifecycleOwner))
            call?.setOnRemoteParticipantsUpdatedListener(
                createOnRemoteParticipantsUpdatedListener(
                    activityContext,
                    lifecycleOwner
                )
            )
            call?.setOnMutedByOthersListener(createOnMutedListener())
            call?.startLoggingStatistics()
        }
    }

    private fun cleanup() {
        acsRepository.cleanUp(appContext, viewModelScope)

        callAgent?.dispose()
        callAgent = null

        call = null

        userToken = ""
        meetingLink = ""
        participantName = ""
    }

    override fun muteMic(mute: Boolean) {
        _micState.value = if (mute) StreamingState.OFF else StreamingState.LIVE
        call?.muteMic(appContext.application, mute)
    }

    override fun canFreezeFrame(): Boolean {
        return _currentCamera.value == Camera.CLASSIC
    }

    override fun freezeFrame(freeze: Boolean) {
        _isFreezeFrame.value = freeze
        acsRepository.freezeFrame(freeze)
    }

    override fun canZoom(): Boolean {
        return _currentCamera.value == Camera.CLASSIC
    }

    override fun setZoom(zoom: Int): Boolean {
        if (zoom < ZOOM_RANGE.first || zoom > ZOOM_RANGE.second) {
            Timber.w("Zoom level out of range.")
            return false
        }

        _zoomLevel.value = zoom
        acsRepository.setZoom(zoom)
        return true
    }

    override fun zoomIn(): Boolean {
        _zoomLevel.value?.let {
            return setZoom(it + 1)
        }

        return false
    }

    override fun zoomOut(): Boolean {
        _zoomLevel.value?.let {
            return setZoom(it - 1)
        }

        return false
    }

    override fun canSetFlash(): Boolean {
        return _currentCamera.value == Camera.CLASSIC
    }

    override fun setFlash(on: Boolean) {
        acsRepository.setFlash(on)
        _isFlashOn.value = on
    }

    override fun hangUp() {
        Timber.i("Hanging up meeting.")
        _currentState.value = State.HANGING_UP

        call?.hangUp()?.thenRun {
            Timber.i("Meeting was hung up.")
        } ?: run {
            Timber.i("Hangup called when not in a meeting.")
            unsubscribeFromCallEvents()
            cleanup()
            _currentState.value = State.FINISHED
        }
    }

    private fun unsubscribeFromCallEvents() {
        call?.removeOnStateChangedListener()
        call?.removeOnRemoteParticipantsUpdatedListener()
        call?.removeOnMutedByOthersListener()
        call?.stopLoggingStatistics()
    }

    private fun createOnStateChangedListener(
        @ActivityContext activityContext: Context,
        lifecycleOwner: LifecycleOwner
    ): () -> Unit {
        return {
            Timber.i("Call state: ${call?.state}")
            when (call?.state) {
                CallState.CONNECTED -> {
                    call?.getParticipants()?.forEach { participant ->
                        addParticipant(activityContext, lifecycleOwner, participant)
                    }
                    checkIsLobby(activityContext, lifecycleOwner)
                }

                CallState.IN_LOBBY -> {
                    _currentState.value = State.IN_TEAMS_LOBBY
                }

                CallState.DISCONNECTED -> {
                    call?.callEndedReason.let { callEndReason ->
                        when (callEndReason) {
                            ICall.CallEndedReason.USER_HUNG_UP -> {
                                Timber.i("Call ended by user.")
                                unsubscribeFromCallEvents()
                                cleanup()
                                _currentState.value = State.FINISHED
                            }

                            ICall.CallEndedReason.NETWORK_ERROR -> {
                                Timber.i("Network error while connecting call.")
                                _currentState.value = State.NETWORK_ERROR
                            }

                            else -> {
                                Timber.e("Call ended with an unknown reason.")
                                unsubscribeFromCallEvents()
                                cleanup()
                                _currentState.value = State.FINISHED
                            }
                        }
                    }
                }

                else -> {
                    // Do nothing.
                }
            }
        }
    }

    private fun addParticipant(
        @ActivityContext activityContext: Context,
        lifecycleOwner: LifecycleOwner,
        participant: Participant
    ) {
        Timber.i("Adding participant: ${participant.identifier}")
        if (_participants.value.any { it.identifier == participant.identifier }) {
            return
        }

        participantStateListenersMap[participant.identifier] = ParticipantListeners(
            videoStreamStateChangedListener = createVideoStreamStateChangedListener(
                activityContext,
                lifecycleOwner,
                participant
            ),
            isTalkingStateChangedListener = createIsTalkingStateChangedListener(participant)
        ).apply {
            call?.addOnRemoteParticipantVideoStreamStateChangedListener(
                participant.identifier,
                videoStreamStateChangedListener
            )
            call?.addOnRemoteParticipantSpeakingChangedListener(
                participant.identifier,
                isTalkingStateChangedListener
            )
        }

        _participants.value += participant

        checkIsLobby(activityContext, lifecycleOwner)
    }

    private fun createOnRemoteParticipantsUpdatedListener(
        @ActivityContext activityContext: Context,
        lifecycleOwner: LifecycleOwner
    ): (UpdatedParticipants) -> Unit {
        return { updatedParticipants ->
            updatedParticipants.addedParticipants.forEach { participant ->
                Timber.i("Participant added")
                addParticipant(activityContext, lifecycleOwner, participant)
            }

            updatedParticipants.removedParticipants.forEach { participant ->
                Timber.i("Participant removed")

                //
                // Reorganize the speakers list before removing the participant.
                // This ensures this speaker's position is maintained in the ordering.
                //
                _participants.value = _participants.value.map {
                    if (it.identifier == participant.identifier) {
                        it.copy(isTalking = false)
                    } else {
                        it
                    }
                }
                organizeSpeakers()

                _participants.value -= _participants.value.first { it.identifier == participant.identifier }

                checkIsLobby(activityContext, lifecycleOwner)

                participantStateListenersMap[participant.identifier]?.let {
                    // Ensure any screen sharing video stream is stopped.
                    if (currentVideoStreamer == participant.identifier) {
                        it.videoStreamStateChangedListener(false, null)
                    }

                    call?.removeOnRemoteParticipantVideoStreamStateChangedListener(
                        participant.identifier,
                        it.videoStreamStateChangedListener
                    )
                    call?.removeOnRemoteParticipantSpeakingChangedListener(
                        participant.identifier,
                        it.isTalkingStateChangedListener
                    )
                }

                participantStateListenersMap.remove(participant.identifier)
            }
        }
    }

    private fun createVideoStreamStateChangedListener(
        @ActivityContext activityContext: Context,
        lifecycleOwner: LifecycleOwner,
        participant: Participant
    ): (Boolean, CallVideoStream?) -> Unit {
        return { isScreenSharing, callVideoStream ->
            if (isScreenSharing) {
                Timber.i("Setting screen sharing participant.")
                currentVideoStreamer = participant.identifier

                displayCurrentCamera()

                viewModelScope.launch(mainDispatcher) {
                    _isPipActive.value = true
                    _isCameraDisplayPipDisabled.value = _isCameraDisplayDisabled.value
                    _isCameraDisplayDisabled.value = false
                }

                acsRepository.displayRemoteVideoStream(appContext, callVideoStream)?.let { videoStreamRenderView ->
                    _videoStreamRendererViewState.value = videoStreamRenderView
                }
            } else {
                Timber.i("Removing sharing stream participant.")
                currentVideoStreamer?.let {
                    currentVideoStreamer = null

                    checkIsLobby(activityContext, lifecycleOwner)

                    viewModelScope.launch(mainDispatcher) {
                        _isPipActive.value = false
                        _isCameraDisplayDisabled.value = _isCameraDisplayPipDisabled.value
                        _isCameraDisplayPipDisabled.value = false
                    }

                    if (_currentState.value == State.IN_MEETING && _cameraState.value == StreamingState.LIVE) {
                        displayCurrentCamera()
                    }
                }
            }
        }
    }

    private fun createIsTalkingStateChangedListener(
        participant: Participant
    ): (Boolean) -> Unit {
        return { isSpeaking ->
            _participants.value = _participants.value.map {
                if (it.identifier == participant.identifier) {
                    it.copy(isTalking = isSpeaking)
                } else {
                    it
                }
            }

            organizeSpeakers()
        }
    }

    private fun organizeSpeakers() {
        val talkingList = arrayListOf<Participant>()
        val silentList = arrayListOf<Participant>()
        _participants.value.forEach {
            if (it.isTalking) {
                talkingList.add(it)
            } else {
                silentList.add(it)
            }
        }

        val displayedParticipants = _participants.value.take(MAX_PARTICIPANTS_TO_DISPLAY)
        val newDisplayedParticipants = arrayListOf<Participant>()
        displayedParticipants.forEach { displayedParticipant ->
            if (!displayedParticipant.isTalking) {
                // There's a participant in the display list who isn't talking
                talkingList.firstOrNull { talker -> !displayedParticipants.contains(talker) }?.let { next ->
                    // There's a participant talking who isn't displayed.
                    newDisplayedParticipants.add(next)
                    talkingList.remove(next)
                } ?: run {
                    // There's no one else talking, so the silent participant can be displayed.
                    newDisplayedParticipants.add(displayedParticipant)
                    silentList.remove(displayedParticipant)
                }
            } else {
                // The participant is still talking, so they continue to be displayed.
                newDisplayedParticipants.add(displayedParticipant)
                talkingList.remove(displayedParticipant)
            }
        }

        _participants.value = newDisplayedParticipants + talkingList + silentList
    }

    private fun createOnMutedListener(): () -> Unit {
        return {
            viewModelScope.launch(mainDispatcher) {
                if (_micState.value == StreamingState.LIVE) {
                    _micState.value = StreamingState.OFF
                    triggerToastMessage(appContext.application.getString(R.string.muted_by_others))
                }
            }
        }
    }

    private fun checkIsLobby(@ActivityContext activityContext: Context, lifecycleOwner: LifecycleOwner) {
        if (call?.state != CallState.CONNECTED) {
            return
        }

        Timber.i("Meeting participants: ${_participants.value.size}")
        val newState = if (_participants.value.isEmpty()) State.IN_LOBBY else State.IN_MEETING

        if (newState == _currentState.value) {
            Timber.i("No change in state.")
            return
        }

        _currentState.value = newState

        if (_currentState.value == State.IN_MEETING) {
            Timber.i("In a meeting. Streaming local camera.")
            if (_currentCamera.value == Camera.THERMAL) {
                acsRepository.streamThermalVideoStream(activityContext, viewModelScope, callAgent)
            } else {
                acsRepository.streamClassicCameraVideoStream(activityContext, viewModelScope, callAgent, lifecycleOwner)
            }

            displayCurrentCamera()
        } else if (_currentState.value == State.IN_LOBBY) {
            Timber.i("In lobby. Stopping streaming.")
            callAgent?.stopOutgoingVideo(appContext.application)
            acsRepository.stopStreaming(appContext, viewModelScope)
            _videoStreamRendererViewState.value = null
        }
    }

    private fun triggerToastMessage(message: String) {
        CoroutineScope(mainDispatcher).launch {
            _toastMessage.emit(message)
        }
    }

    private fun displayCurrentCamera() {
        _currentCamera.value?.let { displayCamera(it) }
    }

    private fun displayCamera(camera: Camera) {
        if (cameraState.value == StreamingState.OFF || cameraState.value == StreamingState.PAUSED) {
            Timber.i("Camera is ${cameraState.value}. Not displaying camera.")
            return
        }

        CoroutineScope(mainDispatcher).launch {
            val frameLayout = if (camera == Camera.THERMAL) {
                acsRepository.displayThermalVideoStream(appContext, viewModelScope)
            } else {
                acsRepository.displayClassicCameraVideoStream(appContext)
            }

            _cameraState.value = StreamingState.LIVE
            if (currentVideoStreamer == null) {
                Timber.i("No screen sharing participant. Displaying local camera.")
                _videoStreamRendererViewState.value = frameLayout
            } else {
                Timber.i("Screen sharing participant. Displaying local camera in PIP.")
                _pipRendererViewState.value = frameLayout
            }
        }
    }

    companion object {
        const val MAX_PARTICIPANTS_TO_DISPLAY = 4

        val ZOOM_RANGE = Pair(1, 5)
    }
}

abstract class IMeetingViewModel : ViewModel() {
    abstract val participants: StateFlow<List<Participant>>
    abstract val meetingName: LiveData<String>
    abstract val currentCamera: LiveData<Camera>
    abstract val micState: LiveData<StreamingState>
    abstract val cameraState: LiveData<StreamingState>
    abstract val toastMessage: SharedFlow<String>
    abstract val isPipActive: LiveData<Boolean>
    abstract val isCameraCalibrating: LiveData<Boolean>
    abstract val isFreezeFrame: LiveData<Boolean>
    abstract val zoomLevel: LiveData<Int>
    abstract val isFlashOn: LiveData<Boolean>

    abstract val isCameraDisplayDisabled: LiveData<Boolean>
    abstract val isCameraDisplayPipDisabled: LiveData<Boolean>

    abstract suspend fun thermalCameraIsAvailable(): Boolean

    abstract fun switchToThermalCamera(activity: Activity)
    abstract fun switchToClassicCamera(activity: Activity, lifecycleOwner: LifecycleOwner)
    abstract fun setCameraState(activity: Activity, lifecycleOwner: LifecycleOwner, state: StreamingState)

    abstract fun muteMic(mute: Boolean)

    abstract fun canFreezeFrame(): Boolean
    abstract fun freezeFrame(freeze: Boolean)

    abstract fun canZoom(): Boolean
    abstract fun setZoom(zoom: Int): Boolean
    abstract fun zoomIn(): Boolean
    abstract fun zoomOut(): Boolean

    abstract fun canSetFlash(): Boolean
    abstract fun setFlash(on: Boolean)

    abstract fun hangUp()

    abstract fun onPause(activity: Activity, lifecycleOwner: LifecycleOwner)
    abstract fun onResume(activity: Activity, lifecycleOwner: LifecycleOwner)

    enum class State {
        LOADING,
        PERMISSIONS_REFUSED,
        NETWORK_ERROR,
        JOINING_MEETING,
        CALLING_PARTICIPANT,
        IN_TEAMS_LOBBY,
        IN_LOBBY,
        IN_MEETING,
        HANGING_UP,
        FINISHED
    }

    enum class Camera {
        CHANGING,
        CLASSIC,
        THERMAL
    }

    enum class StreamingState {
        CHANGING,
        LIVE,
        PAUSED,
        OFF
    }
}
