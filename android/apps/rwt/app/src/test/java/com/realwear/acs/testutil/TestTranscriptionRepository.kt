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

import com.realwear.acs.repository.ITranscriptionRepository
import java.util.concurrent.ArrayBlockingQueue

class TestTranscriptionRepository : ITranscriptionRepository {
    var isSetupSuccessful = true
    var canUseTranscription = true

    var hasSetupBeenCalled = false
    var hasTeardownBeenCalled = false
    var hasStartIncomingTranscriptionBeenCalled = false
    var hasStopIncomingTranscription = false

    override fun setup(): Boolean {
        hasSetupBeenCalled = true
        return isSetupSuccessful
    }

    override fun teardown() {
        hasTeardownBeenCalled = true
    }

    override fun canUseTranscription(): Boolean {
        return canUseTranscription
    }

    override fun startIncomingTranscription(incomingAudioQueue: ArrayBlockingQueue<ByteArray>) {
        hasStartIncomingTranscriptionBeenCalled = true
    }

    override fun stopIncomingTranscription() {
        hasStopIncomingTranscription = true
    }
}
