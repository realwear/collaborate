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