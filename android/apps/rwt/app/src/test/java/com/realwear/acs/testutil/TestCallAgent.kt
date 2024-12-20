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