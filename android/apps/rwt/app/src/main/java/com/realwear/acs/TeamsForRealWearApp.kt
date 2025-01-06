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
package com.realwear.acs

import android.app.Application
import android.util.Log
import androidx.compose.ui.tooling.preview.Preview
import com.datadog.android.Datadog
import com.datadog.android.core.configuration.Configuration
import com.datadog.android.log.Logger
import com.datadog.android.log.Logs
import com.datadog.android.log.LogsConfiguration
import com.datadog.android.privacy.TrackingConsent
import com.datadog.android.timber.DatadogTree
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber

@HiltAndroidApp
class TeamsForRealWearApp : Application() {
    override fun onCreate() {
        super.onCreate()

        Timber.plant(Timber.DebugTree())
        createDatadogTree()?.let { Timber.plant(it) }
    }

    private fun createDatadogTree(): DatadogTree? {
        if (BuildConfig.DATADOG_CLIENT_TOKEN == "null") {
            Timber.w("Datadog client token is not set")
            return null
        }

        val configuration = Configuration.Builder(
            clientToken = BuildConfig.DATADOG_CLIENT_TOKEN,
            env = if (BuildConfig.DEBUG) "development" else "production",
            variant = "",
        ).build()

        Datadog.initialize(this, configuration, TrackingConsent.GRANTED)

        Datadog.setVerbosity(Log.INFO)
        val logsConfig = LogsConfiguration.Builder().build()
        Logs.enable(logsConfig)

        val logger = Logger.Builder()
            .setNetworkInfoEnabled(true)
            .setLogcatLogsEnabled(false)
            .setRemoteSampleRate(100f)
            .setBundleWithTraceEnabled(true)
            .setName("Microsoft Teams for RealWear")
            .build()

        return DatadogTree(logger)
    }
}

@Preview(name = "Navigator-500", device = "spec:width=1280px,height=720px,dpi=240")
annotation class DevicesPreview
