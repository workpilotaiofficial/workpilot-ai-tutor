'use client'

import { type ReactNode, useEffect } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useRbac } from '@/hooks/use-rbac'

type RouteGuardProps = {
  children: ReactNode
  loadingFallback?: ReactNode
  unauthorizedFallback?: ReactNode
  redirectUnauthenticatedTo?: string
  redirectUnauthorizedTo?: string
  requiredPermission?: string
  requiredAnyPermissions?: string[]
  requiredAllPermissions?: string[]
}

function DefaultLoadingFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 text-foreground">
      <LoaderCircle className="h-8 w-8 animate-spin" />
    </main>
  )
}

export function RouteGuard({
  children,
  loadingFallback = <DefaultLoadingFallback />,
  unauthorizedFallback = <DefaultLoadingFallback />,
  redirectUnauthenticatedTo,
  redirectUnauthorizedTo,
  requiredPermission,
  requiredAnyPermissions,
  requiredAllPermissions,
}: RouteGuardProps) {
  const router = useRouter()
  const { can, canAny, canAll, isAuthenticated, isReady } = useRbac()

  const isAuthorized =
    (requiredPermission ? can(requiredPermission) : true) &&
    (requiredAnyPermissions ? canAny(requiredAnyPermissions) : true) &&
    (requiredAllPermissions ? canAll(requiredAllPermissions) : true)

  useEffect(() => {
    if (!isReady) {
      return
    }

    if (!isAuthenticated && redirectUnauthenticatedTo) {
      router.replace(redirectUnauthenticatedTo)
      return
    }

    if (isAuthenticated && !isAuthorized && redirectUnauthorizedTo) {
      router.replace(redirectUnauthorizedTo)
    }
  }, [isAuthenticated, isAuthorized, isReady, redirectUnauthenticatedTo, redirectUnauthorizedTo, router])

  if (!isReady) {
    return <>{loadingFallback}</>
  }

  if (!isAuthenticated) {
    return <>{loadingFallback}</>
  }

  if (!isAuthorized) {
    return <>{unauthorizedFallback}</>
  }

  return <>{children}</>
}
