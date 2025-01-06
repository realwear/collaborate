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