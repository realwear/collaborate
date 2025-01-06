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
package com.realwear.acs.testutil

import android.app.Activity
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.realwear.acs.model.Participant
import com.realwear.acs.viewmodel.IMeetingViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow

class TestMeetingViewModel : IMeetingViewModel() {
    var callHasBeenHungUp = false
    var thermalCameraIsAvailable = true

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

    private val _isCameraCalibrating = MutableLiveData(false)
    override val isCameraCalibrating: LiveData<Boolean> = _isCameraCalibrating

    private val _isCameraDisplayDisabled = MutableLiveData(false)
    override val isCameraDisplayDisabled: LiveData<Boolean> = _isCameraDisplayDisabled

    private val _isCameraDisplayPipDisabled = MutableLiveData(false)
    override val isCameraDisplayPipDisabled: LiveData<Boolean> = _isCameraDisplayPipDisabled

    private val _isFreezeFrame = MutableLiveData(false)
    override val isFreezeFrame: LiveData<Boolean> = _isFreezeFrame

    private val _zoomLevel = MutableLiveData(1)
    override val zoomLevel: LiveData<Int> = _zoomLevel

    private val _isFlashOn = MutableLiveData(false)
    override val isFlashOn = _isFlashOn

    private val _participants = MutableStateFlow(
        listOf(
            createParticipant("a"),
            createParticipant("b"),
            createParticipant("c"),
        )
    )

    override val participants: StateFlow<List<Participant>> get() = _participants

    private val _meetingName = MutableLiveData(MEETING_TITLE)
    override val meetingName: LiveData<String> get() = _meetingName

    override suspend fun thermalCameraIsAvailable(): Boolean {
        return thermalCameraIsAvailable
    }

    override fun switchToThermalCamera(activity: Activity) {
        _currentCamera.value = Camera.THERMAL
    }

    override fun switchToClassicCamera(activity: Activity, lifecycleOwner: LifecycleOwner) {
        _currentCamera.value = Camera.CLASSIC
    }

    override fun setCameraState(activity: Activity, lifecycleOwner: LifecycleOwner, state: StreamingState) {
        _cameraState.value = state
    }

    override fun muteMic(mute: Boolean) {
        _micState.value = if (mute) StreamingState.OFF else StreamingState.LIVE
    }

    override fun hangUp() {
        callHasBeenHungUp = true
    }

    override fun onPause(activity: Activity, lifecycleOwner: LifecycleOwner) {
        // Not required for testing.
    }

    override fun onResume(activity: Activity, lifecycleOwner: LifecycleOwner) {
        // Not required for testing.
    }

    override fun canFreezeFrame(): Boolean {
        return true
    }

    override fun freezeFrame(freeze: Boolean) {
        _isFreezeFrame.value = freeze
    }

    override fun canZoom(): Boolean {
        return true
    }

    override fun setZoom(zoom: Int): Boolean {
        _zoomLevel.value = zoom
        return true
    }

    override fun zoomIn(): Boolean {
        return true
    }

    override fun zoomOut(): Boolean {
        return true
    }

    override fun canSetFlash(): Boolean {
        return true
    }

    override fun setFlash(on: Boolean) {
        _isFlashOn.value = on
    }

    private fun createParticipant(id: String): Participant {
        return Participant(id, "Participant", "$id", false)
    }

    fun addParticipant(id: String) {
        _participants.value = _participants.value + createParticipant(id)
    }

    fun removeParticipant(id: String) {
        _participants.value = _participants.value.filter { it.identifier != id }
    }

    fun showPip() {
        _isPipActive.value = true
    }

    fun startCalibration(start: Boolean) {
        _isCameraCalibrating.value = start
    }

    fun isParticipantTalking(id: String, isTalking: Boolean) {
        _participants.value = _participants.value.map {
            if (it.identifier == id) {
                it.copy(isTalking = isTalking)
            } else {
                it
            }
        }
    }

    fun disableCameraDisplay(disable: Boolean) {
        _isCameraDisplayDisabled.value = disable
    }

    fun disableCameraDisplayPip(disable: Boolean) {
        _isCameraDisplayPipDisabled.value = disable
    }

    companion object {
        const val MEETING_TITLE = "Test Meeting"

        const val PARTICIPANT_A_CONTENT_DESCRIPTION = "Participant a.   "
        const val PARTICIPANT_A_ACTIVE_CONTENT_DESCRIPTION = "Participant a.   Active"
        const val PARTICIPANT_B_CONTENT_DESCRIPTION = "Participant b.   "
        const val PARTICIPANT_C_CONTENT_DESCRIPTION = "Participant c.   "
        const val PARTICIPANT_C_ACTIVE_CONTENT_DESCRIPTION = "Participant c.   Active"
        const val PARTICIPANT_D_CONTENT_DESCRIPTION = "Participant d.   "
        const val PARTICIPANT_E_CONTENT_DESCRIPTION = "Participant e.   "
        const val PARTICIPANT_OVERFLOW_CONTENT_DESCRIPTION = "+ 1 Avatar More"
    }
}
