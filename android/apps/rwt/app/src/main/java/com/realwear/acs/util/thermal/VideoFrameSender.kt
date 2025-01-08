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
package com.realwear.acs.util.thermal

import android.content.Context
import android.graphics.Bitmap
import androidx.core.graphics.drawable.toBitmap
import com.azure.android.communication.calling.RawVideoFrame
import com.azure.android.communication.calling.RawVideoFrameBuffer
import com.azure.android.communication.calling.VideoStreamState
import com.realwear.acs.R
import com.realwear.acs.modules.repository.ICameraRepository
import com.realwear.acs.dependency.IOutgoingVideoStream
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import timber.log.Timber
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.LinkedList
import java.util.Queue
import java.util.concurrent.ExecutionException
import java.util.concurrent.atomic.AtomicReference
import kotlin.system.measureTimeMillis

class VideoFrameSender(
    private val rawOutgoingVideoStream: IOutgoingVideoStream,
    private val cameraRepository: ICameraRepository
) {
    private var frameReceiverIteratorJob: Job? = null
    private var frameSenderIteratorJob: Job? = null
    private val lastFrame = AtomicReference<RawVideoFrame?>(null)

    private val bufferPool: MutableMap<Int, Queue<ByteBuffer>> = mutableMapOf()

    fun start(context: Context) {
        if (cameraRepository.isThermalCamera) {
            sendLoadingFrame(context)
        }

        frameReceiverIteratorJob = CoroutineScope(Dispatchers.Default).launch {
            cameraRepository.framesFlow.collect { bitmap ->
                lastFrame.set(convertBitmapToRawVideoFrame(bitmap))
            }
        }

        frameSenderIteratorJob = CoroutineScope(Dispatchers.Default).launch {
            val delayTime = 1000 / rawOutgoingVideoStream.format.framesPerSecond.toLong()
            while (isActive) {
                val processingTime = measureTimeMillis {
                    lastFrame.get()?.let { frame ->
                        if (rawOutgoingVideoStream.state == VideoStreamState.STARTED) {
                            try {
                                rawOutgoingVideoStream.sendRawVideoFrame(frame).get()
                            } catch (e: ExecutionException) {
                                if (!isActive) {
                                    Timber.i("Frame sending cancelled")
                                } else {
                                    Timber.e("Frame sending failed")
                                }
                            }
                        } else if (rawOutgoingVideoStream.state == VideoStreamState.STOPPED) {
                            Timber.w("Cannot send frame as stream has stopped")
                            cancel()
                        } else {
                            Timber.w("Cannot send frame due to unexpected state: ${rawOutgoingVideoStream.state}")
                        }
                    }
                }
                val remainingTime = delayTime - processingTime
                if (remainingTime > 0) delay(delayTime - processingTime)
            }
        }
    }

    private fun sendLoadingFrame(context: Context) {
        Timber.i("Creating loading frame")
        context.getDrawable(R.drawable.thermal_loading)?.let { drawable ->
            drawable.toBitmap(1280, 720).let { bitmap ->
                Timber.i("Sending loading frame")
                lastFrame.set(convertBitmapToRawVideoFrame(bitmap))
            }
        }
    }

    private fun convertBitmapToRawVideoFrame(bitmap: Bitmap): RawVideoFrame {
        val rgbaCapacity = bitmap.width * bitmap.height * RGBA_CHANNELS

        val byteBuffer = bufferPool.getOrPut(rgbaCapacity) { LinkedList() }.poll()
            ?: ByteBuffer.allocateDirect(rgbaCapacity).order(ByteOrder.nativeOrder())
        byteBuffer.clear()

        bitmap.copyPixelsToBuffer(byteBuffer)
        byteBuffer.rewind()

        val videoFrameBuffer = RawVideoFrameBuffer()
        videoFrameBuffer.setBuffers(listOf(byteBuffer))
        videoFrameBuffer.setStreamFormat(rawOutgoingVideoStream.format)

        bufferPool[rgbaCapacity]?.offer(byteBuffer)

        return videoFrameBuffer
    }

    fun stop() {
        frameReceiverIteratorJob?.cancel()
        frameReceiverIteratorJob = null

        frameSenderIteratorJob?.cancel()
        frameSenderIteratorJob = null

        bufferPool.clear()
    }

    companion object {
        const val RGBA_CHANNELS = 4
    }
}