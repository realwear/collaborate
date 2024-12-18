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
import com.azure.android.communication.calling.TeamsCallAgent
import com.azure.android.communication.common.CommunicationTokenCredential
import com.realwear.acs.testutil.TestCommonCallAgentOptions
import com.realwear.acs.testutil.TestStandardCallClientType
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.junit.MockitoJUnitRunner

@ExperimentalCoroutinesApi
@RunWith(MockitoJUnitRunner::class)
class CallClientTest {
    private lateinit var callClientWrapper: CallClientWrapper<CallClientType>

    @Mock
    private lateinit var mockCallAgent: CallAgent

    @Mock
    private lateinit var mockTeamsCallAgent: TeamsCallAgent

    @Mock
    private lateinit var mockApplication: Application

    @Mock
    private lateinit var mockCommunicationTokenCredential: CommunicationTokenCredential

    @Before
    fun setUp() {
        MockitoAnnotations.openMocks(this)

        callClientWrapper = CallClientWrapper(
            TestStandardCallClientType(mockCallAgent, mockTeamsCallAgent),
            object : ICommunicationTokenCredential {
                override fun createCommunicationTokenCredential(userToken: String): CommunicationTokenCredential {
                    return mockCommunicationTokenCredential
                }
            }
        )
    }

    @Test
    fun testCreatingCallClient() {
        val callAgent = callClientWrapper.createCallAgent(
            mockApplication,
            USER_TOKEN,
            TestCommonCallAgentOptions()
        )

        assert(callAgent is CallAgent)
    }

    @Test
    fun testCreatingTeamsCallClient() {
        val teamsCallAgent = callClientWrapper.createTeamsCallAgent(
            mockApplication,
            USER_TOKEN,
            TestCommonCallAgentOptions()
        )

        assert(teamsCallAgent is TeamsCallAgent)
    }

    companion object {
        private const val USER_TOKEN = "user_token"
    }
}