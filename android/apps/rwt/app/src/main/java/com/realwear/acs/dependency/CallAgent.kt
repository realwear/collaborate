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

import android.app.Application
import android.content.Context
import com.azure.android.communication.calling.CallAgent
import com.azure.android.communication.calling.CommonCall
import com.azure.android.communication.calling.CommonCallAgent
import com.azure.android.communication.calling.JoinCallOptions
import com.azure.android.communication.calling.OutgoingVideoOptions
import com.azure.android.communication.calling.TeamsCallAgent
import com.azure.android.communication.common.MicrosoftTeamsUserIdentifier
import javax.inject.Inject

interface ICallAgent {
    fun join(appContext: Application, meetingLink: String): ICall

    fun startCall(appContext: Application, participantIdentifier: String): ICall

    fun switchOutgoingVideoFeed(
        context: Context,
        videoStream: IOutgoingVideoStream
    )

    fun stopOutgoingVideo(context: Context)

    fun dispose()
}

sealed class CallAgentType {
    abstract val calls: List<CommonCall>
    abstract val agent: CommonCallAgent

    class StandardCallAgentType(
        private val callAgent: CallAgent
    ) : CallAgentType() {
        override val calls: List<CommonCall>
            get() = callAgent.calls

        override val agent: CommonCallAgent = callAgent
    }

    class TeamsCallAgentType(
        private val teamsCallAgent: TeamsCallAgent
    ) : CallAgentType() {
        override val calls: List<CommonCall>
            get() = teamsCallAgent.calls

        override val agent: CommonCallAgent = teamsCallAgent
    }
}

class CallAgentWrapper<T : CallAgentType> @Inject constructor(
    private val callAgent: T,
    private val teamsMeetingLinkLocator: ITeamsMeetingLinkLocator
) : ICallAgent {
    override fun join(appContext: Application, meetingLink: String): ICall {
        val options = JoinCallOptions()
        options.outgoingVideoOptions = OutgoingVideoOptions()

        if (callAgent !is CallAgentType.StandardCallAgentType) {
            throw IllegalArgumentException("Call agent is not a standard call agent")
        }

        val agent = callAgent.agent as CallAgent
        return CallWrapper(
            agent.join(
                appContext,
                teamsMeetingLinkLocator.createTeamsMeetingLinkLocator(meetingLink),
                options
            )
        )
    }

    override fun startCall(appContext: Application, participantIdentifier: String): ICall {
        val participant = MicrosoftTeamsUserIdentifier(participantIdentifier)

        if (callAgent !is CallAgentType.TeamsCallAgentType) {
            throw IllegalArgumentException("Call agent is not a Teams call agent")
        }

        val agent = callAgent.agent as TeamsCallAgent
        return CallWrapper(
            agent.startCall(
                appContext,
                participant
            )
        )
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
        callAgent.agent.dispose()
    }
}