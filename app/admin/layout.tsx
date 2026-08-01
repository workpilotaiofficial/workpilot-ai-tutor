'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, Coins, LayoutDashboard, MessageSquareText, PanelsTopLeft, ShieldCheck, Users } from 'lucide-react'
import { signOut } from 'firebase/auth'

import { PortalShell, type PortalNavItem } from '@/components/portal/portal-shell'
import { apiClient } from '@/lib/api/client'
import { deleteCurrentSession, getPortalRouteByRole } from '@/lib/api/auth.service'
import { auth } from '@/lib/firebase'
import { clearAuthBrowserState, getStoredAuthObject } from '@/lib/api/session-storage'
import { getLoginUrl } from '@/lib/auth-redirect'
import { AUTH_SESSION_CHANGE_EVENT } from '@/lib/rbac/permissions'

const adminNavItems: PortalNavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Students',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Credits',
    href: '/admin/credits',
    icon: Coins,
  },
  {
    label: 'Plans',
    href: '/admin/plans',
    icon: PanelsTopLeft,
  },
  {
    label: 'Models',
    href: '/admin/models',
    icon: Bot,
  },
  {
    label: 'Personalized AI',
    href: '/admin/personalization',
    icon: MessageSquareText,
  },
  {
    label: 'Access',
    href: '/admin/access',
    icon: ShieldCheck,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isManualLogoutRef = useRef(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    void apiClient.ensureValidAccessToken()
  }, [])

  // Client-side gate only for UX; the backend independently enforces admin permissions.
  useEffect(() => {
    const syncAuthState = () => {
      const storedAuth = getStoredAuthObject()

      if (!storedAuth?.access_token) {
        if (!isManualLogoutRef.current) {
          router.replace(getLoginUrl())
        }
        return
      }

      if (storedAuth.user_role !== 'admin') {
        router.replace(getPortalRouteByRole(storedAuth.user_role))
      }
    }

    syncAuthState()
    window.addEventListener('storage', syncAuthState)
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncAuthState)
    }
  }, [router])

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    isManualLogoutRef.current = true

    await deleteCurrentSession().catch(() => null)

    if (auth) {
      await signOut(auth).catch(() => null)
    }

    clearAuthBrowserState()
    router.replace('/')
    setIsLoggingOut(false)
  }

  return (
    <PortalShell
      brandHref="/admin"
      brandLabel="Neurova"
      navItems={adminNavItems.map((item) => ({
        ...item,
        isActive:
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname.startsWith(`${item.href}/`),
      }))}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={() => setSidebarOpen((current) => !current)}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
    >
      {children}
    </PortalShell>
  )
}
