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