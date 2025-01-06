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
package com.realwear.acs.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import com.microsoft.fluentui.theme.token.AliasTokens
import com.microsoft.fluentui.theme.token.ControlTokens
import com.microsoft.fluentui.theme.token.FluentAliasTokens
import com.microsoft.fluentui.theme.token.FluentColor
import com.microsoft.fluentui.theme.token.IControlToken
import com.microsoft.fluentui.theme.token.IControlTokens
import com.microsoft.fluentui.theme.token.IType
import com.microsoft.fluentui.theme.token.StateBrush
import com.microsoft.fluentui.theme.token.StateColor
import com.microsoft.fluentui.theme.token.TokenSet
import com.microsoft.fluentui.theme.token.controlTokens.AvatarTokens
import com.microsoft.fluentui.theme.token.controlTokens.ButtonInfo
import com.microsoft.fluentui.theme.token.controlTokens.ButtonTokens
import com.microsoft.fluentui.tokenized.controls.Button
import com.realwear.acs.DevicesPreview
import com.realwear.acs.util.PreviewUtils.previewMeetingViewModel
import com.realwear.acs.view.ParticipantOverlay
import timber.log.Timber

object TeamsFluentTheme {
    val controlTokens = object : IControlTokens {
        override val tokens: TokenSet<IType, IControlToken>
            get() = TokenSet { token ->
                when (token) {
                    ControlTokens.ControlType.ButtonControlType -> buttonTokens
                    ControlTokens.ControlType.AvatarControlType -> AvatarTokens()
                    else -> {
                        Timber.w("Missing control token: $token")
                        throw IllegalArgumentException("Missing control token: $token")
                    }
                }
            }
    }

    private val aliasTokens = object : AliasTokens() {
        override val brandBackgroundColor: TokenSet<FluentAliasTokens.BrandBackgroundColorTokens, FluentColor> by lazy {
            TokenSet { token ->
                when (token) {
                    FluentAliasTokens.BrandBackgroundColorTokens.BrandBackground1 -> FluentColor(
                        light = TeamsFluentLight.colorBrandBackground1,
                        dark = TeamsFluentDark.colorBrandBackground1
                    )

                    else -> throw IllegalArgumentException("Missing background color: $token")
                }
            }
        }

        override val brandForegroundColor: TokenSet<FluentAliasTokens.BrandForegroundColorTokens, FluentColor> by lazy {
            TokenSet { token ->
                when (token) {
                    FluentAliasTokens.BrandForegroundColorTokens.BrandForeground1 -> FluentColor(
                        light = TeamsFluentLight.colorNeutralForegroundOnBrand,
                        dark = TeamsFluentDark.colorNeutralForegroundOnBrand
                    )

                    FluentAliasTokens.BrandForegroundColorTokens.BrandForegroundDisabled1 -> FluentColor(
                        light = TeamsFluentLight.colorNeutralForegroundDisabled,
                        dark = TeamsFluentDark.colorNeutralForegroundDisabled
                    )

                    else -> throw IllegalArgumentException("Missing foreground color: $token")
                }
            }
        }
    }

    private val buttonTokens = object : ButtonTokens() {
        @Composable
        override fun backgroundBrush(buttonInfo: ButtonInfo): StateBrush {
            return StateBrush(
                rest = SolidColor(aliasTokens.brandBackgroundColor[FluentAliasTokens.BrandBackgroundColorTokens.BrandBackground1].value()),
                pressed = SolidColor(aliasTokens.brandBackgroundColor[FluentAliasTokens.BrandBackgroundColorTokens.BrandBackground1].value()),
                disabled = SolidColor(aliasTokens.brandBackgroundColor[FluentAliasTokens.BrandBackgroundColorTokens.BrandBackground1].value())
            )
        }

        @Composable
        override fun textColor(buttonInfo: ButtonInfo): StateColor {
            return StateColor(
                rest = aliasTokens.brandForegroundColor[FluentAliasTokens.BrandForegroundColorTokens.BrandForeground1].value(),
                pressed = aliasTokens.brandForegroundColor[FluentAliasTokens.BrandForegroundColorTokens.BrandForeground1].value(),
                disabled = aliasTokens.brandForegroundColor[FluentAliasTokens.BrandForegroundColorTokens.BrandForegroundDisabled1].value()
            )
        }
    }
}

@DevicesPreview
@Composable
private fun ThemePreview() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        TeamsForRealWearTheme(darkTheme = false, dynamicColor = false) {
            Box(
                modifier = Modifier
                    .background(color = MaterialTheme.colorScheme.background)
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                ParticipantOverlay(previewMeetingViewModel())

                Column {
                    Button(text = "Hello World!", onClick = {})
                    Button(text = "Disabled", onClick = {}, enabled = false)
                }
            }
        }

        TeamsForRealWearTheme(darkTheme = true, dynamicColor = false) {
            Box(
                modifier = Modifier
                    .background(color = MaterialTheme.colorScheme.background)
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                ParticipantOverlay(previewMeetingViewModel())

                Column {
                    Button(text = "Hello World!", onClick = {})
                    Button(text = "Disabled", onClick = {}, enabled = false)
                }
            }
        }
    }
}