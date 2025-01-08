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
package com.realwear.acs.modules.repository

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
