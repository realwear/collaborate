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
