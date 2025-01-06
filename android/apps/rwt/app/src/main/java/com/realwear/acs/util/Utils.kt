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
package com.realwear.acs.util

import android.content.Context
import com.realwear.acs.R
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

object Utils {
    fun parseMeetingName(context: Context, meetingName: String?): String {
        return if (meetingName?.isBlank() == false) meetingName else context.getString(R.string.meeting_name_default)
    }

    fun parseLocalParticipantName(suppliedName: String?, deviceModel: String): String {
        if (suppliedName?.isNotBlank() == true) {
            return suppliedName
        }

        return when (deviceModel) {
            "T1100G" -> "HMT-1 User"
            "T1200G" -> "HMT-1 User"
            "T1100S" -> "HMT-1Z1 User"
            "T21S" -> "Navigator-Z1 User"
            "T21G" -> "Navigator User"
            else -> "RealWear User"
        }
    }

    fun parseParticipantName(displayName: String): Pair<String, String> {
        val nameParts = displayName.trim().split(" ")

        val firstName = if (nameParts.isNotEmpty()) nameParts.first() else ""
        val lastName = if (nameParts.size > 1) nameParts.last() else ""

        return Pair(firstName, lastName)
    }

    fun generateSiteUrl(url: String): String {
        val encodedUrl = URLEncoder.encode(url, StandardCharsets.UTF_8.toString())
        return "${LOCAL_URL}?redirectUrl=${encodedUrl}&pingUrl=${encodedUrl}"
    }

    const val LOCAL_URL = "https://appassets.androidplatform.net/index.html"
}