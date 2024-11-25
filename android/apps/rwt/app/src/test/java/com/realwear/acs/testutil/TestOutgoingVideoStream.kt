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
package com.realwear.acs.testutil

import com.azure.android.communication.calling.RawVideoFrame
import com.azure.android.communication.calling.VideoStreamFormat
import com.azure.android.communication.calling.VideoStreamState
import com.azure.android.communication.calling.VideoStreamStateChangedEvent
import com.azure.android.communication.calling.VirtualOutgoingVideoStream
import com.realwear.acs.dependency.IOutgoingVideoStream
import java9.util.concurrent.CompletableFuture

class TestOutgoingVideoStream : IOutgoingVideoStream {
    private var stateChangedListener: ((VideoStreamStateChangedEvent) -> Unit)? = null

    override val outgoingVideoStream: VirtualOutgoingVideoStream
        get() = TODO("Not yet implemented")

    override val format: VideoStreamFormat
        get() = TODO("Not yet implemented")

    override val state: VideoStreamState
        get() = TODO("Not yet implemented")

    override fun addOnStateChangedListener(function: (VideoStreamStateChangedEvent) -> Unit) {
        stateChangedListener = function
    }

    override fun removeOnStateChangedListener() {
        stateChangedListener = null
    }

    override fun sendRawVideoFrame(frame: RawVideoFrame): CompletableFuture<Void> {
        TODO("Not yet implemented")
    }
}
