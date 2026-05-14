'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, Coins, LayoutDashboard, PanelsTopLeft, Users } from 'lucide-react'
import { signOut } from 'firebase/auth'

import { PortalShell, type PortalNavItem } from '@/components/portal/portal-shell'
import { apiClient } from '@/lib/api/client'
import { deleteCurrentSession, getPortalRouteByRole } from '@/lib/api/auth.service'
import { auth } from '@/lib/firebase'
import { clearAuthBrowserState, getStoredAuthObject } from '@/lib/api/session-storage'

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
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    void apiClient.ensureValidAccessToken()
  }, [])

  useEffect(() => {
    const storedAuth = getStoredAuthObject()

    if (!storedAuth?.access_token) {
      // clearAuthBrowserState()
      // router.replace('/login')
      return
    }

    if (storedAuth.user_role !== 'admin') {
      router.replace(getPortalRouteByRole(storedAuth.user_role))
    }
  }, [router])

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

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
      brandLabel="WorkPilot"
      navItems={adminNavItems.map((item) => ({
        ...item,
        isActive: pathname === item.href || pathname.startsWith(`${item.href}/`),
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
