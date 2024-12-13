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
import com.azure.android.communication.calling.CallAgentOptions
import com.azure.android.communication.calling.CallClient
import com.azure.android.communication.calling.CommonCallAgent
import com.azure.android.communication.calling.CommonCallAgentOptions
import com.azure.android.communication.calling.DeviceManager
import com.azure.android.communication.calling.TeamsCallAgentOptions
import com.azure.android.communication.common.CommunicationTokenCredential
import javax.inject.Inject

interface ICallClient {
    fun getDeviceManager(appContext: Application): DeviceManager

    fun <T : CommonCallAgent> createCallAgent(
        appContext: Application,
        credential: CommunicationTokenCredential,
        options: CommonCallAgentOptions
    ): T
}

class CallClientWrapper @Inject constructor() : ICallClient {
    private val callClient = CallClient()

    override fun getDeviceManager(appContext: Application): DeviceManager {
        return callClient.getDeviceManager(appContext).get()
    }

    override fun <T : CommonCallAgent> createCallAgent(
        appContext: Application,
        credential: CommunicationTokenCredential,
        options: CommonCallAgentOptions
    ): T {
        return when (options) {
            is CallAgentOptions -> {
                callClient.createCallAgent(appContext, credential, options).get() as T
            }

            is TeamsCallAgentOptions -> {
                callClient.createTeamsCallAgent(appContext, credential, options).get() as T
            }

            else -> {
                throw IllegalArgumentException("Invalid options type")
            }
        }
    }

}