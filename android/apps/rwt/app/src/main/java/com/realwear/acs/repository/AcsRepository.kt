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
import androidx.lifecycle.LifecycleOwner
import com.azure.android.communication.calling.CallAgentOptions
import com.azure.android.communication.calling.CallVideoStream
import com.azure.android.communication.calling.LocalVideoStream
import com.azure.android.communication.calling.RemoteVideoStream
import com.azure.android.communication.calling.StreamDirection
import com.azure.android.communication.calling.VideoStreamRenderer
import com.azure.android.communication.calling.VideoStreamRendererView
import com.azure.android.communication.calling.VideoStreamState
import com.azure.android.communication.calling.VideoStreamStateChangedEvent
import com.azure.android.communication.common.CommunicationTokenCredential
import com.realwear.acs.cameracapturer.repository.ICameraRepository
import com.realwear.acs.dependency.CallAgentWrapper
import com.realwear.acs.dependency.FrameLayoutWrapper
import com.realwear.acs.dependency.IApplication
import com.realwear.acs.dependency.ICall
import com.realwear.acs.dependency.ICallAgent
import com.realwear.acs.dependency.ICallClient
import com.realwear.acs.dependency.IEisManager
import com.realwear.acs.dependency.IFrameLayout
import com.realwear.acs.dependency.IOutgoingVideoStream
import com.realwear.acs.dependency.TeamsMeetingLinkLocatorWrapper
import com.realwear.acs.util.EisUtils
import com.realwear.acs.util.thermal.VideoFrameSender
import com.realwear.acs.view.BitmapFrameLayout
import dagger.hilt.android.qualifiers.ActivityContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import java.util.concurrent.CompletableFuture
import javax.inject.Inject

interface IAcsRepository {
    val calibrationState: SharedFlow<Boolean>

    fun createCallAgent(
        appContext: IApplication,
        callClient: ICallClient,
        userToken: String,
        participantName: String
    ): ICallAgent

    fun joinCall(
        appContext: IApplication,
        callAgent: ICallAgent?,
        meetingLink: String?
    ): ICall?

    fun streamClassicCameraVideoStream(
        @ActivityContext activityContext: Context,
        scope: CoroutineScope,
        callAgent: ICallAgent?,
        lifecycleOwner: LifecycleOwner
    )

    fun displayClassicCameraVideoStream(appContext: IApplication): IFrameLayout?

    fun streamThermalVideoStream(
        @ActivityContext activityContext: Context,
        scope: CoroutineScope,
        callAgent: ICallAgent?
    ): CompletableFuture<Boolean>

    fun displayThermalVideoStream(appContext: IApplication, scope: CoroutineScope): IFrameLayout?

    fun displayRemoteVideoStream(
        appContext: IApplication,
        callVideoStream: CallVideoStream?
    ): IFrameLayout?

    fun stopStreaming(appContext: IApplication, scope: CoroutineScope): CompletableFuture<Boolean>

    fun cleanUp(appContext: IApplication, scope: CoroutineScope)

    fun freezeFrame(freeze: Boolean)

    fun setZoom(zoom: Int)
    fun setFlash(on: Boolean)
}

class AcsRepository @Inject constructor(
    private val mainCameraRepository: ICameraRepository,
    private val thermalRepository: ICameraRepository,
    private val outgoingMainCameraVideoStream: IOutgoingVideoStream,
    private val outgoingThermalVideoStream: IOutgoingVideoStream,
    private val bitmapFrameLayout: BitmapFrameLayout?,
    private val eisManager: IEisManager
) : IAcsRepository {
    private var videoStreamRenderer: VideoStreamRenderer? = null
    private var thermalCalibrationJob: Job? = null

    private val _calibrationState = MutableSharedFlow<Boolean>()
    override val calibrationState = _calibrationState.asSharedFlow()

    var currentRenderer = CurrentRenderer.NONE
        private set

    override fun createCallAgent(
        appContext: IApplication,
        callClient: ICallClient,
        userToken: String,
        participantName: String
    ): ICallAgent {
        val credential = CommunicationTokenCredential(userToken)
        val callAgentOptions = CallAgentOptions().apply {
            displayName = participantName
        }
        return CallAgentWrapper(
            callClient.createCallAgent(appContext.application, credential, callAgentOptions),
            TeamsMeetingLinkLocatorWrapper()
        )
    }

    override fun joinCall(
        appContext: IApplication,
        callAgent: ICallAgent?,
        meetingLink: String?
    ): ICall? {
        return meetingLink?.let { link ->
            callAgent?.join(appContext.application, link)
        } ?: run {
            Timber.e("Failed to join call due to lack of meeting link.")
            null
        }
    }

    override fun displayClassicCameraVideoStream(appContext: IApplication): IFrameLayout? {
        Timber.i("Displaying main camera video stream.")
        if (currentRenderer == CurrentRenderer.CLASSIC_CAMERA) {
            Timber.w("Main camera video stream is already being displayed.")
        }

        currentRenderer = CurrentRenderer.CLASSIC_CAMERA

        return FrameLayoutWrapper(
            bitmapFrameLayout?.apply {
                setCameraRepository(mainCameraRepository)
            }
        )
    }

    override fun streamClassicCameraVideoStream(
        @ActivityContext activityContext: Context,
        scope: CoroutineScope,
        callAgent: ICallAgent?,
        lifecycleOwner: LifecycleOwner
    ) {
        Timber.i("Streaming main camera")

        eisManager.setImageStabilizationMode(activityContext, EisUtils.STABILIZATION_ON)

        mainCameraRepository.startMainCamera(scope, lifecycleOwner, activityContext)

        var videoFrameSender = VideoFrameSender(outgoingMainCameraVideoStream, mainCameraRepository)

        outgoingMainCameraVideoStream.addOnStateChangedListener { args: VideoStreamStateChangedEvent ->
            val callVideoStream = args.stream

            when (callVideoStream.state) {
                VideoStreamState.AVAILABLE -> Timber.i("Raw main video stream is available.")
                VideoStreamState.STARTED -> {
                    Timber.i("Raw main video stream started.")
                    videoFrameSender.start(activityContext)
                }

                VideoStreamState.STOPPED -> {
                    Timber.i("Raw main video stream stopped.")
                    videoFrameSender.stop()
                }

                else -> {
                    // Do Nothing
                }
            }
        }

        callAgent?.switchOutgoingVideoFeed(activityContext, outgoingMainCameraVideoStream)
    }

    override fun displayThermalVideoStream(appContext: IApplication, scope: CoroutineScope): IFrameLayout? {
        Timber.i("Displaying thermal camera video stream.")
        if (currentRenderer == CurrentRenderer.THERMAL) {
            Timber.w("Thermal camera video stream is already being displayed.")
        }

        currentRenderer = CurrentRenderer.THERMAL

        return FrameLayoutWrapper(
            bitmapFrameLayout?.apply {
                setCameraRepository(thermalRepository)
            }
        )
    }

    override fun streamThermalVideoStream(
        @ActivityContext activityContext: Context,
        scope: CoroutineScope,
        callAgent: ICallAgent?
    ): CompletableFuture<Boolean> {
        Timber.i("Streaming thermal camera")

        eisManager.setImageStabilizationMode(activityContext, EisUtils.STABILIZATION_OFF)

        val future = startThermalCamera(activityContext, scope)

        var videoFrameSender = VideoFrameSender(outgoingThermalVideoStream, thermalRepository)

        outgoingThermalVideoStream.addOnStateChangedListener { args: VideoStreamStateChangedEvent ->
            val callVideoStream = args.stream

            when (callVideoStream.state) {
                VideoStreamState.AVAILABLE -> Timber.i("Raw thermal video stream is available.")
                VideoStreamState.STARTED -> {
                    Timber.i("Raw thermal video stream started.")
                    videoFrameSender.start(activityContext)
                }

                VideoStreamState.STOPPED -> {
                    Timber.i("Raw thermal video stream stopped.")
                    videoFrameSender.stop()
                }

                else -> {
                    // Do Nothing
                }
            }
        }

        callAgent?.switchOutgoingVideoFeed(activityContext, outgoingThermalVideoStream)

        return future
    }

    private fun stopVideoStreams(appContext: IApplication, scope: CoroutineScope): CompletableFuture<Boolean> {
        val future = CompletableFuture<Boolean>()

        outgoingThermalVideoStream.removeOnStateChangedListener()

        scope.launch(Dispatchers.IO) {
            mainCameraRepository.stop(appContext.application).get()
            stopThermalCamera(appContext, this).get()
            future.complete(true)
        }

        return future
    }

    override fun displayRemoteVideoStream(
        appContext: IApplication,
        callVideoStream: CallVideoStream?
    ): IFrameLayout? {
        if (currentRenderer == CurrentRenderer.REMOTE) {
            Timber.w("Remote video stream is already being displayed.")
        }

        stopDisplayingRenderer()

        val videoStreamRendererView = callVideoStream?.let {
            setupVideoStreamRenderer(appContext, callVideoStream)
        }

        currentRenderer = CurrentRenderer.REMOTE

        return videoStreamRendererView?.let {
            FrameLayoutWrapper(videoStreamRendererView)
        }
    }

    private fun stopDisplayingRenderer() {
        videoStreamRenderer?.dispose()
        videoStreamRenderer = null

        currentRenderer = CurrentRenderer.NONE
    }

    private fun setupVideoStreamRenderer(
        appContext: IApplication,
        videoStream: CallVideoStream
    ): VideoStreamRendererView? {
        stopDisplayingRenderer()

        if (videoStream.direction == StreamDirection.OUTGOING) {
            Timber.i("Setting up local video stream renderer.")
            videoStreamRenderer = VideoStreamRenderer(videoStream as LocalVideoStream, appContext.application)
        } else {
            Timber.i("Setting up remote video stream renderer.")
            videoStreamRenderer = VideoStreamRenderer(videoStream as RemoteVideoStream, appContext.application)
        }

        Timber.i("Updating video stream renderer view.")
        return videoStreamRenderer?.createView()
    }

    override fun stopStreaming(appContext: IApplication, scope: CoroutineScope): CompletableFuture<Boolean> {
        stopDisplayingRenderer()
        return stopVideoStreams(appContext, scope)
    }

    override fun cleanUp(appContext: IApplication, scope: CoroutineScope) {
        mainCameraRepository.stop(appContext.application)
        stopThermalCamera(appContext, scope)

        stopDisplayingRenderer()
    }

    private fun startThermalCamera(activityContext: Context, scope: CoroutineScope): CompletableFuture<Boolean> {
        thermalCalibrationJob = scope.launch {
            thermalRepository.calibrationState.collect { calibrating ->
                _calibrationState.emit(calibrating)
            }
        }

        return thermalRepository.start(scope, activityContext)
    }

    private fun stopThermalCamera(appContext: IApplication, scope: CoroutineScope): CompletableFuture<Boolean> {
        scope.launch {
            _calibrationState.emit(false)

            thermalCalibrationJob?.cancel()
            thermalCalibrationJob?.join()
            thermalCalibrationJob = null
        }

        return thermalRepository.stop(appContext.application)
    }

    override fun freezeFrame(freeze: Boolean) {
        mainCameraRepository.freezeFrame(freeze)
        thermalRepository.freezeFrame(freeze)
    }

    override fun setZoom(zoom: Int) {
        mainCameraRepository.setZoom(zoom)
    }

    override fun setFlash(on: Boolean) {
        mainCameraRepository.setFlash(on)
    }

    companion object {
        enum class CurrentRenderer {
            NONE,
            CLASSIC_CAMERA,
            THERMAL,
            REMOTE
        }
    }
}
