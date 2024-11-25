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
package com.realwear.acs.hilt

import com.realwear.acs.dependency.IEisManager
import com.realwear.acs.dependency.IOutgoingVideoStream
import com.realwear.acs.dependency.OutgoingVideoStreamWrapper
import com.realwear.acs.hilt.AppModule.MainCameraOutgoingVideoStream
import com.realwear.acs.hilt.AppModule.ThermalOutgoingVideoStream
import com.realwear.acs.model.VideoStreamFormat
import com.realwear.acs.model.VideoStreamFormat.Companion.PixelFormat
import com.realwear.acs.model.VideoStreamFormat.Companion.Resolution
import com.realwear.acs.repository.AcsRepository
import com.realwear.acs.repository.IAcsRepository
import com.realwear.acs.repository.MainCameraRepository
import com.realwear.acs.thermal.repository.ThermalRepository
import com.realwear.acs.util.thermal.VideoFrameSender.Companion.RGBA_CHANNELS
import com.realwear.acs.view.BitmapFrameLayout
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
object ThermalModule {
    @Provides
    fun provideThermalRepository() = ThermalRepository()

    @ThermalOutgoingVideoStream
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
        @MainCameraOutgoingVideoStream mainCameraOutgoingVideoStream: IOutgoingVideoStream,
        @ThermalOutgoingVideoStream thermalOutgoingVideoStream: IOutgoingVideoStream,
        bitmapFrameLayout: BitmapFrameLayout,
        eisManager: IEisManager
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
