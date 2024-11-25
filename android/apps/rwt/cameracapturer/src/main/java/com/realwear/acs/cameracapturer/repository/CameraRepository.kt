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
package com.realwear.acs.cameracapturer.repository

import android.content.Context
import android.graphics.Bitmap
import androidx.lifecycle.LifecycleOwner
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import java.util.concurrent.CompletableFuture

interface ICameraRepository {
    fun start(scope: CoroutineScope, activityContext: Context): CompletableFuture<Boolean>

    fun startMainCamera(
        scope: CoroutineScope,
        lifecycleOwner: LifecycleOwner,
        activityContext: Context
    )

    fun stop(context: Context): CompletableFuture<Boolean>

    fun freezeFrame(freeze: Boolean)

    fun setZoom(zoom: Int)

    fun setFlash(on: Boolean)

    val framesFlow: SharedFlow<Bitmap>
    val calibrationState: StateFlow<Boolean>
    val isThermalCamera: Boolean
}
