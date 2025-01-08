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

import android.content.Context
import android.graphics.Bitmap
import androidx.lifecycle.LifecycleOwner
import com.realwear.acs.modules.repository.ICameraRepository
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
