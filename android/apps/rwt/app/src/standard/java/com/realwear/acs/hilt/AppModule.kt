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
package com.realwear.acs.hilt

import com.realwear.acs.dependency.EisManager
import com.realwear.acs.dependency.IOutgoingVideoStream
import com.realwear.acs.dependency.OutgoingVideoStreamWrapper
import com.realwear.acs.model.VideoStreamFormat
import com.realwear.acs.model.VideoStreamFormat.Companion.PixelFormat
import com.realwear.acs.model.VideoStreamFormat.Companion.Resolution
import com.realwear.acs.repository.AcsRepository
import com.realwear.acs.repository.IAcsRepository
import com.realwear.acs.repository.MainCameraRepository
import com.realwear.acs.repository.ThermalRepository
import com.realwear.acs.util.thermal.VideoFrameSender.Companion.RGBA_CHANNELS
import com.realwear.acs.view.BitmapFrameLayout
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
object StandardModule {
    @Provides
    fun provideThermalRepository() = ThermalRepository()

    @AppModule.ThermalOutgoingVideoStream
    @Provides
    fun provideThermalOutgoingVideoStream(): IOutgoingVideoStream = OutgoingVideoStreamWrapper(
        listOf(
            VideoStreamFormat(
                resolution = Resolution.P720,
                pixelFormat = PixelFormat.RGBA,
                framesPerSecond = ThermalRepository.FPS.toFloat(),
                stride1 = 1280 * RGBA_CHANNELS
            )
        )
    )

    @Provides
    fun provideAcsRepository(
        mainCameraRepository: MainCameraRepository,
        thermalRepository: ThermalRepository,
        @AppModule.MainCameraOutgoingVideoStream mainCameraOutgoingVideoStream: IOutgoingVideoStream,
        @AppModule.ThermalOutgoingVideoStream thermalOutgoingVideoStream: IOutgoingVideoStream,
        bitmapFrameLayout: BitmapFrameLayout,
        eisManager: EisManager
    ): IAcsRepository =
        AcsRepository(
            mainCameraRepository,
            thermalRepository,
            mainCameraOutgoingVideoStream,
            thermalOutgoingVideoStream,
            bitmapFrameLayout,
            eisManager
        )
}
