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
package com.realwear.acs.viewmodel

import android.app.Activity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.realwear.acs.repository.IPermissionsRepository
import com.realwear.acs.repository.PermissionsRepository.Companion.REQUIRED_PERMISSIONS
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class PermissionsRefusedViewModel @Inject constructor(
    private val permissionsRepository: IPermissionsRepository
) : IPermissionsRefusedViewModel() {
    private val _isPermissionsPermanentlyDenied = MutableLiveData(false)
    override val isPermissionsPermanentlyDenied: LiveData<Boolean> = _isPermissionsPermanentlyDenied

    private val _requestPermissionsEvent = MutableSharedFlow<Array<String>>()
    val requestPermissionsEvent: SharedFlow<Array<String>> get() = _requestPermissionsEvent

    override fun arePermissionsPermanentlyDenied(activity: Activity): Boolean {
        return permissionsRepository.havePermissionsBeenDenied(activity, REQUIRED_PERMISSIONS)
    }

    override fun requestPermissions() {
        viewModelScope.launch { _requestPermissionsEvent.emit(REQUIRED_PERMISSIONS) }
    }

    override fun onStateChanged(source: LifecycleOwner, event: Lifecycle.Event) {
        if (event == Lifecycle.Event.ON_RESUME) {
            _isPermissionsPermanentlyDenied.value = arePermissionsPermanentlyDenied(source as Activity)

            if (permissionsRepository.hasPermissions(source as Activity, REQUIRED_PERMISSIONS)) {
                Timber.i("Permissions seem fixed. Requesting required permissions again.")
                requestPermissions()
            }
        }
    }
}

abstract class IPermissionsRefusedViewModel : ViewModel(), LifecycleEventObserver {
    abstract val isPermissionsPermanentlyDenied: LiveData<Boolean>

    abstract fun arePermissionsPermanentlyDenied(activity: Activity): Boolean
    abstract fun requestPermissions()
}