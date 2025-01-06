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

import android.webkit.WebResourceResponse
import timber.log.Timber
import java.io.IOException
import java.io.InputStream
import java.io.UnsupportedEncodingException
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

object AzureApiUtils {
    fun handleApiCode(clientId: String, tenantId: String, scope: String): WebResourceResponse {
        val formData = HashMap<String, String>()
        formData[FORM_CLIENT_ID] = clientId
        formData[FORM_SCOPE] = "$scope $OPENID_SCOPES"

        try {
            val connection = sendFormData(formData, URL(generateDeviceCodeEndpoint((tenantId))))
            return createWebResponse(connection)
        } catch (e: IOException) {
            Timber.e("Error sending code request", e)
            return RESPONSE_400
        } catch (e: UnsupportedEncodingException) {
            Timber.e("Error encoding form data", e)
            return RESPONSE_400
        }
    }

    fun handleApiToken(
        clientId: String,
        tenantId: String,
        deviceCode: String,
        scope: String
    ): WebResourceResponse {
        val formData = HashMap<String, String>()
        formData[FORM_CLIENT_ID] = clientId
        formData[FORM_SCOPE] = "$scope $OPENID_SCOPES"
        formData[FORM_GRANT_TYPE] = GRANT_TYPE_TOKEN
        formData[FORM_DEVICE_CODE] = deviceCode

        try {
            val connection = sendFormData(formData, URL(generateTokenEndpoint(tenantId)))
            return createWebResponse(connection)
        } catch (e: IOException) {
            Timber.e("Error sending API Token request", e)
            return RESPONSE_400
        } catch (e: UnsupportedEncodingException) {
            Timber.e("Error encoding form data", e)
            return RESPONSE_400
        }
    }

    fun handleApiRefresh(
        clientId: String,
        tenantId: String,
        refreshToken: String,
        scope: String
    ): WebResourceResponse {
        // handle exceptions
        val formData = HashMap<String, String>()
        formData[FORM_CLIENT_ID] = clientId
        formData[FORM_SCOPE] = "$scope $OPENID_SCOPES"
        formData[FORM_GRANT_TYPE] = GRANT_TYPE_REFRESH
        formData[FORM_REFRESH_TOKEN] = refreshToken

        try {
            val connection = sendFormData(formData, URL(generateTokenEndpoint(tenantId)))
            return createWebResponse(connection)
        } catch (e: IOException) {
            Timber.e("Error sending API refresh request", e)
            return RESPONSE_400
        } catch (e: UnsupportedEncodingException) {
            Timber.e("Error encoding form data", e)
            return RESPONSE_400
        }
    }

    private fun sendFormData(formData: Map<String, String>, apiUrl: URL): HttpURLConnection {
        val connection = apiUrl.openConnection() as HttpURLConnection
        connection.requestMethod = POST
        connection.setRequestProperty(CONTENT_TYPE, CONTENT_TYPE_FORM_URL_ENCODED)
        connection.doOutput = true
        connection.outputStream.use { outputStream ->
            outputStream.write(encodeFormData(formData).toByteArray())
            outputStream.flush()
        }
        return connection
    }

    private fun encodeFormData(formData: Map<String, String>): String {
        return formData.entries.joinToString("&") { (key, value) ->
            "${URLEncoder.encode(key, UTF_8)}=${URLEncoder.encode(value, UTF_8)}"
        }
    }

    private fun createWebResponse(connection: HttpURLConnection): WebResourceResponse {
        val responseInputStream = getResponseStream(connection)

        val contentType = connection.contentType ?: CONTENT_TYPE_TEXT_HTML
        val encoding = connection.contentEncoding ?: UTF_8

        val response = WebResourceResponse(contentType, encoding, responseInputStream)

        response.setStatusCodeAndReasonPhrase(connection.responseCode, connection.responseMessage)

        return response
    }

    private fun getResponseStream(connection: HttpURLConnection): InputStream {
        val responseCode = connection.responseCode
        return if (responseCode == HttpURLConnection.HTTP_OK) {
            connection.inputStream
        } else {
            connection.errorStream
        }
    }

    private fun generateTokenEndpoint(tenant: String): String {
        return "https://login.microsoftonline.com/$tenant/oauth2/v2.0/token"
    }

    private fun generateDeviceCodeEndpoint(tenant: String): String {
        return "https://login.microsoftonline.com/$tenant/oauth2/v2.0/devicecode"
    }

    const val API_CODE2 = "/api/auth/code2"
    const val API_TOKEN2 = "/api/auth/token2"
    const val API_REFRESH2 = "/api/refresh2"

    const val HEADER_SCOPE = "x-rw-scope"
    const val HEADER_CLIENT_ID = "x-rw-client-id"
    const val HEADER_TENANT_ID = "x-rw-tenant-id"
    const val HEADER_DEVICE_CODE = "x-rw-device-code"
    const val HEADER_REFRESH_TOKEN = "x-rw-refresh-token"

    const val DEFAULT_TENANT_ID = "organizations"

    private const val UTF_8 = "UTF-8"

    private const val POST = "POST"
    private const val CONTENT_TYPE = "Content-Type"
    private const val CONTENT_TYPE_FORM_URL_ENCODED = "application/x-www-form-urlencoded"
    private const val CONTENT_TYPE_TEXT_HTML = "text/html"
    private const val STATUS_CODE_BAD_REQUEST = 400
    private const val PHRASE_BAD_REQUEST = "Bad Request"

    private const val FORM_CLIENT_ID = "client_id"
    private const val FORM_SCOPE = "scope"
    private const val FORM_GRANT_TYPE = "grant_type"
    private const val FORM_DEVICE_CODE = "device_code"
    private const val FORM_REFRESH_TOKEN = "refresh_token"

    private const val GRANT_TYPE_TOKEN = "urn:ietf:params:oauth:grant-type:device_code"
    private const val GRANT_TYPE_REFRESH = "refresh_token"

    private const val OPENID_SCOPES = "offline_access"

    val RESPONSE_400 = WebResourceResponse(
        CONTENT_TYPE_TEXT_HTML, UTF_8, STATUS_CODE_BAD_REQUEST, PHRASE_BAD_REQUEST, null, null
    )
}
