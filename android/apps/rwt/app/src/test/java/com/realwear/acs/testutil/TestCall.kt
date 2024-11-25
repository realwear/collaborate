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

import android.content.Context
import com.azure.android.communication.calling.CallState
import com.azure.android.communication.calling.CallVideoStream
import com.realwear.acs.dependency.ICall
import com.realwear.acs.model.Participant
import com.realwear.acs.model.UpdatedParticipants
import java9.util.concurrent.CompletableFuture

class TestCall(
    override var state: CallState = CallState.NONE,
    override var callEndedReason: ICall.CallEndedReason = ICall.CallEndedReason.NONE,
) : ICall {
    private var stateChangedListener: (() -> Unit)? = null
    private var remoteParticipantsUpdatedListener: ((UpdatedParticipants) -> Unit)? = null
    private val remoteParticipantVideoStreamStateChangedListeners =
        mutableMapOf<String, (Boolean, CallVideoStream?) -> Unit>()

    private val remoteParticipantSpeakingChangedListeners = mutableMapOf<String, (Boolean) -> Unit>()

    private var mutedByOthersListener: (() -> Unit)? = null

    private var hangUpFuture = CompletableFuture<Void>()

    var stateChangedListenerIsSet = false
    var remoteParticipantsUpdatedListenerIsSet = false
    var statisticsAreReporting = false
    var microphoneIsMuted = false

    fun setCallState(callState: CallState) {
        state = callState
        stateChangedListener?.invoke()
    }

    fun setCallEndReason(reason: ICall.CallEndedReason) {
        callEndedReason = reason
    }

    fun addParticipant(participant: Participant) {
        remoteParticipantsUpdatedListener?.invoke(
            UpdatedParticipants(
                listOf(participant),
                emptyList()
            )
        )
    }

    fun removeParticipant(participant: Participant) {
        remoteParticipantsUpdatedListener?.invoke(
            UpdatedParticipants(
                emptyList(),
                listOf(participant),
            )
        )

        remoteParticipantVideoStreamStateChangedListeners[participant.identifier]?.invoke(false, null)
    }

    fun startParticipantScreenShare(participant: Participant, streaming: Boolean) {
        remoteParticipantVideoStreamStateChangedListeners[participant.identifier]?.invoke(streaming, null)
    }

    fun startParticipantTalking(participant: Participant, talking: Boolean) {
        remoteParticipantSpeakingChangedListeners[participant.identifier]?.invoke(talking)
    }

    fun completeHangup() {
        hangUpFuture.complete(null)
    }

    fun muteByOther() {
        microphoneIsMuted = true
        mutedByOthersListener?.invoke()
    }

    override fun setOnStateChangedListener(listener: () -> Unit) {
        stateChangedListener = listener
        stateChangedListenerIsSet = true
    }

    override fun removeOnStateChangedListener() {
        stateChangedListener = null
        stateChangedListenerIsSet = false
    }

    override fun setOnRemoteParticipantsUpdatedListener(listener: (UpdatedParticipants) -> Unit) {
        remoteParticipantsUpdatedListener = listener
        remoteParticipantsUpdatedListenerIsSet = true
    }

    override fun removeOnRemoteParticipantsUpdatedListener() {
        remoteParticipantsUpdatedListener = null
        remoteParticipantsUpdatedListenerIsSet = false
    }

    override fun addOnRemoteParticipantVideoStreamStateChangedListener(
        remoteParticipant: String,
        listener: (Boolean, CallVideoStream?) -> Unit
    ) {
        remoteParticipantVideoStreamStateChangedListeners[remoteParticipant] = listener
    }

    override fun removeOnRemoteParticipantVideoStreamStateChangedListener(
        remoteParticipant: String,
        listener: (Boolean, CallVideoStream?) -> Unit
    ) {
        remoteParticipantVideoStreamStateChangedListeners.remove(remoteParticipant)
    }

    override fun addOnRemoteParticipantSpeakingChangedListener(remoteParticipant: String, listener: (Boolean) -> Unit) {
        remoteParticipantSpeakingChangedListeners[remoteParticipant] = listener
    }

    override fun removeOnRemoteParticipantSpeakingChangedListener(
        remoteParticipant: String,
        listener: (Boolean) -> Unit
    ) {
        remoteParticipantSpeakingChangedListeners.remove(remoteParticipant)
    }

    override fun setOnMutedByOthersListener(listener: () -> Unit) {
        mutedByOthersListener = listener
    }

    override fun removeOnMutedByOthersListener() {
        mutedByOthersListener = null
    }

    override fun startLoggingStatistics() {
        statisticsAreReporting = true
    }

    override fun stopLoggingStatistics() {
        statisticsAreReporting = false
    }

    override fun muteMic(context: Context, mute: Boolean) {
        microphoneIsMuted = mute

        // ACS calls this whenever the microphone is muted, regardless of who muted it.
        mutedByOthersListener?.invoke()
    }

    override fun hangUp(): CompletableFuture<Void> {
        hangUpFuture = CompletableFuture<Void>()
        return hangUpFuture
    }
}