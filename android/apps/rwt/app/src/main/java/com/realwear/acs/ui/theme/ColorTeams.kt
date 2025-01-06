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

import androidx.compose.ui.graphics.Color

/**
 * Colors for the Teams theme.
 * https://react.fluentui.dev/?path=/docs/theme-colors--page
 */
interface TeamsFluent {
    val colorNeutralBackground1: Color
    val colorBrandBackground1: Color
    val colorNeutralForegroundOnBrand: Color
    val colorNeutralForegroundDisabled: Color
}

object TeamsFluentLight : TeamsFluent {
    override val colorNeutralBackground1 = Color(0xffffffff)

    override val colorBrandBackground1 = Color(0xff5b5fc7)
    override val colorNeutralForegroundOnBrand = Color(0xffffffff)
    override val colorNeutralForegroundDisabled = Color(0xffbdbdbd)
}

object TeamsFluentDark : TeamsFluent {
    override val colorNeutralBackground1 = Color(0xff292929)

    override val colorBrandBackground1 = Color(0xff4f52b2)
    override val colorNeutralForegroundOnBrand = Color(0xffffffff)
    override val colorNeutralForegroundDisabled = Color(0xffbdbdbd)
}