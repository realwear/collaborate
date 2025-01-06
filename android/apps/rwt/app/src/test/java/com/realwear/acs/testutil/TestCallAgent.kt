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

import android.app.Application
import android.content.Context
import com.realwear.acs.dependency.ICall
import com.realwear.acs.dependency.ICallAgent
import com.realwear.acs.dependency.IOutgoingVideoStream

class TestCallAgent(private val testCall: TestCall) : ICallAgent {
    var hasJoinBeenCalled = false
    var hasDisposeBeenCalled = false
    var hasStopOutgoingVideoBeenCalled = false

    override fun join(appContext: Application, meetingLink: String): ICall {
        hasJoinBeenCalled = true
        return testCall
    }

    override fun switchOutgoingVideoFeed(context: Context, videoStream: IOutgoingVideoStream) {
        // Not used.
    }

    override fun stopOutgoingVideo(context: Context) {
        hasStopOutgoingVideoBeenCalled = true
    }

    override fun dispose() {
        hasDisposeBeenCalled = true
    }
}