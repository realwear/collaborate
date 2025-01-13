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
