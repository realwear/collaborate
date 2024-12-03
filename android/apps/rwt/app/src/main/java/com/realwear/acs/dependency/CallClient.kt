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
import com.azure.android.communication.calling.CallAgent
import com.azure.android.communication.calling.CallAgentOptions
import com.azure.android.communication.calling.CallClient
import com.azure.android.communication.calling.DeviceManager
import com.azure.android.communication.calling.TeamsCallAgent
import com.azure.android.communication.calling.TeamsCallAgentOptions
import com.azure.android.communication.common.CommunicationTokenCredential
import javax.inject.Inject

interface ICallClient {
    fun getDeviceManager(appContext: Application): DeviceManager

    fun createCallAgent(
        appContext: Application,
        credential: CommunicationTokenCredential,
        options: CallAgentOptions
    ): CallAgent

    fun createCallAgentForTeams(
        appContext: Application,
        credential: CommunicationTokenCredential,
        options: TeamsCallAgentOptions
    ): TeamsCallAgent
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

    override fun createCallAgentForTeams(
        appContext: Application,
        credential: CommunicationTokenCredential,
        options: TeamsCallAgentOptions
    ): TeamsCallAgent {
        return callClient.createTeamsCallAgent(appContext, credential, options).get()
    }
}