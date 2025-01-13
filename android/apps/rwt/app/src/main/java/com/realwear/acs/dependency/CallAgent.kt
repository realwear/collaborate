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

import android.app.Application
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import com.azure.android.communication.calling.AudioStreamChannelMode
import com.azure.android.communication.calling.AudioStreamFormat
import com.azure.android.communication.calling.AudioStreamSampleRate
import com.azure.android.communication.calling.AudioStreamStateChangedListener
import com.azure.android.communication.calling.CallAgent
import com.azure.android.communication.calling.IncomingAudioOptions
import com.azure.android.communication.calling.IncomingMixedAudioListener
import com.azure.android.communication.calling.JoinCallOptions
import com.azure.android.communication.calling.RawIncomingAudioStream
import com.azure.android.communication.calling.RawIncomingAudioStreamOptions
import com.azure.android.communication.calling.RawIncomingAudioStreamProperties
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import timber.log.Timber
import java.util.concurrent.ArrayBlockingQueue
import javax.inject.Inject


interface ICallAgent {
    fun join(appContext: Application, meetingLink: String): ICall

    fun switchOutgoingVideoFeed(
        context: Context,
        videoStream: IOutgoingVideoStream
    )

    fun stopOutgoingVideo(context: Context)

    fun getIncomingAudioQueue(): ArrayBlockingQueue<ByteArray>
    fun releaseIncomingAudioQueue()

    fun captureIncomingAudio()
    fun releaseIncomingAudio()

    fun dispose()
}

class CallAgentWrapper @Inject constructor(
    private val callAgent: CallAgent,
    private val teamsMeetingLinkLocator: ITeamsMeetingLinkLocator
) : ICallAgent {
    private val incomingAudioQueue = ArrayBlockingQueue<ByteArray>(20)

    private var incomingAudioPlaybackScope: CoroutineScope? = null
    private var incomingAudioTrack: AudioTrack? = null

    private val rawAudioStreamStateListener = AudioStreamStateChangedListener { event ->
        Timber.i("RawAudioStream (${event.stream.type}) state changed: ${event.stream.state}")
    }

    private val rawIncomingAudioStream = RawIncomingAudioStream(rawIncomingAudioStreamOptions).apply {
        addOnStateChangedListener(rawAudioStreamStateListener)
    }

    private val playbackOnlyIncomingMixedAudioListener = IncomingMixedAudioListener { audioBuffer ->
        val buffer = audioBuffer.audioBuffer.buffer.duplicate()
        val bufferByteArray = ByteArray(buffer.remaining())
        buffer.get(bufferByteArray)

        if (!incomingAudioQueue.offer(bufferByteArray)) {
            Timber.w("Failed to add audio buffer to incoming audio queue. Dropping Audio.")
            incomingAudioQueue.clear()
        }
    }

    override fun join(appContext: Application, meetingLink: String): ICall {
        val options = JoinCallOptions().apply {
            this.incomingAudioOptions = IncomingAudioOptions().apply {
                setStream(rawIncomingAudioStream)
            }
        }

        startPlayingIncomingAudioStream()

        return CallWrapper(
            callAgent.join(
                appContext,
                teamsMeetingLinkLocator.createTeamsMeetingLinkLocator(meetingLink),
                options
            )
        )
    }

    override fun getIncomingAudioQueue(): ArrayBlockingQueue<ByteArray> {
        releaseIncomingAudio()
        stopPlayingIncomingAudioStream()

        return incomingAudioQueue
    }

    override fun releaseIncomingAudioQueue() {
        startPlayingIncomingAudioStream()
    }

    override fun captureIncomingAudio() {
        rawIncomingAudioStream.addOnMixedAudioBufferReceivedListener(playbackOnlyIncomingMixedAudioListener)
    }

    override fun releaseIncomingAudio() {
        rawIncomingAudioStream.removeOnMixedAudioBufferReceivedListener(playbackOnlyIncomingMixedAudioListener)
        incomingAudioQueue.clear()
    }

    private fun startPlayingIncomingAudioStream() {
        releaseIncomingAudio()

        incomingAudioTrack = createAudioTrack().apply {
            play()
        }

        incomingAudioPlaybackScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
        incomingAudioPlaybackScope?.launch {
            Timber.i("Incoming audio playback started.")
            captureIncomingAudio()
            while (isActive) {
                incomingAudioQueue.poll()?.let { audioData ->
                    incomingAudioTrack?.write(audioData, 0, audioData.size, AudioTrack.WRITE_BLOCKING)
                }
            }
            Timber.i("Incoming audio playback stopped.")
        }
    }

    private fun stopPlayingIncomingAudioStream() {
        incomingAudioPlaybackScope?.cancel()
        incomingAudioPlaybackScope = null

        incomingAudioTrack?.stop()
        incomingAudioTrack?.release()
        incomingAudioTrack = null

        incomingAudioQueue.clear()
    }

    override fun switchOutgoingVideoFeed(
        context: Context,
        videoStream: IOutgoingVideoStream
    ) {
        callAgent.calls?.forEach { call ->
            call.outgoingVideoStreams?.forEach { outgoingVideoStream ->
                call.stopVideo(context, outgoingVideoStream).get()
            }

            call.startVideo(context, videoStream.outgoingVideoStream)
        }
    }

    override fun stopOutgoingVideo(context: Context) {
        callAgent.calls?.forEach { call ->
            call.outgoingVideoStreams?.forEach { outgoingVideoStream ->
                call.stopVideo(context, outgoingVideoStream)
            }
        }
    }

    override fun dispose() {
        releaseIncomingAudio()
        rawIncomingAudioStream.removeOnStateChangedListener(rawAudioStreamStateListener)

        stopPlayingIncomingAudioStream()

        callAgent.dispose()
    }

    private fun createAudioTrack(): AudioTrack {
        return AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setSampleRate(SPEECH_SAMPLE_RATE)
                    .setChannelMask(SPEECH_CHANNELS_OUT)
                    .setEncoding(SPEECH_AUDIO_FORMAT)
                    .build()
            )
            .setBufferSizeInBytes(MIN_BUFFER_SIZE_OUT)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()
    }

    companion object {
        private val INCOMING_AUDIO_FORMAT = AudioStreamFormat.PCM16_BIT
        private val INCOMING_SAMPLE_RATE = AudioStreamSampleRate.HZ_16000
        private val INCOMING_CHANNEL_MODE = AudioStreamChannelMode.MONO

        private val rawIncomingAudioStreamOptions = RawIncomingAudioStreamOptions().apply {
            setProperties(
                RawIncomingAudioStreamProperties()
                    .setFormat(INCOMING_AUDIO_FORMAT)
                    .setSampleRate(INCOMING_SAMPLE_RATE)
                    .setChannelMode(INCOMING_CHANNEL_MODE)
            )
        }

        private const val SPEECH_SAMPLE_RATE = 16_000
        private const val SPEECH_CHANNELS_OUT = AudioFormat.CHANNEL_OUT_MONO
        private const val SPEECH_AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT

        private val MIN_BUFFER_SIZE_OUT =
            AudioTrack.getMinBufferSize(SPEECH_SAMPLE_RATE, SPEECH_CHANNELS_OUT, SPEECH_AUDIO_FORMAT)
    }
}