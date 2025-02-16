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
package com.realwear.acs.view.composable.loading

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.unit.dp
import com.microsoft.fluentui.theme.token.FluentGlobalTokens
import com.realwear.acs.DevicesPreview
import com.realwear.acs.R
import kotlin.random.Random

private const val BASE_ANIMATION_DURATION = 3000
private const val BASE_DELAY_DURATION = 1000
private const val THICKNESS = 30

@Composable
fun LoadingIcon(
    modifier: Modifier = Modifier,
    icon: Int,
    animate: Boolean,
    color: Color = FluentGlobalTokens.SharedColorSets.Magenta.shade10
) {
    val infiniteTransition = rememberInfiniteTransition(label = "Infinite Transition")

    val ripple1 = infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = BASE_ANIMATION_DURATION + Random.nextInt(-500, 500),
                easing = FastOutSlowInEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "Ripple 1"
    )

    val ripple2 = infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = BASE_ANIMATION_DURATION + Random.nextInt(-500, 500),
                delayMillis = BASE_DELAY_DURATION + Random.nextInt(-200, 200),
                easing = FastOutSlowInEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "Ripple 2"
    )

    val ripple3 = infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = BASE_ANIMATION_DURATION + Random.nextInt(-500, 500),
                delayMillis = BASE_DELAY_DURATION * 2 + Random.nextInt(-200, 200),
                easing = FastOutSlowInEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "Ripple 3"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(THICKNESS.dp),
        contentAlignment = Alignment.Center
    ) {
        val vector = ImageVector.vectorResource(id = icon)
        val painter = rememberVectorPainter(image = vector)

        Canvas(modifier = modifier.fillMaxSize()) {
            val imageSize = size.minDimension / 3

            translate(left = center.x - imageSize / 2, top = center.y - imageSize / 2) {
                with(painter) {
                    draw(size = Size(imageSize, imageSize))
                }
            }
        }

        if (animate) {
            Canvas(modifier = modifier.fillMaxSize().testTag("LoadingAnimation")) {
                drawCircle(
                    color = color,
                    radius = size.minDimension / 6,
                    center = center,
                    style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round)
                )

                drawCircle(
                    color = color.copy(alpha = 1f - ripple1.value),
                    radius = size.minDimension / 6 + ripple1.value * size.minDimension / 3,
                    center = center,
                    style = Stroke(width = THICKNESS.dp.toPx(), cap = StrokeCap.Round)
                )

                drawCircle(
                    color = color.copy(alpha = 1f - ripple2.value),
                    radius = size.minDimension / 6 + ripple2.value * size.minDimension / 3,
                    center = center,
                    style = Stroke(width = THICKNESS.dp.toPx(), cap = StrokeCap.Round)
                )

                drawCircle(
                    color = color.copy(alpha = 1f - ripple3.value),
                    radius = size.minDimension / 6 + ripple3.value * size.minDimension / 3,
                    center = center,
                    style = Stroke(width = THICKNESS.dp.toPx(), cap = StrokeCap.Round)
                )

                drawCircle(
                    color = color.copy(),
                    radius = size.minDimension / 6,
                    center = center,
                    style = Stroke(width = THICKNESS.dp.toPx(), cap = StrokeCap.Round)
                )
            }
        }
    }
}

@DevicesPreview
@Composable
fun LoadingIconPreviewAnimated() {
    LoadingIcon(icon = R.drawable.supervised_user_circle_24dp, animate = true)
}

@DevicesPreview
@Composable
fun LoadingIconPreviewStatic() {
    LoadingIcon(icon = R.drawable.error_24px, animate = false)
}