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
