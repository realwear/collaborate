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

import android.app.Application
import android.content.Context
import android.view.WindowManager
import com.realwear.acs.dependency.ApplicationWrapper
import com.realwear.acs.dependency.CallClientWrapper
import com.realwear.acs.dependency.EisManager
import com.realwear.acs.dependency.IApplication
import com.realwear.acs.dependency.ICallClient
import com.realwear.acs.dependency.IEisManager
import com.realwear.acs.dependency.IOutgoingVideoStream
import com.realwear.acs.dependency.OutgoingVideoStreamWrapper
import com.realwear.acs.model.VideoStreamFormat
import com.realwear.acs.model.VideoStreamFormat.Companion.PixelFormat
import com.realwear.acs.model.VideoStreamFormat.Companion.Resolution
import com.realwear.acs.repository.IPermissionsRepository
import com.realwear.acs.repository.MainCameraRepository
import com.realwear.acs.repository.PermissionsRepository
import com.realwear.acs.util.thermal.VideoFrameSender.Companion.RGBA_CHANNELS
import com.realwear.acs.view.BitmapFrameLayout
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import javax.inject.Qualifier
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Qualifier
    @Retention(AnnotationRetention.BINARY)
    annotation class IoDispatcher

    @IoDispatcher
    @Provides
    @Singleton
    fun provideIoDispatcher(): CoroutineDispatcher = Dispatchers.IO

    @Qualifier
    @Retention(AnnotationRetention.BINARY)
    annotation class MainDispatcher

    @MainDispatcher
    @Provides
    @Singleton
    fun provideMainDispatcher(): CoroutineDispatcher = Dispatchers.Main

    @Provides
    fun provideCallClient(): ICallClient = CallClientWrapper()

    @Provides
    @Singleton
    fun provideWindowManager(appContext: Application): WindowManager {
        return appContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    }

    @Provides
    fun provideApplication(appContext: Application): IApplication {
        return ApplicationWrapper(appContext)
    }

    @Provides
    fun provideMainCameraRepository(appContext: Application, windowManager: WindowManager) =
        MainCameraRepository(appContext, windowManager)

    @Qualifier
    @Retention(AnnotationRetention.BINARY)
    annotation class ThermalOutgoingVideoStream

    @Qualifier
    @Retention(AnnotationRetention.BINARY)
    annotation class MainCameraOutgoingVideoStream

    @MainCameraOutgoingVideoStream
    @Provides
    fun provideMainCameraOutgoingVideoStream(): IOutgoingVideoStream = OutgoingVideoStreamWrapper(
        listOf(
            VideoStreamFormat(
                resolution = Resolution.P720,
                pixelFormat = PixelFormat.RGBA,
                framesPerSecond = MainCameraRepository.FPS.toFloat(),
                stride1 = 1280 * RGBA_CHANNELS
            )
        )
    )

    @Provides
    fun providePermissionsRepository(): IPermissionsRepository = PermissionsRepository()

    @Provides
    fun provideBitmapFrameLayout(appContext: Application): BitmapFrameLayout = BitmapFrameLayout(appContext)

    @Provides
    fun provideEisManager(): IEisManager = EisManager()
}
