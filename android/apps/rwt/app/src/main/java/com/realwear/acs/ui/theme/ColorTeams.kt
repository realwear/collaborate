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