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
package com.realwear.acs.util

import android.app.Activity
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.realwear.acs.model.Participant
import com.realwear.acs.viewmodel.IMeetingViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow

object PreviewUtils {
    private fun createParticipant(id: String, isTalking: Boolean): Participant {
        return Participant(id, "Participant", id, isTalking)
    }

    fun previewMeetingViewModel(
        participants: Int = 3,
        enablePip: Boolean = false,
        disableCameraDisplay: Boolean = false,
        disableCameraDisplayPip: Boolean = false
    ): IMeetingViewModel {
        val participantList =
            (0 until participants).map { createParticipant((it + 97).toChar().toString(), it % 2 > 0) }

        return object : IMeetingViewModel() {
            override val participants: StateFlow<List<Participant>> = MutableStateFlow(participantList)
            override val meetingName: LiveData<String> = MutableLiveData("Meeting Name")
            override val currentCamera: LiveData<Camera> = MutableLiveData(Camera.CLASSIC)
            override val micState: LiveData<StreamingState> = MutableLiveData(StreamingState.LIVE)
            override val cameraState: LiveData<StreamingState> = MutableLiveData(StreamingState.LIVE)
            override val toastMessage: SharedFlow<String> = MutableStateFlow("")
            override val isPipActive: LiveData<Boolean> = MutableLiveData(enablePip)
            override val isCameraCalibrating: LiveData<Boolean> = MutableLiveData(true)
            override val isCameraDisplayDisabled: LiveData<Boolean> = MutableLiveData(disableCameraDisplay)
            override val isCameraDisplayPipDisabled: LiveData<Boolean> = MutableLiveData(disableCameraDisplayPip)
            override val isFreezeFrame: LiveData<Boolean> = MutableLiveData(false)
            override val zoomLevel: LiveData<Int> = MutableLiveData(1)
            override val isFlashOn = MutableLiveData(false)

            override suspend fun thermalCameraIsAvailable(): Boolean {
                return true
            }

            override fun switchToThermalCamera(activity: Activity) {
                // Not required for preview.
            }

            override fun switchToClassicCamera(activity: Activity, lifecycleOwner: LifecycleOwner) {
                // Not required for preview.
            }

            override fun setCameraState(activity: Activity, lifecycleOwner: LifecycleOwner, state: StreamingState) {
                // Not required for preview.
            }

            override fun muteMic(mute: Boolean) {
                // Not required for preview.
            }

            override fun hangUp() {
                // Not required for preview.
            }

            override fun onPause(activity: Activity, lifecycleOwner: LifecycleOwner) {
                // Not required for preview.
            }

            override fun onResume(activity: Activity, lifecycleOwner: LifecycleOwner) {
                // Not required for preview.
            }

            override fun canFreezeFrame(): Boolean {
                return true
            }

            override fun freezeFrame(freeze: Boolean) {
                // Not required for preview.
            }

            override fun canZoom(): Boolean {
                return true
            }

            override fun zoomIn(): Boolean {
                return true
            }

            override fun zoomOut(): Boolean {
                return true
            }

            override fun setZoom(zoom: Int): Boolean {
                return true
            }

            override fun canSetFlash(): Boolean {
                return true
            }

            override fun setFlash(on: Boolean) {
                // Not required for preview.
            }
        }
    }
}
