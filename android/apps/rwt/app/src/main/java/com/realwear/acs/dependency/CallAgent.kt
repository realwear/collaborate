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