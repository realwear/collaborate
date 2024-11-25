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
import { makeEnvironmentProviders } from "@angular/core";
import { SpeechConfig, SpeechTranslationConfig } from "microsoft-cognitiveservices-speech-sdk";

export interface AzureSpeechAuthConfig {
    subscriptionKey: string;
    region: string;
}

export function provideAzureAuthConfig(config: AzureSpeechAuthConfig) {
    return makeEnvironmentProviders([
        {
            provide: SpeechConfig,
            useFactory: () => SpeechConfig.fromSubscription(config.subscriptionKey, config.region)
        },
        {
            provide: SpeechTranslationConfig,
            useFactory: () => SpeechTranslationConfig.fromSubscription(config.subscriptionKey, config.region)
        }
    ])
}