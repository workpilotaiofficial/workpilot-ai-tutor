export type PermissionAction = 'read' | 'write' | 'update' | 'delete' | 'access'

export type SessionPermissions = Record<PermissionAction, string[]>

export const AUTH_SESSION_CHANGE_EVENT = 'ai_tutora_auth_session_change'

export const ADMIN_ACCESS_PERMISSION = 'admin:access'
export const RBAC_ASSIGNMENTS_READ_PERMISSION = 'admin:rbac:assignments:read'
export const RBAC_ASSIGNMENTS_WRITE_PERMISSION = 'admin:rbac:assignments:write'
export const RBAC_PERMISSIONS_READ_PERMISSION = 'admin:rbac:permissions:read'
export const RBAC_ROLES_READ_PERMISSION = 'admin:rbac:roles:read'
export const RBAC_ROLES_WRITE_PERMISSION = 'admin:rbac:roles:write'

export const ADMIN_RBAC_READ_PERMISSIONS = [RBAC_ROLES_READ_PERMISSION, RBAC_PERMISSIONS_READ_PERMISSION]

export const EMPTY_SESSION_PERMISSIONS: SessionPermissions = {
  read: [],
  write: [],
  update: [],
  delete: [],
  access: [],
}

type PermissionSource = Iterable<string> | Set<string>

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function uniquePermissionKeys(values: Iterable<string>) {
  return Array.from(new Set(Array.from(values).filter((value) => value.trim().length > 0)))
}

export function normalizeSessionPermissions(value: unknown): SessionPermissions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return EMPTY_SESSION_PERMISSIONS
  }

  const record = value as Partial<Record<PermissionAction, unknown>>

  return {
    read: uniquePermissionKeys(asStringArray(record.read)),
    write: uniquePermissionKeys(asStringArray(record.write)),
    update: uniquePermissionKeys(asStringArray(record.update)),
    delete: uniquePermissionKeys(asStringArray(record.delete)),
    access: uniquePermissionKeys(asStringArray(record.access)),
  }
}

export function flattenPermissionKeys(permissions: SessionPermissions) {
  return uniquePermissionKeys([
    ...permissions.read,
    ...permissions.write,
    ...permissions.update,
    ...permissions.delete,
    ...permissions.access,
  ])
}

export function toPermissionSet(source: PermissionSource) {
  return source instanceof Set ? source : new Set(Array.from(source))
}

export function hasPermission(source: PermissionSource, permissionKey: string) {
  return toPermissionSet(source).has(permissionKey)
}

export function hasAnyPermissions(source: PermissionSource, permissionKeys: string[]) {
  const permissionSet = toPermissionSet(source)
  return permissionKeys.some((permissionKey) => permissionSet.has(permissionKey))
}

export function hasAllPermissions(source: PermissionSource, permissionKeys: string[]) {
  const permissionSet = toPermissionSet(source)
  return permissionKeys.every((permissionKey) => permissionSet.has(permissionKey))
}

export function getPortalRouteByPermissions(role: string | null | undefined, permissions: PermissionSource) {
  return role === 'admin' && hasPermission(permissions, ADMIN_ACCESS_PERMISSION) ? '/admin' : '/dashboard'
}
