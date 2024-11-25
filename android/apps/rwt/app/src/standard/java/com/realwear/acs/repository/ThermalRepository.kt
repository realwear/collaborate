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
