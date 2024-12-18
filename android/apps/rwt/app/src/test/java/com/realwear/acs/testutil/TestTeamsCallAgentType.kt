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

import android.content.Context
import com.azure.android.communication.calling.TeamsCall
import com.azure.android.communication.calling.TeamsCallAgent
import com.realwear.acs.dependency.CallAgentType

class TestTeamsCallAgentType(
    teamsCallAgent: TeamsCallAgent,
    private val mockTeamsCall: TeamsCall
) : CallAgentType.TeamsCallAgentType(teamsCallAgent) {
    override fun startCall(context: Context, participantIdentifier: String): TeamsCall {
        return mockTeamsCall
    }
}