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

import android.content.Context
import com.azure.android.communication.calling.CallState
import com.azure.android.communication.calling.CallVideoStream
import com.azure.android.communication.calling.CommonCall
import com.azure.android.communication.calling.Features
import com.azure.android.communication.calling.MediaStatisticsReportReceivedEvent
import com.azure.android.communication.calling.ParticipantsUpdatedEvent
import com.azure.android.communication.calling.PropertyChangedEvent
import com.azure.android.communication.calling.RemoteParticipant
import com.azure.android.communication.calling.VideoStreamSourceType
import com.azure.android.communication.calling.VideoStreamState
import com.azure.android.communication.calling.VideoStreamStateChangedEvent
import com.realwear.acs.model.Participant
import com.realwear.acs.model.UpdatedParticipants
import com.realwear.acs.util.Utils
import java9.util.concurrent.CompletableFuture
import timber.log.Timber
import javax.inject.Inject

interface ICall {
    val state: CallState
    val callEndedReason: CallEndedReason

    fun setOnStateChangedListener(listener: () -> Unit)
    fun removeOnStateChangedListener()

    fun setOnRemoteParticipantsUpdatedListener(listener: (UpdatedParticipants) -> Unit)
    fun removeOnRemoteParticipantsUpdatedListener()

    fun addOnRemoteParticipantVideoStreamStateChangedListener(
        remoteParticipant: String,
        listener: (Boolean, CallVideoStream?) -> Unit
    )

    fun removeOnRemoteParticipantVideoStreamStateChangedListener(
        remoteParticipant: String,
        listener: (Boolean, CallVideoStream?) -> Unit
    )

    fun addOnRemoteParticipantSpeakingChangedListener(remoteParticipant: String, listener: (Boolean) -> Unit)

    fun removeOnRemoteParticipantSpeakingChangedListener(
        remoteParticipant: String,
        listener: (Boolean) -> Unit
    )

    fun setOnMutedByOthersListener(listener: () -> Unit)

    fun removeOnMutedByOthersListener()

    fun startLoggingStatistics()

    fun stopLoggingStatistics()

    fun muteMic(context: Context, mute: Boolean)

    fun hangUp(): CompletableFuture<Void>

    enum class CallEndedReason {
        NONE,
        USER_HUNG_UP,
        NETWORK_ERROR
    }
}

class CallWrapper @Inject constructor(private val call: CommonCall) : ICall {
    override val state: CallState
        get() = call.state

    private var onStateChangedListener: ((PropertyChangedEvent) -> Unit)? = null
    private var onRemoteParticipantsUpdatedListener: ((ParticipantsUpdatedEvent) -> Unit)? = null
    private var onMutedByOthersListener: ((PropertyChangedEvent) -> Unit)? = null

    private var mediaStatisticsReportReceivedListener: ((MediaStatisticsReportReceivedEvent) -> Unit)? = null

    private val participantMap = mutableMapOf<String, RemoteParticipant>()
    private val remoteParticipantVideoStreamStateChangedListeners =
        mutableMapOf<String, (VideoStreamStateChangedEvent) -> Unit>()
    private val remoteParticipantSpeakingChangedListeners =
        mutableMapOf<String, (PropertyChangedEvent) -> Unit>()

    // For call end reason codes see:
    // https://learn.microsoft.com/en-us/azure/communication-services/concepts/troubleshooting-info#calling-sdk-error-codes
    override val callEndedReason: ICall.CallEndedReason
        get() = run {
            Timber.i("Call ended with code: ${call.callEndReason?.code}.")
            when (call.callEndReason?.code) {
                0, 487 -> ICall.CallEndedReason.USER_HUNG_UP
                490, 491, 496, 497, 498 -> ICall.CallEndedReason.NETWORK_ERROR
                else -> ICall.CallEndedReason.NONE
            }
        }

    override fun setOnStateChangedListener(listener: () -> Unit) {
        removeOnStateChangedListener()

        onStateChangedListener = { listener() }
        call.addOnStateChangedListener(onStateChangedListener)
    }

    override fun removeOnStateChangedListener() {
        onStateChangedListener?.let {
            call.removeOnStateChangedListener(it)
        }
        onStateChangedListener = null
    }

    override fun setOnRemoteParticipantsUpdatedListener(listener: (UpdatedParticipants) -> Unit) {
        removeOnRemoteParticipantsUpdatedListener()

        onRemoteParticipantsUpdatedListener = { participantsUpdatedEvent ->
            val addedParticipants = arrayListOf<Participant>()
            val removedParticipants = arrayListOf<Participant>()

            participantsUpdatedEvent.addedParticipants.forEach { participant ->
                participantMap[participant.identifier.rawId] = participant

                val participantName = Utils.parseParticipantName(participant.displayName)
                addedParticipants.add(
                    Participant(
                        identifier = participant.identifier.rawId,
                        firstName = participantName.first,
                        lastName = participantName.second,
                        isTalking = participant.isSpeaking,
                    )
                )
            }

            participantsUpdatedEvent.removedParticipants.forEach { participant ->
                val participantName = Utils.parseParticipantName(participant.displayName)
                removedParticipants.add(
                    Participant(
                        identifier = participant.identifier.rawId,
                        firstName = participantName.first,
                        lastName = participantName.second,
                        isTalking = participant.isSpeaking,
                    )
                )

                participantMap.remove(participant.identifier.rawId)
            }

            listener(UpdatedParticipants(addedParticipants, removedParticipants))
        }
        call.addOnRemoteParticipantsUpdatedListener(onRemoteParticipantsUpdatedListener)
    }

    override fun removeOnRemoteParticipantsUpdatedListener() {
        onRemoteParticipantsUpdatedListener?.let {
            call.removeOnRemoteParticipantsUpdatedListener(it)
        }
        onRemoteParticipantsUpdatedListener = null
    }

    override fun addOnRemoteParticipantVideoStreamStateChangedListener(
        remoteParticipant: String,
        listener: (Boolean, CallVideoStream?) -> Unit
    ) {
        remoteParticipantVideoStreamStateChangedListeners[remoteParticipant] = { videoStreamStateChangedEvent ->
            val stream = videoStreamStateChangedEvent.stream

            when (stream.state) {
                VideoStreamState.AVAILABLE -> {
                    if (stream.sourceType == VideoStreamSourceType.SCREEN_SHARING) {
                        Timber.i("Screen sharing stream available.")
                        listener(true, stream)
                    }
                }

                VideoStreamState.STOPPED -> {
                    if (stream.sourceType == VideoStreamSourceType.SCREEN_SHARING) {
                        Timber.i("Screen sharing stream stopped.")
                        listener(false, null)
                    }
                }

                else -> {
                    // Do nothing
                }
            }
        }

        participantMap[remoteParticipant]?.addOnVideoStreamStateChangedListener(
            remoteParticipantVideoStreamStateChangedListeners[remoteParticipant]
        )
    }

    override fun removeOnRemoteParticipantVideoStreamStateChangedListener(
        remoteParticipant: String,
        listener: (Boolean, CallVideoStream?) -> Unit
    ) {
        remoteParticipantVideoStreamStateChangedListeners[remoteParticipant]?.let {
            participantMap[remoteParticipant]?.removeOnVideoStreamStateChangedListener(it)
        }
    }

    override fun addOnRemoteParticipantSpeakingChangedListener(
        remoteParticipant: String,
        listener: (Boolean) -> Unit
    ) {
        remoteParticipantSpeakingChangedListeners[remoteParticipant] = { _ ->
            participantMap[remoteParticipant]?.let {
                listener(it.isSpeaking)
            }
        }

        participantMap[remoteParticipant]?.addOnIsSpeakingChangedListener(
            remoteParticipantSpeakingChangedListeners[remoteParticipant]
        )
    }

    override fun removeOnRemoteParticipantSpeakingChangedListener(
        remoteParticipant: String,
        listener: (Boolean) -> Unit
    ) {
        remoteParticipantSpeakingChangedListeners[remoteParticipant]?.let {
            participantMap[remoteParticipant]?.removeOnIsSpeakingChangedListener(it)
        }
    }

    override fun setOnMutedByOthersListener(listener: () -> Unit) {
        removeOnMutedByOthersListener()

        onMutedByOthersListener = { if (call.isOutgoingAudioMuted) listener() }
        call.addOnOutgoingAudioStateChangedListener(onMutedByOthersListener)
    }

    override fun removeOnMutedByOthersListener() {
        onMutedByOthersListener?.let {
            try {
                call.removeOnOutgoingAudioStateChangedListener(onStateChangedListener)
            } catch (ex: IllegalArgumentException) {
                // Happens if no listener is registered. Ignore.
            }
        }
        onMutedByOthersListener = null
    }

    override fun startLoggingStatistics() {
        mediaStatisticsReportReceivedListener = { mediaStatisticsReportReceivedEvent ->
            mediaStatisticsReportReceivedEvent.report?.outgoingStatistics?.videoStatistics?.forEach { stats ->
                val width = stats.frameWidth
                val height = stats.frameHeight
                val frameRate = stats.frameRate
                val bitrate = stats.bitrateInBps
                val codec = stats.codecName

                Timber.i(
                    "Video statistics: ${width}x${height} @ ${frameRate}fps (${bitrate}bps codec=${codec})"
                )
            }
        }

        val mediaStatisticsCallFeature = call.feature(Features.MEDIA_STATISTICS)
        mediaStatisticsCallFeature?.addOnReportReceivedListener(mediaStatisticsReportReceivedListener)
        mediaStatisticsCallFeature?.updateReportIntervalInSeconds(STATS_INTERVAL_SECONDS)
    }

    override fun stopLoggingStatistics() {
        mediaStatisticsReportReceivedListener?.let {
            val mediaStatisticsCallFeature = call.feature(Features.MEDIA_STATISTICS)
            mediaStatisticsCallFeature?.removeOnReportReceivedListener(it)
        }
    }

    override fun muteMic(context: Context, mute: Boolean) {
        if (mute) {
            call.muteOutgoingAudio(context)
        } else {
            call.unmuteOutgoingAudio(context)
        }
    }

    override fun hangUp(): CompletableFuture<Void> {
        return call.hangUp()
    }

    companion object {
        private const val STATS_INTERVAL_SECONDS = 15
    }
}