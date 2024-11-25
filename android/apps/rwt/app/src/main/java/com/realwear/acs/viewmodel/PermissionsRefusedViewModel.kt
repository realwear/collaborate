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