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
