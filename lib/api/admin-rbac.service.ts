import { apiClient } from '@/lib/api/client'

type ApiRecord = Record<string, unknown>

type AdminRolesResponse = {
  roles?: unknown
  data?: unknown
}

type AdminPermissionsResponse = {
  permissions?: unknown
  data?: unknown
}

export type AdminRole = {
  id: string
  name: string
  description: string | null
  assigned_permission_ids: string[]
  assigned_permission_keys: string[]
  created_at: string | null
  updated_at: string | null
}

export type AdminPermission = {
  id: string
  key: string
  name: string
  description: string | null
  group: string | null
  category_key: string | null
  category_label: string | null
  resource_key: string | null
  resource_label: string | null
  action: string | null
  is_system_permission: boolean
  created_at: string | null
}

export type CreateAdminRolePayload = {
  name: string
  description?: string | null
}

export type UpdateAdminRolePermissionsPayload = {
  permission_ids: string[]
  permission_keys?: string[]
}

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ApiRecord) : null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function readBoolean(value: unknown) {
  return value === true
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase())
}

function humanizeToken(value: string) {
  return toTitleCase(
    value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase(),
  )
}

function humanizePermissionKey(value: string) {
  const segments = value.split(':').filter(Boolean)
  const relevantSegments = segments[0] === 'admin' ? segments.slice(1) : segments

  return relevantSegments.map(humanizeToken).join(' ')
}

function humanizePermissionText(value: string | null) {
  if (!value) {
    return null
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  if (trimmedValue.includes(':')) {
    return humanizePermissionKey(trimmedValue)
  }

  const humanizedValue = humanizeToken(trimmedValue)

  if (humanizedValue.startsWith('Admin ') && humanizedValue.length > 'Admin '.length) {
    return humanizedValue.slice('Admin '.length)
  }

  return humanizedValue
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value && value.trim().length > 0))),
  )
}

function extractPayloadArray(value: unknown, fallbackKey: string) {
  if (Array.isArray(value)) {
    return value
  }

  const record = asRecord(value)

  if (!record) {
    return []
  }

  const direct = record[fallbackKey]

  if (Array.isArray(direct)) {
    return direct
  }

  if (Array.isArray(record.data)) {
    return record.data
  }

  return []
}

function normalizePermissionReference(value: unknown) {
  if (typeof value === 'string') {
    return {
      id: null,
      key: value,
    }
  }

  const record = asRecord(value)

  if (!record) {
    return null
  }

  return {
    id: readString(record.id),
    key:
      readString(record.key) ??
      readString(record.permission_key) ??
      readString(record.code) ??
      readString(record.slug) ??
      readString(record.name),
  }
}

function normalizeAdminRole(value: unknown): AdminRole | null {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const id = readString(record.id)
  const name = readString(record.name) ?? readString(record.role_name) ?? readString(record.slug)

  if (!id || !name) {
    return null
  }

  const permissions = asArray(record.permissions)
  const permissionRefs = permissions
    .map(normalizePermissionReference)
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

  return {
    id,
    name,
    description: readOptionalString(record.description),
    assigned_permission_ids: uniqueStrings([
      ...asArray(record.permission_ids).map(readString),
      ...permissionRefs.map((entry) => entry.id),
    ]),
    assigned_permission_keys: uniqueStrings([
      ...asArray(record.permission_keys).map(readString),
      ...permissionRefs.map((entry) => entry.key),
    ]),
    created_at: readOptionalString(record.created_at),
    updated_at: readOptionalString(record.updated_at),
  }
}

function normalizeAdminPermission(value: unknown): AdminPermission | null {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const id = readString(record.id)
  const key =
    readString(record.key) ??
    readString(record.permission_key) ??
    readString(record.code) ??
    readString(record.slug)
  const readableKey = key ? humanizePermissionKey(key) : null
  const name = humanizePermissionText(readString(record.name)) ?? readableKey
  const description =
    humanizePermissionText(readOptionalString(record.description)) ??
    readableKey

  if (!id || !key || !name) {
    return null
  }

  return {
    id,
    key,
    name,
    description,
    group:
      readOptionalString(record.group) ??
      readOptionalString(record.module) ??
      readOptionalString(record.category),
    category_key: readOptionalString(record.category_key),
    category_label: readOptionalString(record.category_label),
    resource_key: readOptionalString(record.resource_key),
    resource_label: readOptionalString(record.resource_label),
    action: readOptionalString(record.action),
    is_system_permission: readBoolean(record.is_system_permission),
    created_at: readOptionalString(record.created_at),
  }
}

function normalizeNestedPermissions(payload: unknown) {
  const root = asRecord(payload)
  const categories = asArray(root?.categories)

  return categories.flatMap((categoryValue) => {
    const categoryRecord = asRecord(categoryValue)
    const categoryKey = readOptionalString(categoryRecord?.key)
    const categoryLabel = readOptionalString(categoryRecord?.label)

    return asArray(categoryRecord?.resources).flatMap((resourceValue) => {
      const resourceRecord = asRecord(resourceValue)
      const resourceKey = readOptionalString(resourceRecord?.key)
      const resourceLabel = readOptionalString(resourceRecord?.label)

      return asArray(resourceRecord?.permissions)
        .map((permissionValue) => {
          const permissionRecord = asRecord(permissionValue)

          if (!permissionRecord) {
            return null
          }

          return normalizeAdminPermission({
            ...permissionRecord,
            group: categoryLabel ? `${categoryLabel} / ${resourceLabel ?? 'Other'}` : resourceLabel,
            category_key: categoryKey,
            category_label: categoryLabel,
            resource_key: resourceKey,
            resource_label: resourceLabel,
          })
        })
        .filter((permission): permission is AdminPermission => Boolean(permission))
    })
  })
}

export async function fetchAdminRoles(signal?: AbortSignal) {
  const response = await apiClient.request<AdminRolesResponse>('/api/v1/admin/rbac/roles', { signal })

  return extractPayloadArray(response.roles ?? response.data ?? response, 'roles')
    .map(normalizeAdminRole)
    .filter((role): role is AdminRole => Boolean(role))
}

export async function createAdminRole(payload: CreateAdminRolePayload, signal?: AbortSignal) {
  return apiClient.request<unknown>('/api/v1/admin/rbac/roles', {
    method: 'POST',
    body: payload,
    signal,
  })
}

export async function fetchAdminPermissions(signal?: AbortSignal) {
  const response = await apiClient.request<AdminPermissionsResponse>('/api/v1/admin/rbac/permissions', { signal })
  const nestedPermissions = normalizeNestedPermissions(response.data ?? response)

  if (nestedPermissions.length > 0) {
    return nestedPermissions
  }

  return extractPayloadArray(response.permissions ?? response.data ?? response, 'permissions')
    .map(normalizeAdminPermission)
    .filter((permission): permission is AdminPermission => Boolean(permission))
}

export async function updateAdminRolePermissions(
  roleId: string,
  payload: UpdateAdminRolePermissionsPayload,
  signal?: AbortSignal,
) {
  return apiClient.request<unknown>(`/api/v1/admin/rbac/roles/${roleId}/permissions`, {
    method: 'PATCH',
    body: payload,
    signal,
  })
}
