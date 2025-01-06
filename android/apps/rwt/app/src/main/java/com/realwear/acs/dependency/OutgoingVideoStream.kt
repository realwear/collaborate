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
package com.realwear.acs.dependency

import com.azure.android.communication.calling.RawOutgoingVideoStreamOptions
import com.azure.android.communication.calling.RawVideoFrame
import com.azure.android.communication.calling.VideoStreamFormat
import com.azure.android.communication.calling.VideoStreamState
import com.azure.android.communication.calling.VideoStreamStateChangedEvent
import com.azure.android.communication.calling.VirtualOutgoingVideoStream
import java9.util.concurrent.CompletableFuture
import javax.inject.Inject

interface IOutgoingVideoStream {
    val outgoingVideoStream: VirtualOutgoingVideoStream
    val format: VideoStreamFormat
    val state: VideoStreamState

    fun addOnStateChangedListener(function: (VideoStreamStateChangedEvent) -> Unit)
    fun removeOnStateChangedListener()
    fun sendRawVideoFrame(frame: RawVideoFrame): CompletableFuture<Void>
}

class OutgoingVideoStreamWrapper @Inject constructor(
    private val options: List<com.realwear.acs.model.VideoStreamFormat>
) : IOutgoingVideoStream {
    override val outgoingVideoStream: VirtualOutgoingVideoStream
    override val format: VideoStreamFormat
        get() = outgoingVideoStream.format
    override val state: VideoStreamState
        get() = outgoingVideoStream.state

    private var onStateChangedListener: ((VideoStreamStateChangedEvent) -> Unit)? = null

    init {
        val rawOutgoingVideoStreamOptions = RawOutgoingVideoStreamOptions().apply {
            formats = options.map { it.toAcsVideoStreamFormat() }
        }

        outgoingVideoStream = VirtualOutgoingVideoStream(rawOutgoingVideoStreamOptions)
    }

    override fun addOnStateChangedListener(function: (VideoStreamStateChangedEvent) -> Unit) {
        removeOnStateChangedListener()

        onStateChangedListener = function
        outgoingVideoStream.addOnStateChangedListener(function)
    }

    override fun removeOnStateChangedListener() {
        onStateChangedListener?.let {
            outgoingVideoStream.removeOnStateChangedListener(onStateChangedListener)
        }
        onStateChangedListener = null
    }

    override fun sendRawVideoFrame(frame: RawVideoFrame): CompletableFuture<Void> {
        return outgoingVideoStream.sendRawVideoFrame(frame)
    }
}