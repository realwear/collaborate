package com.realwear.acs.repository

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import com.microsoft.cognitiveservices.speech.audio.AudioConfig
import com.microsoft.cognitiveservices.speech.audio.AudioInputStream
import com.microsoft.cognitiveservices.speech.audio.PullAudioInputStreamCallback
import com.microsoft.cognitiveservices.speech.translation.SpeechTranslationConfig
import com.microsoft.cognitiveservices.speech.translation.TranslationRecognizer
import com.realwear.acs.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import timber.log.Timber
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.ExecutionException
import javax.inject.Inject

interface ITranscriptionRepository {
    fun canUseTranscription(): Boolean

    fun setup(): Boolean
    fun teardown()

    fun startIncomingTranscription(incomingAudioQueue: ArrayBlockingQueue<ByteArray>)
    fun stopIncomingTranscription()
}

class TranscriptionRepository @Inject constructor() : ITranscriptionRepository {
    private var translationRecognizer: TranslationRecognizer? = null

    private val incomingAudioStream = ByteBufferAudioStream()
    private val incomingAudioInputStream = AudioInputStream.createPullStream(incomingAudioStream)
    private val incomingAudioConfig = AudioConfig.fromStreamInput(incomingAudioInputStream)

    private var incomingAudioTrack: AudioTrack? = null

    private var incomingAudioReadDispatcher = Dispatchers.IO
    private var incomingAudioReadScope = CoroutineScope(SupervisorJob() + incomingAudioReadDispatcher)

    override fun canUseTranscription(): Boolean {
        return BuildConfig.COGNITIVE_SERVICES_SPEECH_TOKEN != null
    }

    override fun setup(): Boolean {
        translationRecognizer?.let {
            Timber.w("Translation recognizer already set up")
            return false
        }

        val speechToken = BuildConfig.COGNITIVE_SERVICES_SPEECH_TOKEN.takeIf { it != "null" } ?: run {
            Timber.e("Missing Cognitive Services Speech token")
            return false
        }

        incomingAudioTrack = createAudioTrack()

        val speechConfig = SpeechTranslationConfig.fromSubscription(speechToken, REGION)
        speechConfig.setSpeechRecognitionLanguage(SPEECH_RECOGNITION_LANGUAGE)
        speechConfig.voiceName = OUTPUT_VOICE_NAME

        for (language in OUTPUT_LANGUAGES) {
            speechConfig.addTargetLanguage(language)
        }

        translationRecognizer = TranslationRecognizer(speechConfig, incomingAudioConfig)
        translationRecognizer?.recognizing?.addEventListener { _, event ->
            event.result.translations.forEach { (lang, translation) ->
                Timber.i("Translated (Intermediate) to $lang: $translation")
            }
        }

        translationRecognizer?.recognized?.addEventListener { _, event ->
            event.result.translations.forEach { (lang, translation) ->
                Timber.i("Translated to $lang: $translation")
            }
        }

        translationRecognizer?.synthesizing?.addEventListener { _, event ->
            Timber.i("Synthesizing: ${event.result.audio.size}")
            incomingAudioTrack?.write(event.result.audio, 0, event.result.audio.size)
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                translationRecognizer?.startContinuousRecognitionAsync()?.get()
            } catch (e: ExecutionException) {
                Timber.e(e, "Failed to start continuous recognition")
            } catch (e: InterruptedException) {
                Timber.e(e, "Failed to start continuous recognition")
            }
        }

        return true
    }

    override fun startIncomingTranscription(incomingAudioQueue: ArrayBlockingQueue<ByteArray>) {
        Timber.i("Starting incoming audio transcription")

        incomingAudioTrack?.play()

        incomingAudioReadScope.launch {
            while (isActive) {
                incomingAudioQueue.poll()?.let { audioData ->
                    incomingAudioStream.send(audioData)
                }
            }
        }
    }

    override fun stopIncomingTranscription() {
        Timber.i("Stopping incoming audio transcription")

        incomingAudioReadScope.cancel()
        incomingAudioReadScope = CoroutineScope(SupervisorJob() + incomingAudioReadDispatcher)

        incomingAudioTrack?.stop()
    }

    override fun teardown() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                translationRecognizer?.stopContinuousRecognitionAsync()?.get()
            } catch (e: ExecutionException) {
                Timber.e(e, "Failed to stop continuous recognition")
            } catch (e: InterruptedException) {
                Timber.e(e, "Failed to stop continuous recognition")
            } finally {
                translationRecognizer?.close()
                Timber.i("Translation recognizer closed")
                translationRecognizer = null
            }
        }

        incomingAudioTrack?.release()
        incomingAudioTrack = null
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
                    .setChannelMask(SPEECH_CHANNELS)
                    .setEncoding(SPEECH_AUDIO_FORMAT)
                    .build()
            )
            .setBufferSizeInBytes(MIN_BUFFER_SIZE)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()
    }

    private class ByteBufferAudioStream : PullAudioInputStreamCallback() {
        private val audioQueue: Channel<ByteArray> = Channel(Channel.UNLIMITED)

        override fun read(buffer: ByteArray): Int {
            val audioData = runBlocking {
                audioQueue.receive()
            }

            val length = audioData.size
            System.arraycopy(audioData, 0, buffer, 0, length)
            return audioData.size
        }

        override fun close() {
            while (true) {
                val result = audioQueue.tryReceive()
                if (result.isFailure) break
            }

            audioQueue.close()
        }

        fun send(buffer: ByteArray) {
            runBlocking {
                audioQueue.send(buffer)
            }
        }
    }

    companion object {
        private const val REGION = "eastus"

        private const val SPEECH_RECOGNITION_LANGUAGE = "en-US"
        private val OUTPUT_LANGUAGES = listOf("en")
        private const val OUTPUT_VOICE_NAME = "en-GB-LibbyNeural"

        private const val SPEECH_SAMPLE_RATE = 16_000
        private const val SPEECH_CHANNELS = AudioFormat.CHANNEL_OUT_MONO
        private const val SPEECH_AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT

        private val MIN_BUFFER_SIZE =
            AudioTrack.getMinBufferSize(SPEECH_SAMPLE_RATE, SPEECH_CHANNELS, SPEECH_AUDIO_FORMAT)
    }
}
