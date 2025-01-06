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
import com.azure.android.communication.calling.CallAgent
import com.azure.android.communication.calling.CallAgentOptions
import com.azure.android.communication.calling.CallClient
import com.azure.android.communication.calling.DeviceManager
import com.azure.android.communication.common.CommunicationTokenCredential
import javax.inject.Inject

interface ICallClient {
    fun getDeviceManager(appContext: Application): DeviceManager

    fun createCallAgent(
        appContext: Application,
        credential: CommunicationTokenCredential,
        options: CallAgentOptions
    ): CallAgent
}

class CallClientWrapper @Inject constructor() : ICallClient {
    private val callClient = CallClient()

    override fun getDeviceManager(appContext: Application): DeviceManager {
        return callClient.getDeviceManager(appContext).get()
    }

    override fun createCallAgent(
        appContext: Application,
        credential: CommunicationTokenCredential,
        options: CallAgentOptions
    ): CallAgent {
        return callClient.createCallAgent(appContext, credential, options).get()
    }
}