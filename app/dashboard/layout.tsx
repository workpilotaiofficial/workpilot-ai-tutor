'use client'

import { PortalShell, type PortalNavItem } from '@/components/portal/portal-shell'
import PersonalizedAiOnboardingModal from '@/components/settings/personalized-ai-onboarding-modal'
import InsufficientCreditsModal from '@/components/settings/insufficient-credits-modal'
import SettingsModal, { type SettingsTab } from '@/components/settings/settings-modal'
import { getStoredStudySetById, getStoredStudySets, type StudySet } from '@/components/study-sets/utils'
import { deleteCurrentSession, getPortalRouteByRole } from '@/lib/api/auth.service'
import { fetchCurrentSubscription } from '@/lib/api/billing.service'
import { apiClient, CREDIT_LIMIT_REACHED_EVENT, CreditLimitReachedEventDetail } from '@/lib/api/client'
import { clearAuthBrowserState, getStoredAuthObject, replaceStoredAuthObject } from '@/lib/api/session-storage'
import { getLoginUrl } from '@/lib/auth-redirect'
import { auth } from '@/lib/firebase'
import { AUTH_SESSION_CHANGE_EVENT } from '@/lib/rbac/permissions'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Headphones,
  Layers,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  PenSquare,
  Sparkles,
} from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

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
  const [showPersonalizationOnboarding, setShowPersonalizationOnboarding] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('personalizedAi')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isManualLogoutRef = useRef(false)
  const hasCheckedOnboardingRef = useRef(false)
  const [footerProfileName, setFooterProfileName] = useState('Account')
  const [footerPlanName, setFooterPlanName] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeStudySet, setActiveStudySet] = useState<StudySet | null>(null)
  const billingState = searchParams.get('billing')
  const [creditLimitDetails, setCreditLimitDetails] =
    useState<CreditLimitReachedEventDetail | null>(null)
  const [showCreditUpgradeModal, setShowCreditUpgradeModal] =
    useState(false)
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
      icon: GraduationCap,
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
    const syncAuthState = () => {
      const storedAuth = getStoredAuthObject()

      if (!storedAuth?.access_token) {
        if (!isManualLogoutRef.current) {
          router.replace(getLoginUrl())
        }
        return
      }

      setFooterProfileName(storedAuth.user_display_name?.trim() || auth?.currentUser?.displayName?.trim() || 'Account')

      if (storedAuth.user_role === 'admin') {
        router.replace(getPortalRouteByRole(storedAuth.user_role))
        return
      }

      if (!hasCheckedOnboardingRef.current && typeof storedAuth.user_onboarding === 'boolean') {
        hasCheckedOnboardingRef.current = true
        setShowPersonalizationOnboarding(!storedAuth.user_onboarding)
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
  useEffect(() => {
    const handleCreditLimitReached = (event: Event) => {
      const creditEvent =
        event as CustomEvent<CreditLimitReachedEventDetail>

      setCreditLimitDetails(creditEvent.detail ?? null)
      setShowCreditUpgradeModal(true)
    }

    window.addEventListener(
      CREDIT_LIMIT_REACHED_EVENT,
      handleCreditLimitReached,
    )

    return () => {
      window.removeEventListener(
        CREDIT_LIMIT_REACHED_EVENT,
        handleCreditLimitReached,
      )
    }
  }, [])
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
        brandLabel="Neurova"
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

      {showPersonalizationOnboarding && (
        <PersonalizedAiOnboardingModal
          onClose={() => setShowPersonalizationOnboarding(false)}
          onOnboardingComplete={() => {
            const storedAuth = getStoredAuthObject()

            if (storedAuth && storedAuth.user_onboarding !== true) {
              replaceStoredAuthObject({
                ...storedAuth,
                user_onboarding: true,
              })
            }
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          initialTab={settingsInitialTab}
          creditLimitDetails={creditLimitDetails}
          onClose={() => {
            setShowSettingsModal(false)
            setCreditLimitDetails(null)
          }}
        />
      )}

      {showCreditUpgradeModal && (
        <InsufficientCreditsModal
          details={creditLimitDetails}
          onClose={() => {
            setShowCreditUpgradeModal(false)
            setCreditLimitDetails(null)
          }}
          onOpenBilling={() => {
            setShowCreditUpgradeModal(false)
            setSettingsInitialTab('billing')
            setShowSettingsModal(true)
          }}
        />
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
