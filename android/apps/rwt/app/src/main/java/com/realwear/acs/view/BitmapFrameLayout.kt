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
package com.realwear.acs.view

import android.content.Context
import android.graphics.drawable.Animatable2
import android.graphics.drawable.AnimatedVectorDrawable
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.view.Gravity
import android.widget.FrameLayout
import android.widget.ImageView
import com.realwear.acs.R
import com.realwear.acs.cameracapturer.repository.ICameraRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class BitmapFrameLayout @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    private val animatedVectorDrawable = context.getDrawable(R.drawable.thermal_logo_anim) as AnimatedVectorDrawable

    private val imageView: ImageView = ImageView(context).apply {
        layoutParams = LOADING_LAYOUT_PARAMS
        scaleType = ImageView.ScaleType.CENTER_INSIDE
    }

    private var cameraRepository: ICameraRepository? = null
    private var scope: CoroutineScope? = null

    init {
        addView(imageView)

        animatedVectorDrawable.registerAnimationCallback(object : Animatable2.AnimationCallback() {
            override fun onAnimationEnd(drawable: Drawable?) {
                super.onAnimationEnd(drawable)
                animatedVectorDrawable.start()
            }
        })
    }

    fun setCameraRepository(cameraRepository: ICameraRepository) {
        this.cameraRepository = cameraRepository
    }

    private fun observeBitmaps() {
        if (cameraRepository?.isThermalCamera == true) {
            imageView.layoutParams = LOADING_LAYOUT_PARAMS
            imageView.scaleType = ImageView.ScaleType.CENTER_INSIDE
            imageView.setImageDrawable(animatedVectorDrawable)
            animatedVectorDrawable.start()
        }

        var isFirstFrame = true

        cameraRepository?.let {
            scope?.launch {
                it.framesFlow.collectLatest { bitmap ->
                    if (isFirstFrame) {
                        isFirstFrame = false
                        imageView.layoutParams = CAMERA_LAYOUT_PARAMS
                        imageView.scaleType = ImageView.ScaleType.CENTER_CROP
                        animatedVectorDrawable.stop()
                    }
                    imageView.setImageBitmap(bitmap)
                }
            }
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()

        scope = CoroutineScope(Dispatchers.Main + Job())
        observeBitmaps()
    }

    override fun onDetachedFromWindow() {
        animatedVectorDrawable.stop()

        scope?.cancel()
        scope = null

        super.onDetachedFromWindow()
    }

    companion object {
        private const val ANIMATION_MARGIN = 18

        private val LOADING_LAYOUT_PARAMS = LayoutParams(
            LayoutParams.WRAP_CONTENT,
            LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.CENTER
            setMargins(ANIMATION_MARGIN, ANIMATION_MARGIN, ANIMATION_MARGIN, ANIMATION_MARGIN)
        }
        private val CAMERA_LAYOUT_PARAMS = LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT
        )
    }
}