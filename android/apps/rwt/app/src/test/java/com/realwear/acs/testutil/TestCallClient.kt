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
import com.azure.android.communication.calling.CallAgent
import com.azure.android.communication.calling.CallAgentOptions
import com.azure.android.communication.calling.DeviceManager
import com.azure.android.communication.common.CommunicationTokenCredential
import com.realwear.acs.dependency.ICallClient

class TestCallClient : ICallClient {
    override fun getDeviceManager(appContext: Application): DeviceManager {
        TODO("Not yet implemented")
    }

    override fun createCallAgent(
        appContext: Application,
        credential: CommunicationTokenCredential,
        options: CallAgentOptions
    ): CallAgent {
        TODO("Not yet implemented")
    }
}