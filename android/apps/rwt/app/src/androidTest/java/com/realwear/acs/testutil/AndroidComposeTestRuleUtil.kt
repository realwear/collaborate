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
package com.realwear.acs.testutil

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertAll
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import org.junit.rules.TestRule

fun <R : TestRule, A : ComponentActivity> AndroidComposeTestRule<R, A>.assertNodeWithTextIsDisplayed(text: String) {
    this.onNodeWithText(text).assertIsDisplayed()
}

fun <R : TestRule, A : ComponentActivity> AndroidComposeTestRule<R, A>.assertNodeWithTextIsNotDisplayed(text: String) {
    this.onAllNodesWithText(text).assertCountEquals(0)
}

fun <R : TestRule, A : ComponentActivity> AndroidComposeTestRule<R, A>.assertNodeWithContentDescriptionIsNotDisplayed(
    contentDescription: String
) {
    this.onAllNodesWithContentDescription(contentDescription).assertAll(
        SemanticsMatcher("ContentDescription node is not shown") {
            !it.layoutInfo.isPlaced
        }
    )
}

fun <R : TestRule, A : ComponentActivity> AndroidComposeTestRule<R, A>.onAllNodesWithContentDescriptionDisplayedCount(
    contentDescription: String,
    count: Int
) {
    assert(
        this.onAllNodesWithContentDescription(contentDescription).fetchSemanticsNodes().count {
            it.layoutInfo.isPlaced
        } == count
    )
}

fun <R : TestRule, A : ComponentActivity> AndroidComposeTestRule<R, A>.assertNodeWithTagIsNotDisplayed(tag: String) {
    this.onAllNodesWithTag(tag).assertAll(
        SemanticsMatcher("Tag node is not shown") {
            !it.layoutInfo.isPlaced
        }
    )
}

fun <R : TestRule, A : ComponentActivity> AndroidComposeTestRule<R, A>.onNodeWithText(
    text: String,
    isClickable: Boolean
): SemanticsNodeInteraction {
    val matchingNodes = this.onAllNodesWithText(text)
        .fetchSemanticsNodes()
        .filter { it.config.contains(SemanticsActions.OnClick) == isClickable }

    assert(matchingNodes.size == 1) {
        "Expected 1 nodes with text $text and clickable=$isClickable, but found ${matchingNodes.size}"
    }

    return onNode(SemanticsMatcher("Node with text '$text' and clickable=$isClickable") {
        it.id == matchingNodes.first().id
    })
}