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