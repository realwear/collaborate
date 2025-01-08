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
import android.graphics.Matrix
import android.hardware.camera2.CaptureRequest
import android.os.Build
import android.util.Range
import android.util.Size
import android.view.OrientationEventListener
import android.view.Surface
import android.view.WindowManager
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2Interop
import androidx.camera.camera2.interop.ExperimentalCamera2Interop
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.realwear.acs.modules.repository.ICameraRepository
import dagger.hilt.android.qualifiers.ActivityContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import java.util.concurrent.CompletableFuture
import javax.inject.Inject

class MainCameraRepository @Inject constructor(
    private val context: Context,
    private val windowManager: WindowManager
) : ICameraRepository {
    private val _framesFlow = MutableSharedFlow<Bitmap>()
    override val framesFlow = _framesFlow.asSharedFlow()

    override val calibrationState = MutableStateFlow<Boolean>(false)

    override val isThermalCamera = false

    private var cameraProvider: ProcessCameraProvider? = null
    private var imageAnalyzer: ImageAnalysis? = null
    private var camera: Camera? = null

    private var orientationListener: OrientationEventListener? = null

    private var isFreezeFrame = false

    override fun start(scope: CoroutineScope, @ActivityContext activityContext: Context): CompletableFuture<Boolean> {
        throw UnsupportedOperationException("Thermal camera not supported in MainCameraRepository")
    }

    @OptIn(ExperimentalCamera2Interop::class)
    override fun startMainCamera(scope: CoroutineScope, lifecycleOwner: LifecycleOwner, activityContext: Context) {
        Timber.i("Starting main camera")

        isFreezeFrame = false

        val resolutionSelector = ResolutionSelector.Builder().setResolutionStrategy(
            ResolutionStrategy(Size(1280, 720), ResolutionStrategy.FALLBACK_RULE_NONE)
        ).build()

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()

            val imageAnalyzerBuilder = ImageAnalysis.Builder()
                .setResolutionSelector(resolutionSelector)
                .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)

            val camera2Interop = Camera2Interop.Extender(imageAnalyzerBuilder)
            camera2Interop.setCaptureRequestOption(
                CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE,
                Range(FPS, FPS)
            )

            imageAnalyzer = imageAnalyzerBuilder.build()
                .also {
                    it.setAnalyzer(ContextCompat.getMainExecutor(context)) { image ->
                        image.use {
                            if (!isFreezeFrame) {
                                val bitmap = imageProxyToBitmap(image)
                                scope.launch {
                                    _framesFlow.emit(bitmap)
                                }
                            }
                        }
                    }

                    orientationListener = createOrientationListener(windowManager, it, activityContext)
                    orientationListener?.enable()
                }

            // Select back camera as a default
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider?.unbindAll()
                camera = cameraProvider?.bindToLifecycle(lifecycleOwner, cameraSelector, imageAnalyzer)
            } catch (e: IllegalStateException) {
                Timber.e("Use case binding failed", e)
            } catch (e: IllegalArgumentException) {
                Timber.e("Use case binding failed", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    @OptIn(ExperimentalCamera2Interop::class)
    override fun setZoom(zoom: Int) {
        val zoomLevel = when (zoom) {
            1 -> 0f
            2 -> 0.45f
            3 -> 0.77f
            4 -> 0.9f
            5 -> 1f
            else -> 0f
        }

        camera?.cameraControl?.setLinearZoom(zoomLevel)
    }

    override fun setFlash(on: Boolean) {
        camera?.cameraControl?.enableTorch(on)
    }

    private fun imageProxyToBitmap(image: ImageProxy): Bitmap {
        val plane = image.planes[0]

        val buffer = plane.buffer
        buffer.rewind()

        val pixelStride = plane.pixelStride
        val rowStride = plane.rowStride
        val rowPadding = rowStride - pixelStride * image.width

        val bitmap = Bitmap.createBitmap(image.width + rowPadding / pixelStride, image.height, Bitmap.Config.ARGB_8888)
        bitmap.copyPixelsFromBuffer(buffer)

        val matrix = Matrix().apply {
            postRotate(image.imageInfo.rotationDegrees.toFloat())
        }

        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }

    override fun stop(context: Context): CompletableFuture<Boolean> {
        Timber.i("Stopping main camera")

        val future = CompletableFuture<Boolean>()

        CoroutineScope(Dispatchers.Main).launch {
            Timber.i("Clearing image analyzer")
            imageAnalyzer?.clearAnalyzer()
            imageAnalyzer = null

            Timber.i("Unbinding from camera provider")
            cameraProvider?.unbindAll()
            cameraProvider = null

            Timber.i("Stopping orientation listener")
            orientationListener?.disable()
            orientationListener = null

            Timber.i("Stop finished")
            future.complete(true)
        }

        return future
    }

    private fun createOrientationListener(
        windowManager: WindowManager,
        imageAnalysis: ImageAnalysis,
        @ActivityContext activityContext: Context
    ): OrientationEventListener {
        return object : OrientationEventListener(context) {
            override fun onOrientationChanged(orientation: Int) {
                val rotation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    activityContext.display?.rotation
                } else {
                    //
                    // Context.getDisplay isn't available in API 29 (Android 10).
                    // HMT-1 is currently running Android 10.
                    //
                    @Suppress("DEPRECATION")
                    windowManager.defaultDisplay.rotation
                }

                val adjustedRotation = when (rotation) {
                    Surface.ROTATION_0 -> Surface.ROTATION_0
                    Surface.ROTATION_90 -> Surface.ROTATION_90
                    Surface.ROTATION_180 -> Surface.ROTATION_180
                    Surface.ROTATION_270 -> Surface.ROTATION_270
                    else -> {
                        Timber.e("Unknown rotation: $rotation")
                        return
                    }
                }

                if (imageAnalysis.targetRotation != adjustedRotation) {
                    Timber.i("Setting target orientation to $adjustedRotation")
                    imageAnalysis.targetRotation = adjustedRotation
                }
            }
        }
    }

    override fun freezeFrame(freeze: Boolean) {
        isFreezeFrame = freeze
    }

    companion object {
        const val FPS = 15
    }
}
