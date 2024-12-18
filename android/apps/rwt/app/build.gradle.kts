plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "com.realwear.acs"
    compileSdk = 34

    flavorDimensions += "environment"

    defaultConfig {
        applicationId = "com.realwear.acs"
        minSdk = 29
        targetSdk = 34
        versionCode = 4
        versionName = "1.2.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        val siteUrl = project.findProperty("SITE_URL")?.toString() ?: "http://localhost:4300"
        buildConfigField("String", "SITE_URL", "\"$siteUrl\"")

        project.findProperty("DATADOG_CLIENT_TOKEN")?.toString().let {
            buildConfigField("String", "DATADOG_CLIENT_TOKEN", "\"$it\"")
        }

        ndk {
            abiFilters.add("arm64-v8a")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        compose = true
        buildConfig = true // Ensure buildConfig is enabled
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.1"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
        jniLibs {
            // Thermal and ACS libs both contain libc++_shared.so which conflict
            pickFirsts += "lib/arm64-v8a/libc++_shared.so"
        }
    }
    productFlavors {
        create("standard") {
            dimension = "environment"
        }
        create("thermal") {
            dimension = "environment"
        }
    }
}

dependencies {
    var lifecycleVersion by extra("2.7.0")
    var fluentVersion by extra("0.2.10")
    var datadogVersion by extra("2.11.0")
    var composeVersion by extra("1.4.3")
    var material3Version by extra("1.1.1")
    var cameraXVersion by extra("1.3.4")

    var mockitoVersion by extra("5.0.0")
    var kotlinTestVersion by extra("1.7.3")

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:$lifecycleVersion")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:$lifecycleVersion")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation(platform("androidx.compose:compose-bom:2023.08.00"))

    implementation("com.google.code.gson:gson:2.8.8")

    implementation("androidx.compose.ui:ui:$composeVersion")
    implementation("androidx.compose.ui:ui-graphics:$composeVersion")
    implementation("androidx.compose.ui:ui-tooling-preview:$composeVersion")
    implementation("androidx.compose.runtime:runtime-livedata:$composeVersion")

    implementation("androidx.compose.material3:material3:$material3Version")

    implementation("androidx.webkit:webkit:1.10.0")

    implementation("com.azure.android:azure-communication-calling:2.9.0")

    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-compiler:2.50")

    implementation("com.jakewharton.timber:timber:5.0.1")

    implementation(project(":cameracapturer"))

    "thermalImplementation"(project(":thermal"))

    implementation("com.microsoft.fluentui:FluentUIAndroid:$fluentVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.5.1")

    implementation("com.datadoghq:dd-sdk-android-logs:$datadogVersion")
    implementation("com.datadoghq:dd-sdk-android-timber:$datadogVersion")

    implementation("androidx.camera:camera-core:$cameraXVersion")
    implementation("androidx.camera:camera-camera2:$cameraXVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraXVersion")
    implementation("androidx.camera:camera-video:$cameraXVersion")
    implementation("androidx.camera:camera-view:$cameraXVersion")
    implementation("androidx.camera:camera-extensions:$cameraXVersion")

    testImplementation("junit:junit:4.13.2")
    testImplementation("androidx.test.ext:junit-ktx:1.2.1")
    testImplementation("org.mockito.kotlin:mockito-kotlin:$mockitoVersion")

    testImplementation("androidx.arch.core:core-testing:2.2.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$kotlinTestVersion")
    testImplementation("org.jetbrains.kotlin:kotlin-test:$kotlinTestVersion")

    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2023.08.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:$composeVersion")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
