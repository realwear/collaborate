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
package com.realwear.webapp_faultreporter.utils

import android.util.Log
import androidx.activity.ComponentActivity
import com.google.gson.Gson
import io.ktor.application.call
import io.ktor.application.install
import io.ktor.features.CORS
import io.ktor.features.ContentNegotiation
import io.ktor.http.HttpMethod
import io.ktor.http.cio.websocket.Frame
import io.ktor.http.cio.websocket.readText
import io.ktor.response.respond
import io.ktor.routing.get
import io.ktor.serialization.*
import io.ktor.routing.routing
import io.ktor.server.engine.ApplicationEngine
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.websocket.WebSockets
import io.ktor.websocket.webSocket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.consumeEach
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.net.ServerSocket
import java.net.URL

class LocalWebServer(
  private val activity: ComponentActivity,
  private val photoCaptureService: PhotoCaptureService,
  private val siteUrl: String
) {
  private var server: ApplicationEngine? = null

  fun start(scope: CoroutineScope) {
    server = embeddedServer(Netty, port = PORT, host = HOST) {
      install(WebSockets)

      install(ContentNegotiation) {
        json()
      }

      install(CORS) {
        method(HttpMethod.Get)

        val url = URL(siteUrl)
        val host = url.host
        val port = if (url.port != -1) ":${url.port}" else ""

        var hostToAllow = "$host$port"

        Log.d(TAG, "Allowing host: $hostToAllow")

        host(hostToAllow, schemes = listOf(url.protocol))
      }

      routing {
        webSocket(path = "/takephoto") {
          incoming.consumeEach { frame ->
            if (frame is Frame.Text) {
              val text = frame.readText()
              if (text == "CAPTURE") {
                scope.launch {
                  Log.i(TAG, "Capturing photo...")
                  photoCaptureService.capturePhoto()?.let {
                    val inputStream = activity.contentResolver.openInputStream(it)
                    val byteArrayOutputStream = ByteArrayOutputStream()
                    inputStream?.copyTo(byteArrayOutputStream)
                    val imageBytes = byteArrayOutputStream.toByteArray()
                    send(Frame.Binary(true, imageBytes))
                    activity.contentResolver.delete(it, null, null)
                  }
                  Log.i(TAG, "Captured photo")
                }
              }
            }
          }
        }

        get(path = "/deviceInfo") {
          // Create an object containing Build.MANUFACTURER, Build.MODEL, Build.VERSION.RELEASE, and Build.VERSION.SDK_INT
          val deviceInfo = mapOf(
            "manufacturer" to android.os.Build.MANUFACTURER,
            "model" to android.os.Build.MODEL,
            "release" to android.os.Build.VERSION.RELEASE,
            "sdkInt" to android.os.Build.VERSION.SDK_INT,
            "firmwareVersion" to android.os.Build.DISPLAY
          )

          try {
            val gson = Gson()

            // Log the device info
            // Response as a JSON
            call.respond(gson.toJson(deviceInfo))
          } catch (e: Exception) {
            // Log any exceptions
            Log.e(TAG, "Error getting device info", e)
          }
        }
      }
    }.start(wait = false)
  }

  fun stop() {
    server?.stop(1000, 1000)
  }

  companion object {
    const val TAG = "LocalWebServer"
    const val HOST = "0.0.0.0"

    var PORT = getRandomAvailablePort()

    private fun getRandomAvailablePort(): Int {
      ServerSocket(0).use { socket ->
        return socket.localPort
      }
    }
  }
}