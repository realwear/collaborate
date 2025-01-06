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
import androidx.lifecycle.LifecycleOwner
import com.azure.android.communication.calling.CallVideoStream
import com.realwear.acs.dependency.IApplication
import com.realwear.acs.dependency.ICall
import com.realwear.acs.dependency.ICallAgent
import com.realwear.acs.dependency.ICallClient
import com.realwear.acs.dependency.IFrameLayout
import com.realwear.acs.repository.IAcsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import java.util.concurrent.CompletableFuture

class TestAcsRepository(private val testCallAgent: TestCallAgent) : IAcsRepository {
    val videoStreamRequests = mutableListOf<VideoStreamRequest>()

    var hasCleanupBeenCalled = false
    var hasJoinCallBeenCalled = false

    var hasStreamClassicCameraVideoStreamBeenCalled = false
    var hasDisplayClassicCameraVideoStreamBeenCalled = false
    var hasStreamThermalVideoStreamBeenCalled = false
    var hasDisplayThermalVideoStreamBeenCalled = false
    var hasStopStreamingBeenCalled = false
    var isFreezeFrame = false

    private var testVideoStreamRendererView: IFrameLayout? = null

    override val calibrationState: SharedFlow<Boolean> = MutableStateFlow(false)

    fun setTestVideoStreamRendererView(view: IFrameLayout?) {
        testVideoStreamRendererView = view
    }

    override fun createCallAgent(
        appContext: IApplication,
        callClient: ICallClient,
        userToken: String,
        participantName: String
    ): ICallAgent {
        return testCallAgent
    }

    override fun joinCall(
        appContext: IApplication,
        callAgent: ICallAgent?,
        meetingLink: String?
    ): ICall? {
        hasJoinCallBeenCalled = true

        return meetingLink?.let { link ->
            testCallAgent.join(appContext.application, link)
        }
    }

    override fun streamClassicCameraVideoStream(
        activityContext: Context,
        scope: CoroutineScope,
        callAgent: ICallAgent?,
        lifecycleOwner: LifecycleOwner
    ) {
        hasStreamClassicCameraVideoStreamBeenCalled = true
    }

    override fun displayClassicCameraVideoStream(appContext: IApplication): IFrameLayout? {
        hasDisplayClassicCameraVideoStreamBeenCalled = true

        videoStreamRequests.add(VideoStreamRequest.CLASSIC_CAMERA)
        return testVideoStreamRendererView
    }

    override fun streamThermalVideoStream(
        activityContext: Context,
        scope: CoroutineScope,
        callAgent: ICallAgent?
    ): CompletableFuture<Boolean> {
        hasStreamThermalVideoStreamBeenCalled = true
        return CompletableFuture.completedFuture(true)
    }

    override fun displayThermalVideoStream(appContext: IApplication, scope: CoroutineScope): IFrameLayout? {
        hasDisplayThermalVideoStreamBeenCalled = true

        videoStreamRequests.add(VideoStreamRequest.THERMAL)
        return testVideoStreamRendererView
    }

    override fun displayRemoteVideoStream(
        appContext: IApplication,
        callVideoStream: CallVideoStream?
    ): IFrameLayout? {
        videoStreamRequests.add(VideoStreamRequest.REMOTE)
        return null
    }

    override fun stopStreaming(appContext: IApplication, scope: CoroutineScope): CompletableFuture<Boolean> {
        hasStopStreamingBeenCalled = true
        return CompletableFuture.completedFuture(true)
    }

    override fun freezeFrame(freeze: Boolean) {
        isFreezeFrame = freeze
    }

    override fun cleanUp(appContext: IApplication, scope: CoroutineScope) {
        hasCleanupBeenCalled = true
    }

    override fun setZoom(zoom: Int) {
        // Do nothing.
    }

    override fun setFlash(on: Boolean) {
        // Do nothing.
    }

    enum class VideoStreamRequest {
        CLASSIC_CAMERA,
        THERMAL,
        REMOTE
    }
}
