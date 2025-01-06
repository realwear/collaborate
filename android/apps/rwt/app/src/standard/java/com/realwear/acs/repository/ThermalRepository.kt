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
package com.realwear.acs.repository

import android.content.Context
import android.graphics.Bitmap
import androidx.lifecycle.LifecycleOwner
import com.realwear.acs.cameracapturer.repository.ICameraRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import java.util.concurrent.CompletableFuture

class ThermalRepository : ICameraRepository {
    override val isThermalCamera = true

    override val framesFlow: SharedFlow<Bitmap>
        get() = throw UnsupportedOperationException("Thermal camera not supported with standard build.")

    override val calibrationState: StateFlow<Boolean>
        get() = throw UnsupportedOperationException("Thermal camera not supported with standard build.")

    override fun start(scope: CoroutineScope, activityContext: Context): CompletableFuture<Boolean> {
        throw UnsupportedOperationException("Thermal camera not supported with standard build.")
    }

    override fun startMainCamera(scope: CoroutineScope, lifecycleOwner: LifecycleOwner, activityContext: Context) {
        throw UnsupportedOperationException("Main camera not supported.")
    }

    override fun stop(context: Context): CompletableFuture<Boolean> {
        return CompletableFuture.completedFuture(true)
    }

    override fun freezeFrame(freeze: Boolean) {
        throw UnsupportedOperationException("Thermal camera not supported with standard build.")
    }

    override fun setZoom(zoom: Int) {
        throw UnsupportedOperationException("Thermal camera not supported with standard build.")
    }

    override fun setFlash(on: Boolean) {
        throw UnsupportedOperationException("Thermal camera not supported with standard build.")
    }

    companion object {
        const val FPS = 15
    }
}
