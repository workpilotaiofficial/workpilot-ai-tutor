'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  getStoredAuthObject,
  getStoredPermissionKeys,
  getStoredPermissions,
} from '@/lib/api/session-storage'
import {
  AUTH_SESSION_CHANGE_EVENT,
  EMPTY_SESSION_PERMISSIONS,
  hasAllPermissions,
  hasAnyPermissions,
  hasPermission,
  type SessionPermissions,
} from '@/lib/rbac/permissions'

function readCurrentSessionState() {
  const storedAuth = getStoredAuthObject()

  return {
    isAuthenticated: Boolean(storedAuth?.access_token),
    role: storedAuth?.user_role ?? null,
    displayName: storedAuth?.user_display_name ?? null,
    permissions: storedAuth?.user_permissions ?? getStoredPermissions(),
    permissionKeys: storedAuth?.flattened_permission_keys ?? getStoredPermissionKeys(),
  }
}

export function useRbac() {
  const [sessionState, setSessionState] = useState(readCurrentSessionState)
  const [isReady, setIsReady] = useState(typeof window !== 'undefined')

  useEffect(() => {
    const syncSessionState = () => {
      setSessionState(readCurrentSessionState())
      setIsReady(true)
    }

    syncSessionState()

    window.addEventListener('storage', syncSessionState)
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncSessionState)

    return () => {
      window.removeEventListener('storage', syncSessionState)
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncSessionState)
    }
  }, [])

  const permissionSet = useMemo(() => new Set(sessionState.permissionKeys), [sessionState.permissionKeys])

  return {
    isReady,
    isAuthenticated: sessionState.isAuthenticated,
    role: sessionState.role,
    displayName: sessionState.displayName,
    permissions: sessionState.permissions ?? EMPTY_SESSION_PERMISSIONS,
    permissionKeys: sessionState.permissionKeys,
    permissionSet,
    can: (permissionKey: string) => hasPermission(permissionSet, permissionKey),
    canAny: (permissionKeys: string[]) => hasAnyPermissions(permissionSet, permissionKeys),
    canAll: (permissionKeys: string[]) => hasAllPermissions(permissionSet, permissionKeys),
  }
}

export type UseRbacResult = ReturnType<typeof useRbac>
export type { SessionPermissions }
