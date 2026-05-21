'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Layers,
  ListChecks,
  NotebookPen,
  PenSquare,
  Sparkles,
} from 'lucide-react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { PortalShell, type PortalNavItem } from '@/components/portal/portal-shell'
import { getStoredStudySetById, getStoredStudySets, type StudySet } from '@/components/study-sets/utils'
import SettingsModal, { type SettingsTab } from '@/components/settings/settings-modal'
import { fetchCurrentSubscription } from '@/lib/api/billing.service'
import { apiClient } from '@/lib/api/client'
import { deleteCurrentSession, getPortalRouteByRole } from '@/lib/api/auth.service'
import { clearAuthBrowserState, getStoredAuthObject, replaceStoredAuthObject } from '@/lib/api/session-storage'
import { auth } from '@/lib/firebase'

const sectionIconMap: Record<string, any> = {
  notes: FileText,
  multipleChoice: ListChecks,
  flashcards: Layers,
  podcast: Headphones,
  tutorLesson: GraduationCap,
  writtenTests: PenSquare,
  fillInTheBlanks: NotebookPen,
  content: BookOpen,
}

function DashboardLayoutShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  )
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('personalizedAi')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [footerProfileName, setFooterProfileName] = useState('Account')
  const [footerPlanName, setFooterPlanName] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeStudySet, setActiveStudySet] = useState<StudySet | null>(null)
  const billingState = searchParams.get('billing')

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

  const baseNavItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Study Sets',
      href: '/dashboard/study-sets',
      icon: BookOpen,
    },
    {
      label: 'Syllabus Intelligence',
      href: '/dashboard/syllabus-intelligence',
      icon: Sparkles,
    },
    {
      label: 'Paper Grader',
      href: '/dashboard/paper-grader',
      icon: ClipboardCheck,
    },
    
  ]

  const studySetId = useMemo(() => {
    const matches = pathname.match(/^\/dashboard\/study-sets\/([^/]+)$/)
    return matches?.[1] ? decodeURIComponent(matches[1]) : null
  }, [pathname])

  const isStudySetDetail = Boolean(studySetId)

  useEffect(() => {
    void apiClient.ensureValidAccessToken()
  }, [])

  useEffect(() => {
    const storedAuth = getStoredAuthObject()

    if (!storedAuth?.access_token) {
      router.replace('/login')
      return
    }

    setFooterProfileName(storedAuth.user_display_name?.trim() || auth?.currentUser?.displayName?.trim() || 'Account')

    if (storedAuth.user_role === 'admin') {
      router.replace(getPortalRouteByRole(storedAuth.user_role))
    }
  }, [router])

  useEffect(() => {
    if (!auth) {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const displayName = user?.displayName?.trim()

      if (!displayName) {
        return
      }

      setFooterProfileName(displayName)

      const storedAuth = getStoredAuthObject()

      if (storedAuth && storedAuth.user_display_name !== displayName) {
        replaceStoredAuthObject({
          ...storedAuth,
          user_display_name: displayName,
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadCurrentSubscription = async () => {
      try {
        const subscription = await fetchCurrentSubscription()

        if (isCancelled) {
          return
        }

        const resolvedPlanName = subscription.planName?.trim() || subscription.planCode?.trim() || 'Free'
        setFooterPlanName(resolvedPlanName)
      } catch {
        if (!isCancelled) {
          setFooterPlanName('Free')
        }
      }
    }

    void loadCurrentSubscription()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isStudySetDetail || !studySetId) {
      setActiveStudySet(null)
      return
    }

    const stored = getStoredStudySetById(studySetId)
    if (stored) {
      setActiveStudySet(stored)
      return
    }

    const fallback = getStoredStudySets().find((set) => set.id === studySetId) ?? null
    setActiveStudySet(fallback)
  }, [isStudySetDetail, studySetId])

  useEffect(() => {
    if (isStudySetDetail) {
      setSidebarOpen(true)
    }
  }, [isStudySetDetail])

  useEffect(() => {
    if (!billingState) {
      return
    }

    setSettingsInitialTab('billing')
    setShowSettingsModal(true)
  }, [billingState])

  const currentMode = searchParams.get('mode')
  const defaultMode =
    activeStudySet?.sections.find((section) => section.type === 'notes')?.type ??
    activeStudySet?.sections[0]?.type ??
    null
  const activeMode = currentMode || defaultMode
  const activeStudySetId = activeStudySet?.id ?? studySetId ?? ''
  const resolvedNavItems: PortalNavItem[] = isStudySetDetail
    ? [
        {
          label: 'All Study Sets',
          href: '/dashboard/study-sets',
          icon: BookOpen,
        },
        ...(activeStudySet?.sections.map((section) => ({
          label: section.label,
          href: `/dashboard/study-sets/${encodeURIComponent(activeStudySetId)}?mode=${encodeURIComponent(section.type)}`,
          icon: sectionIconMap[section.type] ?? Sparkles,
          isActive: section.type === activeMode,
        })) ?? []),
      ]
    : baseNavItems.map((item) => ({
        ...item,
        isActive:
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(`${item.href}/`),
      }))

  return (
    <>
      <PortalShell
        brandHref="/dashboard"
        brandLabel="WorkPilot"
        navItems={resolvedNavItems}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen((current) => !current)}
        onOpenSettings={() => {
          setSettingsInitialTab('personalizedAi')
          setShowSettingsModal(true)
        }}
        onOpenBilling={() => {
          setSettingsInitialTab('billing')
          setShowSettingsModal(true)
        }}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        showHeader={!isStudySetDetail}
        footerProfileName={footerProfileName}
        footerProfileInitial={footerProfileName.charAt(0).toUpperCase() || 'S'}
        footerProfileSubtitle={footerPlanName ? `${footerPlanName} plan` : undefined}
      >
        {children}
      </PortalShell>

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} initialTab={settingsInitialTab} />
      )}
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<DashboardLayoutShell>{children}</DashboardLayoutShell>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
