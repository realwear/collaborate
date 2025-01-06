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
package com.realwear.acs.model

import com.azure.android.communication.calling.VideoStreamFormat
import com.azure.android.communication.calling.VideoStreamPixelFormat
import com.azure.android.communication.calling.VideoStreamResolution

data class VideoStreamFormat(
    val resolution: Resolution,
    val pixelFormat: PixelFormat,
    val framesPerSecond: Float,
    val stride1: Int
) {
    fun toAcsVideoStreamFormat(): VideoStreamFormat {
        val localResolution = when (resolution) {
            Resolution.P720 -> VideoStreamResolution.P720
        }
        val localPixelFormat = when (pixelFormat) {
            PixelFormat.RGBA -> VideoStreamPixelFormat.RGBA
        }
        val localFramesPerSecond = framesPerSecond
        val localStride1 = stride1

        return VideoStreamFormat().apply {
            this.resolution = localResolution
            this.pixelFormat = localPixelFormat
            this.framesPerSecond = localFramesPerSecond
            this.stride1 = localStride1
        }
    }

    companion object {
        enum class Resolution {
            P720
        }

        enum class PixelFormat {
            RGBA
        }
    }
}