import {
  AUTH_SESSION_CHANGE_EVENT,
  EMPTY_SESSION_PERMISSIONS,
  flattenPermissionKeys,
  hasAllPermissions,
  hasAnyPermissions,
  hasPermission,
  normalizeSessionPermissions,
  type SessionPermissions,
} from '@/lib/rbac/permissions'

const AUTH_SESSION_STORAGE_KEY = 'ai_tutora_auth_session'
const FIREBASE_STORAGE_KEY_PREFIX = 'firebase:'
const ACCESS_TOKEN_EXPIRY_LEEWAY_MS = 30_000

export type StoredAuthObject = {
  token_type: string
  access_token: string
  expires_at: string
  refresh_token: string
  refresh_expires_at: string
  user_role?: string
  user_display_name?: string
  user_permissions?: SessionPermissions
  flattened_permission_keys?: string[]
}

const isBrowser = () => typeof window !== 'undefined'

function dispatchAuthSessionChange() {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CHANGE_EVENT))
}

function normalizeStoredAuthObject(auth: StoredAuthObject): StoredAuthObject {
  const normalizedPermissions = auth.user_permissions
    ? normalizeSessionPermissions(auth.user_permissions)
    : EMPTY_SESSION_PERMISSIONS
  const flattenedPermissionKeys = flattenPermissionKeys(normalizedPermissions)

  return {
    ...auth,
    user_permissions: normalizedPermissions,
    flattened_permission_keys:
      flattenedPermissionKeys.length > 0
        ? flattenedPermissionKeys
        : Array.isArray(auth.flattened_permission_keys)
          ? Array.from(
              new Set(
                auth.flattened_permission_keys.filter(
                  (permissionKey): permissionKey is string =>
                    typeof permissionKey === 'string' && permissionKey.trim().length > 0,
                ),
              ),
            )
          : [],
  }
}

export function saveAuthObject(auth: StoredAuthObject) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(normalizeStoredAuthObject(auth)))
  dispatchAuthSessionChange()
}

export function getStoredAuthObject(): StoredAuthObject | null {
  if (!isBrowser()) {
    return null
  }

  const rawValue = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<StoredAuthObject>

    if (
      typeof parsedValue?.access_token !== 'string' ||
      typeof parsedValue?.token_type !== 'string' ||
      typeof parsedValue?.expires_at !== 'string' ||
      typeof parsedValue?.refresh_token !== 'string' ||
      typeof parsedValue?.refresh_expires_at !== 'string'
    ) {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
      return null
    }

    const normalizedPermissions = normalizeSessionPermissions(parsedValue.user_permissions)
    const permissionKeys = flattenPermissionKeys(normalizedPermissions)

    return {
      token_type: parsedValue.token_type,
      access_token: parsedValue.access_token,
      expires_at: parsedValue.expires_at,
      refresh_token: parsedValue.refresh_token,
      refresh_expires_at: parsedValue.refresh_expires_at,
      user_role: typeof parsedValue.user_role === 'string' ? parsedValue.user_role : undefined,
      user_display_name: typeof parsedValue.user_display_name === 'string' ? parsedValue.user_display_name : undefined,
      user_permissions: normalizedPermissions,
      flattened_permission_keys:
        permissionKeys.length > 0
          ? permissionKeys
          : Array.isArray(parsedValue.flattened_permission_keys)
            ? Array.from(
                new Set(
                  parsedValue.flattened_permission_keys.filter(
                    (permissionKey): permissionKey is string =>
                      typeof permissionKey === 'string' && permissionKey.trim().length > 0,
                  ),
                ),
              )
            : [],
    }
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    return null
  }
}

export function getStoredAccessToken() {
  return getStoredAuthObject()?.access_token ?? null
}

function parseAuthTimestamp(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

export function isAuthTokenExpired(expiresAt: string, leewayMs = ACCESS_TOKEN_EXPIRY_LEEWAY_MS) {
  const expiresAtTimestamp = parseAuthTimestamp(expiresAt)

  if (expiresAtTimestamp === null) {
    return true
  }

  return expiresAtTimestamp - leewayMs <= Date.now()
}

export function isStoredAccessTokenExpired() {
  const storedAuth = getStoredAuthObject()

  if (!storedAuth?.access_token) {
    return true
  }

  return isAuthTokenExpired(storedAuth.expires_at)
}

export function isStoredRefreshTokenUsable() {
  const storedAuth = getStoredAuthObject()

  if (!storedAuth?.refresh_token) {
    return false
  }

  return !isAuthTokenExpired(storedAuth.refresh_expires_at, 0)
}

export function replaceStoredAuthObject(auth: StoredAuthObject) {
  const currentAuth = getStoredAuthObject()
  saveAuthObject({
    ...auth,
    user_role: auth.user_role ?? currentAuth?.user_role,
    user_display_name: auth.user_display_name ?? currentAuth?.user_display_name,
    user_permissions: auth.user_permissions ?? currentAuth?.user_permissions,
    flattened_permission_keys: auth.flattened_permission_keys ?? currentAuth?.flattened_permission_keys,
  })
}

export function clearStoredAuthObject() {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  dispatchAuthSessionChange()
}

export function getStoredPermissions() {
  return getStoredAuthObject()?.user_permissions ?? EMPTY_SESSION_PERMISSIONS
}

export function getStoredPermissionKeys() {
  const storedAuth = getStoredAuthObject()

  if (storedAuth?.flattened_permission_keys?.length) {
    return storedAuth.flattened_permission_keys
  }

  return flattenPermissionKeys(getStoredPermissions())
}

export function getStoredPermissionSet() {
  return new Set(getStoredPermissionKeys())
}

export function hasStoredPermission(permissionKey: string) {
  return hasPermission(getStoredPermissionSet(), permissionKey)
}

export function hasAnyStoredPermission(permissionKeys: string[]) {
  return hasAnyPermissions(getStoredPermissionSet(), permissionKeys)
}

export function hasAllStoredPermissions(permissionKeys: string[]) {
  return hasAllPermissions(getStoredPermissionSet(), permissionKeys)
}

function clearFirebaseEntries(storage: Storage) {
  const keysToDelete: string[] = []

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)

    if (key?.startsWith(FIREBASE_STORAGE_KEY_PREFIX)) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach((key) => {
    storage.removeItem(key)
  })
}

export function clearAuthBrowserState() {
  if (!isBrowser()) {
    return
  }

  clearStoredAuthObject()
  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  clearFirebaseEntries(window.localStorage)
  clearFirebaseEntries(window.sessionStorage)
}
