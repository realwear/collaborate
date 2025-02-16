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

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.rotate
import com.realwear.acs.DevicesPreview

private const val ANIMATION_DURATION = 750
private const val PAUSE_DURATION = 300

private val ROTATION_EXTREMES = Pair(-45f, 45f)
private val SIZE_MODIFIER_EXTREMES = Pair(0f, 0.50f)
private val SWEEP_ANGLE_EXTREMES = Pair(60f, 30f)

private const val BORDER_WIDTH = 0.15f

@Composable
fun IrisAnimation() {
    val infiniteTransition = rememberInfiniteTransition(label = "Iris Animation")

    val rotateAnim by infiniteTransition.animateFloat(
        initialValue = ROTATION_EXTREMES.first,
        targetValue = ROTATION_EXTREMES.second,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = ANIMATION_DURATION + 2 * PAUSE_DURATION
                ROTATION_EXTREMES.first at 0 with LinearEasing
                ROTATION_EXTREMES.first at PAUSE_DURATION with LinearEasing
                ROTATION_EXTREMES.second at ANIMATION_DURATION with LinearEasing
                ROTATION_EXTREMES.second at ANIMATION_DURATION + PAUSE_DURATION with LinearEasing
            },
            repeatMode = RepeatMode.Reverse
        ), label = "Rotation"
    )

    val shrinkAnim by infiniteTransition.animateFloat(
        initialValue = SIZE_MODIFIER_EXTREMES.first,
        targetValue = SIZE_MODIFIER_EXTREMES.second,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = ANIMATION_DURATION + 2 * PAUSE_DURATION
                SIZE_MODIFIER_EXTREMES.first at 0 with LinearEasing
                SIZE_MODIFIER_EXTREMES.first at PAUSE_DURATION with LinearEasing
                SIZE_MODIFIER_EXTREMES.second at ANIMATION_DURATION with LinearEasing
                SIZE_MODIFIER_EXTREMES.second at ANIMATION_DURATION + PAUSE_DURATION with LinearEasing
            },
            repeatMode = RepeatMode.Reverse
        ), label = "Shrink"
    )

    val sweepAnim by infiniteTransition.animateFloat(
        initialValue = SWEEP_ANGLE_EXTREMES.first,
        targetValue = SWEEP_ANGLE_EXTREMES.second,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = ANIMATION_DURATION + 2 * PAUSE_DURATION
                SWEEP_ANGLE_EXTREMES.first at 0 with LinearEasing
                SWEEP_ANGLE_EXTREMES.first at PAUSE_DURATION with LinearEasing
                SWEEP_ANGLE_EXTREMES.second at ANIMATION_DURATION with LinearEasing
                SWEEP_ANGLE_EXTREMES.second at ANIMATION_DURATION + PAUSE_DURATION with LinearEasing
            },
            repeatMode = RepeatMode.Reverse
        ), label = "Sweep"
    )

    Box(modifier = Modifier.fillMaxSize()) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val centerX = size.width / 2
            val centerY = size.height / 2
            val radius = size.minDimension / 2

            drawCircle(color = Color.Gray, radius = radius, center = Offset(centerX, centerY))

            // Rotate and draw the pie segments
            rotate(degrees = rotateAnim, pivot = Offset(centerX, centerY)) {
                for (i in 0 until 6) {
                    rotate(degrees = i * 60f, pivot = Offset(centerX, centerY)) {
                        drawPieSegment(
                            centerX,
                            centerY,
                            shrinkAnim,
                            radius - BORDER_WIDTH * radius,
                            sweepAnim,
                            Color.White
                        )
                    }
                }
            }
        }
    }
}

private fun DrawScope.drawPieSegment(
    centerX: Float,
    centerY: Float,
    sizeModifier: Float,
    radius: Float,
    sweepAngle: Float,
    color: Color
) {
    val path = Path().apply {
        moveTo(centerX + sizeModifier * radius, centerY)
        arcTo(
            rect = Rect(
                centerX - radius,
                centerY - radius,
                centerX + radius,
                centerY + radius
            ),
            startAngleDegrees = 0f,
            sweepAngleDegrees = sweepAngle,
            forceMoveTo = false
        )
        close()
    }
    drawPath(path = path, color = color)
}

@DevicesPreview
@Composable
private fun IrisAnimationPreview() {
    IrisAnimation()
}