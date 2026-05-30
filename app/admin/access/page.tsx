'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { KeyRound, LoaderCircle, Plus, RefreshCw, ShieldCheck } from 'lucide-react'

import { PermissionGate } from '@/components/auth/permission-gate'
import { RouteGuard } from '@/components/auth/route-guard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createAdminRole,
  fetchAdminPermissions,
  fetchAdminRoles,
  getApiClientErrorMessage,
  updateAdminRolePermissions,
  type AdminPermission,
  type AdminRole,
} from '@/lib/api'
import { useRbac } from '@/hooks/use-rbac'
import {
  ADMIN_ACCESS_PERMISSION,
  ADMIN_RBAC_READ_PERMISSIONS,
  RBAC_ASSIGNMENTS_WRITE_PERMISSION,
  RBAC_ROLES_WRITE_PERMISSION,
} from '@/lib/rbac/permissions'

type TabValue = 'roles' | 'permissions'
type SupportedAction = 'read' | 'write' | 'update' | 'delete' | 'access'

const SUPPORTED_ACTIONS: SupportedAction[] = ['read', 'write', 'update', 'delete', 'access']

function formatDateTime(value: string | null) {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function sortRoles(roles: AdminRole[]) {
  return [...roles].sort((left, right) => left.name.localeCompare(right.name))
}

function sortPermissions(permissions: AdminPermission[]) {
  return [...permissions].sort((left, right) => {
    const leftCategory = left.category_label ?? ''
    const rightCategory = right.category_label ?? ''

    if (leftCategory !== rightCategory) {
      return leftCategory.localeCompare(rightCategory)
    }

    const leftResource = left.resource_label ?? ''
    const rightResource = right.resource_label ?? ''

    if (leftResource !== rightResource) {
      return leftResource.localeCompare(rightResource)
    }

    return left.name.localeCompare(right.name)
  })
}

function getAssignedPermissionIds(role: AdminRole | null, permissions: AdminPermission[]) {
  if (!role) {
    return []
  }

  const permissionIdByKey = new Map(permissions.map((permission) => [permission.key, permission.id]))

  return Array.from(
    new Set([
      ...role.assigned_permission_ids,
      ...role.assigned_permission_keys
        .map((key) => permissionIdByKey.get(key))
        .filter((value): value is string => Boolean(value)),
    ]),
  )
}

function isSupportedAction(value: string | null): value is SupportedAction {
  return value === 'read' || value === 'write' || value === 'update' || value === 'delete' || value === 'access'
}

function formatActionLabel(action: SupportedAction) {
  return action.charAt(0).toUpperCase() + action.slice(1)
}

export default function AdminAccessPage() {
  const { can } = useRbac()
  const [activeTab, setActiveTab] = useState<TabValue>('roles')
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [permissions, setPermissions] = useState<AdminPermission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([])
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)

  useEffect(() => {
    const abortController = new AbortController()

    async function loadRbacData() {
      setErrorMessage('')
      setIsLoading(true)

      try {
        const [rolesResult, permissionsResult] = await Promise.all([
          fetchAdminRoles(abortController.signal),
          fetchAdminPermissions(abortController.signal),
        ])

        if (abortController.signal.aborted) {
          return
        }

        setRoles(sortRoles(rolesResult))
        setPermissions(sortPermissions(permissionsResult))
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setRoles([])
        setPermissions([])
        setErrorMessage(getApiClientErrorMessage(error, 'Failed to load access controls.'))
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    void loadRbacData()

    return () => {
      abortController.abort()
    }
  }, [reloadKey])

  useEffect(() => {
    if (selectedRoleId && !roles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId('')
    }
  }, [roles, selectedRoleId])

  useEffect(() => {
    const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null
    const supportedPermissionIds = new Set(
      permissions
        .filter((permission) => isSupportedAction(permission.action))
        .map((permission) => permission.id),
    )

    setDraftPermissionIds(
      getAssignedPermissionIds(selectedRole, permissions).filter((permissionId) => supportedPermissionIds.has(permissionId)),
    )
  }, [permissions, roles, selectedRoleId])

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null
  const canCreateRoles = can(RBAC_ROLES_WRITE_PERMISSION)
  const canUpdateAssignments = can(RBAC_ASSIGNMENTS_WRITE_PERMISSION)
  const selectedRoleAssignedIds = getAssignedPermissionIds(selectedRole, permissions)
  const supportedPermissions = permissions.filter(
    (permission): permission is AdminPermission & { action: SupportedAction } => isSupportedAction(permission.action),
  )
  const supportedPermissionIds = new Set(supportedPermissions.map((permission) => permission.id))
  const selectedRoleSupportedAssignedIds = selectedRoleAssignedIds.filter((permissionId) => supportedPermissionIds.has(permissionId))
  const selectedRoleUnsupportedAssignedIds = selectedRoleAssignedIds.filter((permissionId) => !supportedPermissionIds.has(permissionId))
  const hasUnsavedPermissionChanges =
    draftPermissionIds.length !== selectedRoleSupportedAssignedIds.length ||
    draftPermissionIds.some((permissionId) => !selectedRoleSupportedAssignedIds.includes(permissionId))

  const permissionGroups = supportedPermissions.reduce<
    Array<{
      categoryName: string
      resources: Array<{
        resourceName: string
        resourceKey: string
        description: string
        actions: Partial<Record<SupportedAction, AdminPermission>>
      }>
    }>
  >((groups, permission) => {
    const categoryName = permission.category_label ?? 'Other'
    const resourceName = permission.resource_label ?? 'Other'
    const resourceKey = permission.resource_key ?? permission.key
    const resourceDescription = `Available actions: ${formatActionLabel(permission.action)}`
    const existingCategory = groups.find((group) => group.categoryName === categoryName)

    if (!existingCategory) {
      groups.push({
        categoryName,
        resources: [
          {
            resourceName,
            resourceKey,
            description: resourceDescription,
            actions: { [permission.action]: permission },
          },
        ],
      })
      return groups
    }

    const existingResource = existingCategory.resources.find((resource) => resource.resourceName === resourceName)

    if (!existingResource) {
      existingCategory.resources.push({
        resourceName,
        resourceKey,
        description: resourceDescription,
        actions: { [permission.action]: permission },
      })
      return groups
    }

    existingResource.description = `Available actions: ${SUPPORTED_ACTIONS.filter((action) => Boolean(existingResource.actions[action]) || action === permission.action).map(formatActionLabel).join(', ')}`
    existingResource.actions[permission.action] = permission
    return groups
  }, [])

  const handleRefresh = () => {
    setSuccessMessage('')
    setIsRefreshing(true)
    setReloadKey((current) => current + 1)
  }

  const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isCreatingRole) {
      return
    }

    if (!canCreateRoles) {
      setErrorMessage('You do not have permission to create roles.')
      setSuccessMessage('')
      return
    }

    const trimmedRoleName = roleName.trim()
    const trimmedRoleDescription = roleDescription.trim()

    if (!trimmedRoleName) {
      setErrorMessage('Role name is required.')
      setSuccessMessage('')
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsCreatingRole(true)

    try {
      await createAdminRole({
        name: trimmedRoleName,
        description: trimmedRoleDescription || null,
      })
      setRoleName('')
      setRoleDescription('')
      setSuccessMessage(`Created role ${trimmedRoleName}.`)
      setReloadKey((current) => current + 1)
    } catch (error) {
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to create role.'))
    } finally {
      setIsCreatingRole(false)
    }
  }

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setDraftPermissionIds((current) => {
      if (checked) {
        return current.includes(permissionId) ? current : [...current, permissionId]
      }

      return current.filter((id) => id !== permissionId)
    })
  }

  const handleSavePermissions = async () => {
    if (!selectedRole || isSavingPermissions) {
      return
    }

    if (!canUpdateAssignments) {
      setErrorMessage('You do not have permission to update role permissions.')
      setSuccessMessage('')
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSavingPermissions(true)

    const finalPermissionIds = Array.from(new Set([...selectedRoleUnsupportedAssignedIds, ...draftPermissionIds]))
    const selectedPermissionKeys = permissions
      .filter((permission) => finalPermissionIds.includes(permission.id))
      .map((permission) => permission.key)

    try {
      await updateAdminRolePermissions(selectedRole.id, {
        permission_ids: finalPermissionIds,
        permission_keys: selectedPermissionKeys,
      })

      setRoles((current) =>
        sortRoles(
          current.map((role) =>
            role.id === selectedRole.id
              ? {
                  ...role,
                  assigned_permission_ids: [...finalPermissionIds],
                  assigned_permission_keys: [...selectedPermissionKeys],
                }
              : role,
          ),
        ),
      )
      setSuccessMessage(`Updated permissions for ${selectedRole.name}.`)
    } catch (error) {
      setErrorMessage(getApiClientErrorMessage(error, 'Failed to update role permissions.'))
    } finally {
      setIsSavingPermissions(false)
    }
  }

  return (
    <RouteGuard
      redirectUnauthenticatedTo="/login"
      redirectUnauthorizedTo="/admin"
      requiredPermission={ADMIN_ACCESS_PERMISSION}
      requiredAllPermissions={ADMIN_RBAC_READ_PERMISSIONS}
    >
      <section className="p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Access
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage admin roles and the permissions assigned to each role.
            </p>
          </div>

          <Button type="button" variant="outline" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
            {isRefreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {!canCreateRoles || !canUpdateAssignments ? (
          <div className="rounded-2xl border border-amber-300/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            You have read access to RBAC settings, but some write actions are disabled for this account.
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="gap-4">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-border bg-muted/50 p-2 text-muted-foreground">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Create Role</h2>
                      <p className="text-sm text-muted-foreground">
                        Add a new role for RBAC assignment.
                      </p>
                    </div>
                  </div>
                </div>

                <form className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={handleCreateRole}>
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      value={roleName}
                      onChange={(event) => setRoleName(event.target.value)}
                      placeholder="content_manager"
                      disabled={isCreatingRole || !canCreateRoles}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-description">Description</Label>
                    <Input
                      id="role-description"
                      value={roleDescription}
                      onChange={(event) => setRoleDescription(event.target.value)}
                      placeholder="Optional description"
                      disabled={isCreatingRole || !canCreateRoles}
                    />
                  </div>

                  <div className="flex items-end">
                    <PermissionGate
                      permission={RBAC_ROLES_WRITE_PERMISSION}
                      fallback={
                        <Button type="submit" disabled className="w-full md:w-auto">
                          <Plus className="h-4 w-4" />
                          Create Role
                        </Button>
                      }
                    >
                      <Button type="submit" disabled={isCreatingRole} className="w-full md:w-auto">
                        {isCreatingRole ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Create Role
                      </Button>
                    </PermissionGate>
                  </div>
                </form>
              </div>

              <div className="rounded-3xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Role List</h2>
                      <p className="text-sm text-muted-foreground">
                        {roles.length} role{roles.length === 1 ? '' : 's'} available.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="rounded-2xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-4">Role</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Permissions</TableHead>
                         
                          <TableHead className="pr-4 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                              Loading roles...
                            </TableCell>
                          </TableRow>
                        ) : roles.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="px-4 py-12">
                              <div className="flex flex-col items-center justify-center gap-3 text-center">
                                <ShieldCheck className="h-10 w-10 text-muted-foreground/60" />
                                <div>
                                  <p className="font-medium text-foreground">No roles found</p>
                                  <p className="text-sm text-muted-foreground">
                                    Create the first role to start assigning permissions.
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          roles.map((role) => (
                            <TableRow key={role.id}>
                              <TableCell className="px-4 py-4">
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground">{role.name}</p>
                                
                                </div>
                              </TableCell>
                              <TableCell>{role.description?.trim() || 'No description'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getAssignedPermissionIds(role, permissions).length} assigned
                                </Badge>
                              </TableCell>
                              
                              <TableCell className="pr-4 text-right">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRoleId(role.id)
                                    setActiveTab('permissions')
                                  }}
                                >
                                  <KeyRound className="h-4 w-4" />
                                  Manage Permissions
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions">
            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-foreground">Role Permissions</h2>
                      <p className="text-sm text-muted-foreground">
                        Select a role, review its permission set, then save the updated assignment.
                      </p>
                    </div>

                    <div className="w-full max-w-sm space-y-2">
                      <Label>Select Role</Label>
                      <Select value={selectedRoleId || '__none'} onValueChange={(value) => setSelectedRoleId(value === '__none' ? '' : value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">Choose a role</SelectItem>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {!selectedRole ? (
                    <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-center">
                      <KeyRound className="h-10 w-10 text-muted-foreground/60" />
                      <div>
                        <p className="font-medium text-foreground">No role selected</p>
                        <p className="text-sm text-muted-foreground">
                          Choose a role to inspect and update its permission set.
                        </p>
                      </div>
                    </div>
                  ) : isLoading ? (
                    <div className="flex min-h-60 items-center justify-center gap-3 text-sm text-muted-foreground">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Loading permissions...
                    </div>
                  ) : permissions.length === 0 ? (
                    <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
                      <ShieldCheck className="h-10 w-10 text-muted-foreground/60" />
                      <div>
                        <p className="font-medium text-foreground">No permissions found</p>
                        <p className="text-sm text-muted-foreground">
                          The permissions endpoint did not return any assignable records.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-foreground">{selectedRole.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedRole.description?.trim() || 'No description provided for this role.'}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {draftPermissionIds.length} selected
                          </Badge>
                          <Button
                            type="button"
                            onClick={handleSavePermissions}
                            disabled={!selectedRole || isSavingPermissions || !hasUnsavedPermissionChanges || !canUpdateAssignments}
                          >
                            {isSavingPermissions ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                            Save Permissions
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {permissionGroups.map((categoryGroup) => (
                          <div key={categoryGroup.categoryName} className="rounded-2xl border border-border">
                            <div className="border-b border-border px-4 py-3">
                              <h3 className="font-medium text-foreground">{categoryGroup.categoryName}</h3>
                            </div>

                            <div className="overflow-x-auto p-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="min-w-[280px] px-4">Description</TableHead>
                                    {SUPPORTED_ACTIONS.map((action) => (
                                      <TableHead key={action} className="min-w-[88px] text-center">
                                        {formatActionLabel(action)}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {categoryGroup.resources.map((resourceGroup) => (
                                    <TableRow key={`${categoryGroup.categoryName}-${resourceGroup.resourceName}`}>
                                      <TableCell className="px-4 py-4">
                                        <div className="space-y-1">
                                          <p className="font-medium text-foreground">{resourceGroup.resourceName}</p>
                                          <p className="text-sm text-muted-foreground">{resourceGroup.description}</p>
                                        </div>
                                      </TableCell>
                                      {SUPPORTED_ACTIONS.map((action) => {
                                        const actionPermission = resourceGroup.actions[action]

                                        return (
                                          <TableCell key={`${resourceGroup.resourceKey}-${action}`} className="py-4 text-center">
                                            {actionPermission ? (
                                              <div className="flex justify-center">
                                                <Checkbox
                                                  checked={draftPermissionIds.includes(actionPermission.id)}
                                                  onCheckedChange={(checked) =>
                                                    handlePermissionToggle(actionPermission.id, checked === true)
                                                  }
                                                  disabled={!canUpdateAssignments}
                                                />
                                              </div>
                                            ) : (
                                              <span className="text-sm text-muted-foreground">-</span>
                                            )}
                                          </TableCell>
                                        )
                                      })}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </section>
    </RouteGuard>
  )
}
