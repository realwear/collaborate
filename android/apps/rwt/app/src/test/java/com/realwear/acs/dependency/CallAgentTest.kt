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
import com.azure.android.communication.calling.Call
import com.azure.android.communication.calling.CallAgent
import com.azure.android.communication.calling.TeamsCall
import com.azure.android.communication.calling.TeamsCallAgent
import com.realwear.acs.testutil.TestJoinCallOptions
import com.realwear.acs.testutil.TestStandardCallAgentType
import com.realwear.acs.testutil.TestTeamsCallAgentType
import com.realwear.acs.testutil.TestTeamsMeetingLinkLocator
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.junit.MockitoJUnitRunner
import kotlin.test.assertFailsWith

@ExperimentalCoroutinesApi
@RunWith(MockitoJUnitRunner::class)
class CallAgentTest {
    private lateinit var standardCallAgentWrapper: CallAgentWrapper<CallAgentType.StandardCallAgentType>
    private lateinit var teamsCallAgentWrapper: CallAgentWrapper<CallAgentType.TeamsCallAgentType>

    @Mock
    private lateinit var mockCallAgent: CallAgent

    @Mock
    private lateinit var mockTeamsCallAgent: TeamsCallAgent

    @Mock
    private lateinit var mockCall: Call

    @Mock
    private lateinit var mockTeamsCall: TeamsCall

    @Mock
    private lateinit var mockApplication: Application

    @Before
    fun setUp() {
        MockitoAnnotations.openMocks(this)

        standardCallAgentWrapper = CallAgentWrapper(
            TestStandardCallAgentType(mockCallAgent, mockCall),
            TestTeamsMeetingLinkLocator()
        )

        teamsCallAgentWrapper = CallAgentWrapper(
            TestTeamsCallAgentType(mockTeamsCallAgent, mockTeamsCall),
            TestTeamsMeetingLinkLocator()
        )
    }

    @Test
    fun testJoiningCallWithStandardCallAgent() {
        standardCallAgentWrapper.join(mockApplication, MEETING_LINK, TestJoinCallOptions())
    }

    @Test
    fun testJoiningCallWithTeamsCallAgent() {
        assertFailsWith<IllegalArgumentException> {
            teamsCallAgentWrapper.join(mockApplication, MEETING_LINK, TestJoinCallOptions())
        }
    }

    @Test
    fun testMeetingCallWithStandardCallAgent() {
        assertFailsWith<IllegalArgumentException> {
            standardCallAgentWrapper.startCall(mockApplication, PARTICIPANT_IDENTIFIER)
        }
    }

    @Test
    fun testMeetingCallWithTeamsCallAgent() {
        teamsCallAgentWrapper.startCall(mockApplication, PARTICIPANT_IDENTIFIER)
    }

    companion object {
        private const val MEETING_LINK = "https://teams.microsoft.com/l/meetup-join/1234567890"
        private const val PARTICIPANT_IDENTIFIER = "8:orgid:1234567890"
    }
}