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
package com.realwear.acs.util

import android.content.Context
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.Mock
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class UtilsTest {
    @Mock
    private lateinit var mockContext: Context

    @Before
    fun setUp() {
        mockContext = mock(Context::class.java)
        `when`(mockContext.getString(anyInt())).thenReturn(DEFAULT_MEETING_NAME)
    }

    @Test
    fun testParseMeetingName_withValidName() {
        val actual = Utils.parseMeetingName(mockContext, TEST_MEETING_NAME)
        assertEquals(TEST_MEETING_NAME, actual)
    }

    @Test
    fun testParseMeetingName_withEmptyName() {
        val actual = Utils.parseMeetingName(mockContext, EMPTY_STRING)
        assertEquals(DEFAULT_MEETING_NAME, actual)
    }

    @Test
    fun testParseMeetingName_withBlankName() {
        val actual = Utils.parseMeetingName(mockContext, BLANK_STRING)
        assertEquals(DEFAULT_MEETING_NAME, actual)
    }

    @Test
    fun testParseMeetingName_withNullName() {
        val actual = Utils.parseMeetingName(mockContext, null)
        assertEquals(DEFAULT_MEETING_NAME, actual)
    }

    @Test
    fun testParseLocalParticipantName_withValidName() {
        val actual = Utils.parseLocalParticipantName(TEST_FIRST_NAME, T1100G)
        assertEquals(TEST_FIRST_NAME, actual)
    }

    @Test
    fun testParseLocalParticipantName_withNullName() {
        val actual = Utils.parseLocalParticipantName(null, T1100G)
        assertEquals(HMT_1_USER, actual)
    }

    @Test
    fun testParseLocalParticipantName_withEmptyName() {
        val actual = Utils.parseLocalParticipantName(EMPTY_STRING, T1100G)
        assertEquals(HMT_1_USER, actual)
    }

    @Test
    fun testParseLocalParticipantName_withBlankName() {
        val actual = Utils.parseLocalParticipantName(BLANK_STRING, T1100G)
        assertEquals(HMT_1_USER, actual)
    }

    @Test
    fun testParseLocalParticipantName_withNoNameAndInvalidDeviceModel() {
        val actual = Utils.parseLocalParticipantName(EMPTY_STRING, EMPTY_STRING)
        assertEquals(REALWEAR_USER, actual)
    }

    @Test
    fun testParseLocalParticipantName_withModelT1100G() {
        val actual = Utils.parseLocalParticipantName(EMPTY_STRING, T1100G)
        assertEquals(HMT_1_USER, actual)
    }

    @Test
    fun testParseLocalParticipantName_withModelT1200G() {
        val actual = Utils.parseLocalParticipantName(EMPTY_STRING, T1200G)
        assertEquals(HMT_1_USER, actual)
    }

    @Test
    fun testParseLocalParticipantName_withModelT1100S() {
        val actual = Utils.parseLocalParticipantName(EMPTY_STRING, T1100S)
        assertEquals(HMT_1Z1_USER, actual)
    }

    @Test
    fun testParseLocalParticipantName_withModelT21S() {
        val actual = Utils.parseLocalParticipantName(EMPTY_STRING, T21S)
        assertEquals(NAVIGATOR_Z1_USER, actual)
    }

    @Test
    fun testParseLocalParticipantName_withModelT21G() {
        val actual = Utils.parseLocalParticipantName(EMPTY_STRING, T21G)
        assertEquals(NAVIGATOR_USER, actual)
    }

    @Test
    fun testParseParticipantName_withValidName() {
        val actual = Utils.parseParticipantName("$TEST_FIRST_NAME $TEST_LAST_NAME")
        assertEquals(TEST_FIRST_NAME, actual.first)
        assertEquals(TEST_LAST_NAME, actual.second)
    }

    @Test
    fun testParseParticipantName_withOnlyFirstName() {
        val actual = Utils.parseParticipantName(TEST_FIRST_NAME)
        assertEquals(TEST_FIRST_NAME, actual.first)
        assertEquals("", actual.second)
    }

    @Test
    fun testParseParticipantName_withSpaceBeforeName() {
        val actual = Utils.parseParticipantName(" $TEST_FIRST_NAME $TEST_LAST_NAME")
        assertEquals(TEST_FIRST_NAME, actual.first)
        assertEquals(TEST_LAST_NAME, actual.second)
    }

    @Test
    fun testParseParticipantName_withSpaceAfterName() {
        val actual = Utils.parseParticipantName("$TEST_FIRST_NAME $TEST_LAST_NAME ")
        assertEquals(TEST_FIRST_NAME, actual.first)
        assertEquals(TEST_LAST_NAME, actual.second)
    }

    @Test
    fun testParseParticipantName_withSpaceAroundName() {
        val actual = Utils.parseParticipantName(" $TEST_FIRST_NAME $TEST_LAST_NAME ")
        assertEquals(TEST_FIRST_NAME, actual.first)
        assertEquals(TEST_LAST_NAME, actual.second)
    }

    @Test
    fun testParseParticipantName_withEmptyString() {
        val actual = Utils.parseParticipantName("")
        assertEquals("", actual.first)
        assertEquals("", actual.second)
    }

    @Test
    fun testParseParticipantName_withJustWhiteSpace() {
        val actual = Utils.parseParticipantName("    ")
        assertEquals("", actual.first)
        assertEquals("", actual.second)
    }

    @Test
    fun testGenerateSiteUrl_withSimpleUrl() {
        val actual = Utils.generateSiteUrl("https://www.realwear.com")
        assertEquals(generateExpectedSiteUrl(ENCODED_REALWEAR), actual)
    }

    @Test
    fun testGenerateSiteUrl_withComplexUrl() {
        val actual = Utils.generateSiteUrl("https://www.realwear.com?foo=bar&baz=qux")
        assertEquals(generateExpectedSiteUrl(ENCODED_REALWEAR_COMPLEX), actual)
    }

    @Test
    fun testGenerateSiteUrl_withBlankUrl() {
        val actual = Utils.generateSiteUrl("")
        assertEquals("${Utils.LOCAL_URL}?redirectUrl=&pingUrl=", actual)
    }

    private fun generateExpectedSiteUrl(encodedUrl: String): String {
        return "${Utils.LOCAL_URL}?redirectUrl=${encodedUrl}&pingUrl=${encodedUrl}"
    }

    companion object {
        private const val DEFAULT_MEETING_NAME = "Meeting Name"
        private const val TEST_MEETING_NAME = "Test Meeting Name"

        private const val EMPTY_STRING = ""
        private const val BLANK_STRING = "    "

        private const val HMT_1_USER = "HMT-1 User"
        private const val HMT_1Z1_USER = "HMT-1Z1 User"
        private const val NAVIGATOR_Z1_USER = "Navigator-Z1 User"
        private const val NAVIGATOR_USER = "Navigator User"
        private const val REALWEAR_USER = "RealWear User"

        private const val T1100G = "T1100G"
        private const val T1200G = "T1200G"
        private const val T1100S = "T1100S"
        private const val T21S = "T21S"
        private const val T21G = "T21G"

        private const val TEST_FIRST_NAME = "John"
        private const val TEST_LAST_NAME = "Doe"

        private const val ENCODED_REALWEAR = "https%3A%2F%2Fwww.realwear.com"
        private const val ENCODED_REALWEAR_COMPLEX = "${ENCODED_REALWEAR}%3Ffoo%3Dbar%26baz%3Dqux"
    }
}