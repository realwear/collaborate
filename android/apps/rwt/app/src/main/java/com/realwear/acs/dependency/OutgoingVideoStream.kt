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