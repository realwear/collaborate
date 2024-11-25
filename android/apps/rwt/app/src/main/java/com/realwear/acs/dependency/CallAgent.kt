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
import com.azure.android.communication.calling.JoinCallOptions
import com.azure.android.communication.calling.OutgoingVideoOptions
import javax.inject.Inject

interface ICallAgent {
    fun join(appContext: Application, meetingLink: String): ICall

    fun switchOutgoingVideoFeed(
        context: Context,
        videoStream: IOutgoingVideoStream
    )

    fun stopOutgoingVideo(context: Context)

    fun dispose()
}

class CallAgentWrapper @Inject constructor(
    private val callAgent: CallAgent,
    private val teamsMeetingLinkLocator: ITeamsMeetingLinkLocator
) : ICallAgent {
    override fun join(appContext: Application, meetingLink: String): ICall {
        val options = JoinCallOptions()
        options.outgoingVideoOptions = OutgoingVideoOptions()

        return CallWrapper(
            callAgent.join(
                appContext,
                teamsMeetingLinkLocator.createTeamsMeetingLinkLocator(meetingLink),
                options
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
        callAgent.dispose()
    }
}