'use client'

import { type ReactNode } from 'react'

import { useRbac } from '@/hooks/use-rbac'

type PermissionGateProps = {
  children: ReactNode
  fallback?: ReactNode
  permission?: string
  anyPermissions?: string[]
  allPermissions?: string[]
}

export function PermissionGate({
  children,
  fallback = null,
  permission,
  anyPermissions,
  allPermissions,
}: PermissionGateProps) {
  const { can, canAny, canAll } = useRbac()

  const isAllowed =
    (permission ? can(permission) : true) &&
    (anyPermissions ? canAny(anyPermissions) : true) &&
    (allPermissions ? canAll(allPermissions) : true)

  return isAllowed ? <>{children}</> : <>{fallback}</>
}
