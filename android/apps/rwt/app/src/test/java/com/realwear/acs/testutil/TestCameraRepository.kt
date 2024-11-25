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
package com.realwear.acs.testutil

import android.content.Context
import android.graphics.Bitmap
import androidx.lifecycle.LifecycleOwner
import com.realwear.acs.cameracapturer.repository.ICameraRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.concurrent.CompletableFuture

class TestCameraRepository(private val scope: CoroutineScope) : ICameraRepository {
    override val framesFlow: MutableSharedFlow<Bitmap> = MutableSharedFlow()

    private val _calibrationState = MutableStateFlow(false)
    override val calibrationState: StateFlow<Boolean> = _calibrationState

    override val isThermalCamera = true

    var isFreezeFrame = false

    var zoomLevel = -1

    var isFlashOn = false

    fun setCalibrationState(calibrationState: Boolean) {
        scope.launch {
            _calibrationState.emit(calibrationState)
        }
    }

    override fun start(scope: CoroutineScope, activityContext: Context): CompletableFuture<Boolean> {
        return CompletableFuture.completedFuture(true)
    }

    override fun startMainCamera(scope: CoroutineScope, lifecycleOwner: LifecycleOwner, activityContext: Context) {
        // Do nothing.
    }

    override fun freezeFrame(freeze: Boolean) {
        isFreezeFrame = freeze
    }

    override fun stop(context: Context): CompletableFuture<Boolean> {
        return CompletableFuture.completedFuture(true)
    }

    override fun setZoom(zoom: Int) {
        zoomLevel = zoom
    }

    override fun setFlash(on: Boolean) {
        isFlashOn = on
    }
}
