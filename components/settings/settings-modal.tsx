'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, Coins, LoaderCircle, RefreshCcw, RotateCcw, X } from 'lucide-react'
import BillingSettings from '@/components/settings/billing-settings'
import PersonalizedAiSettings from '@/components/settings/personalized-ai-settings'
import ProfileSettings from '@/components/settings/profile-settings'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  fetchCreditBalance,
  fetchPersonalizationQuestions,
  getApiClientErrorMessage,
  updatePersonalizationAnswers,
  type CreditBalance,
  type PersonalizationAnswerInput,
  type PersonalizationQuestionWithAnswer,
} from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  applyThemeCustomization,
  clearThemeCustomization,
  DEFAULT_THEME_CUSTOMIZATION,
  getContrastRatio,
  getStoredThemeCustomization,
  persistThemeCustomization,
  THEME_FONT_OPTIONS,
  type ThemeCustomization,
} from '@/components/settings/theme-customization'
import { CreditLimitReachedEventDetail } from '@/lib/api/client'

export type SettingsTab = 'account' | 'profile' | 'usage' | 'billing' | 'personalizedAi' | 'customizeTheme'

const menuItems: Array<{ id: SettingsTab; label: string }> = [
  // { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
  { id: 'usage', label: 'Usage' },
  { id: 'billing', label: 'Billing' },
  { id: 'personalizedAi', label: 'Personalized AI' },
  { id: 'customizeTheme', label: 'Customize Theme' },
]

interface SettingsModalProps {
  onClose: () => void
  initialTab?: SettingsTab,
  creditLimitDetails?: CreditLimitReachedEventDetail | null
}

const LIGHT_BACKGROUND_REFERENCE = '#FFFFFF'
const DARK_BACKGROUND_REFERENCE = '#1A1A1A'
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const formatUsageDate = (value: string | null) => {
  if (!value) return 'Not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatPlanName = (value: string | null) => {
  const plan = value?.trim()
  return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Not available'
}

const getPeriodMetrics = (periodStart: string | null, periodEnd: string | null, now: number) => {
  if (!periodStart || !periodEnd) return null

  const start = new Date(periodStart).getTime()
  const end = new Date(periodEnd).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null

  const totalDays = Math.max(1, Math.ceil((end - start) / MILLISECONDS_PER_DAY))
  const elapsedDays = Math.min(totalDays, Math.max(0, Math.floor((now - start) / MILLISECONDS_PER_DAY)))
  const remainingDays = Math.min(totalDays, Math.max(0, Math.ceil((end - now) / MILLISECONDS_PER_DAY)))
  const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))

  return { elapsedDays, remainingDays, totalDays, progress }
}

const getContrastRating = (ratio: number) => {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'Large Text Only'
  return 'Fail'
}

export default function SettingsModal({ onClose, initialTab = 'personalizedAi', creditLimitDetails = null, }: SettingsModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)
  const [personalizationQuestions, setPersonalizationQuestions] = useState<PersonalizationQuestionWithAnswer[]>([])
  const [personalizationLoadError, setPersonalizationLoadError] = useState<string | null>(null)
  const [hasLoadedPersonalization, setHasLoadedPersonalization] = useState(false)
  const [isPersonalizationLoading, setIsPersonalizationLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [themeSettings, setThemeSettings] = useState<ThemeCustomization>(DEFAULT_THEME_CUSTOMIZATION)
  const [status, setStatus] = useState<string | null>(null)
  const [themeStatus, setThemeStatus] = useState<string | null>(null)
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [usageLoadError, setUsageLoadError] = useState<string | null>(null)
  const [hasLoadedUsage, setHasLoadedUsage] = useState(false)
  const [isUsageLoading, setIsUsageLoading] = useState(false)
  const [usageCalculatedAt, setUsageCalculatedAt] = useState(0)
  const textContrastOnLight = getContrastRatio(themeSettings.textColor, LIGHT_BACKGROUND_REFERENCE)
  const textContrastOnDark = getContrastRatio(themeSettings.textColor, DARK_BACKGROUND_REFERENCE)

  useEffect(() => {
    setThemeSettings(getStoredThemeCustomization())
  }, [])

  const loadPersonalization = useCallback(async () => {
    setIsPersonalizationLoading(true)
    setPersonalizationLoadError(null)

    try {
      const result = await fetchPersonalizationQuestions()
      setPersonalizationQuestions(result.questions)
      setHasLoadedPersonalization(true)
    } catch (error) {
      const description = getApiClientErrorMessage(error, 'Your personalization questions could not be loaded.')
      setPersonalizationLoadError(description)
      toast({
        title: 'Unable to load personalization questions',
        description,
        variant: 'destructive',
      })
    } finally {
      setIsPersonalizationLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (activeTab !== 'personalizedAi' || hasLoadedPersonalization) {
      return
    }

    void loadPersonalization()
  }, [activeTab, hasLoadedPersonalization, loadPersonalization])

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  const loadCreditBalance = useCallback(async () => {
    setIsUsageLoading(true)
    setUsageLoadError(null)

    try {
      const result = await fetchCreditBalance()
      setCreditBalance(result)
      setUsageCalculatedAt(Date.now())
      setHasLoadedUsage(true)
    } catch (error) {
      const description = getApiClientErrorMessage(error, 'Your credit usage could not be loaded.')
      setUsageLoadError(description)
      toast({
        title: 'Unable to load usage',
        description,
        variant: 'destructive',
      })
    } finally {
      setIsUsageLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (activeTab !== 'usage' || hasLoadedUsage) {
      return
    }

    void loadCreditBalance()
  }, [activeTab, hasLoadedUsage, loadCreditBalance])

  const periodMetrics = creditBalance
    ? getPeriodMetrics(creditBalance.periodStart, creditBalance.periodEnd, usageCalculatedAt)
    : null
  const monthlyCreditUsage = creditBalance?.monthlyAllotment && creditBalance.monthlyAllotment > 0
    ? Math.min(100, Math.max(0, ((creditBalance.periodUsed ?? 0) / creditBalance.monthlyAllotment) * 100))
    : null

  const mergeSavedPersonalizationAnswers = (
    currentQuestions: PersonalizationQuestionWithAnswer[],
    answers: PersonalizationAnswerInput[],
  ) =>
    currentQuestions.map((question) => {
      const answerInput = answers.find((item) => item.questionId === question.id)

      if (!answerInput) {
        return question
      }

      const trimmedAnswer = answerInput.answer.trim()

      return {
        ...question,
        answer: {
          id: question.answer?.id ?? null,
          questionId: question.id,
          answer: trimmedAnswer,
          moderationStatus: question.answer?.moderationStatus ?? null,
          moderationReason: question.answer?.moderationReason ?? null,
          createdAt: question.answer?.createdAt ?? null,
          updatedAt: question.answer?.updatedAt ?? question.answer?.createdAt ?? null,
        },
      }
    })

  // const savePersonalizationAnswers = async (answers: PersonalizationAnswerInput[]) => {
  //   setIsSaving(true)
  //   setStatus(null)

  //   try {
  //     const result = await updatePersonalizationAnswers({ answers })
  //     setPersonalizationQuestions((currentQuestions) =>
  //       result.questions.length > 0 ? result.questions : mergeSavedPersonalizationAnswers(currentQuestions, answers),
  //     )
  //     setStatus('Personalized AI answers saved successfully.')
  //   } catch (error) {
  //     toast({
  //       title: 'Unable to save personalization profile',
  //       description: getApiClientErrorMessage(error, 'Your personalization profile could not be saved.'),
  //       variant: 'destructive',
  //     })
  //   } finally {
  //     setIsSaving(false)
  //   }
  // }

  const saveThemeSettings = () => {
    persistThemeCustomization(themeSettings)
    applyThemeCustomization(themeSettings)
    setThemeStatus('Theme settings saved successfully.')
  }

  const resetThemeSettings = () => {
    clearThemeCustomization()
    applyThemeCustomization(DEFAULT_THEME_CUSTOMIZATION)
    setThemeSettings(DEFAULT_THEME_CUSTOMIZATION)
    setThemeStatus('Theme reset to defaults.')
  }
  

  const savePersonalizationAnswers = async (answers: PersonalizationAnswerInput[]) => {
    setIsSaving(true)
    setStatus(null)

    try {
      const result = await updatePersonalizationAnswers({ answers })
      setPersonalizationQuestions((currentQuestions) =>
        result.questions.length > 0 ? result.questions : mergeSavedPersonalizationAnswers(currentQuestions, answers),
      )
      setStatus('Personalized AI answers saved successfully.')
    } catch (error) {
      toast({
        title: 'Unable to save personalization profile',
        description: getApiClientErrorMessage(error, 'Your personalization profile could not be saved.'),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-0 sm:p-4 md:p-8" onClick={onClose} role="presentation">
      <div className="mx-auto flex h-full max-h-[720px] w-full max-w-5xl flex-col overflow-hidden bg-card shadow-2xl sm:rounded-2xl sm:border sm:border-border" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Settings">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
            <p className="truncate text-sm text-muted-foreground">Manage account and personalization preferences.</p>
          </div>
          <button onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-secondary" aria-label="Close settings"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <aside className="w-full shrink-0 border-b border-border bg-secondary/20 p-2 sm:max-w-[220px] sm:border-b-0 sm:border-r sm:p-3">
            <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none] sm:block sm:space-y-1 [&::-webkit-scrollbar]:hidden">
              {menuItems.map((item) => {
                const active = activeTab === item.id
                return <button key={item.id} onClick={() => { setActiveTab(item.id); setStatus(null); setThemeStatus(null) }} className={`min-h-10 shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium sm:w-full ${active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}>{item.label}</button>
              })}
            </nav>
          </aside>

          <section className="min-h-0 min-w-0 flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-5">
            {activeTab === 'personalizedAi' ? (
              <PersonalizedAiSettings
                questions={personalizationQuestions}
                isLoading={isPersonalizationLoading}
                isSaving={isSaving}
                status={status}
                loadError={personalizationLoadError}
                onSave={savePersonalizationAnswers}
                onRetry={() => void loadPersonalization()}
                onStatusChange={setStatus}
              />
            ) : activeTab === 'profile' ? (
              <ProfileSettings />
            ) : activeTab === 'usage' ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Usage</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Track your credits and current plan period.</p>
                  </div>

                  <Button size="sm" variant="outline" onClick={() => void loadCreditBalance()} disabled={isUsageLoading}>
                    {isUsageLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Refresh
                  </Button>
                </div>

                {isUsageLoading && !hasLoadedUsage ? (
                  <div className="space-y-4" aria-label="Loading credit usage">
                    <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-24 animate-pulse rounded-xl bg-secondary" />
                      ))}
                    </div>
                    <div className="h-44 animate-pulse rounded-2xl bg-secondary" />
                  </div>
                ) : usageLoadError && !creditBalance ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                    <p className="font-medium text-foreground">Usage details are unavailable</p>
                    <p className="mt-1 text-sm text-muted-foreground">{usageLoadError}</p>
                    <Button className="mt-4" variant="outline" onClick={() => void loadCreditBalance()} disabled={isUsageLoading}>
                      {isUsageLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                      Try again
                    </Button>
                  </div>
                ) : creditBalance ? (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-background p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="rounded-xl bg-primary p-2.5 text-primary-foreground shadow-sm">
                            <Coins className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Credits left</p>
                            <p className="mt-0.5 text-4xl font-bold tracking-tight text-foreground">
                              {creditBalance.current.toLocaleString('en-US')}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                          {formatPlanName(creditBalance.plan)} plan
                        </span>
                      </div>

                      <div className="mt-5 flex items-center gap-2 border-t border-primary/10 pt-4 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>This is your available balance right now.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                      <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-medium text-muted-foreground">Monthly limit</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {creditBalance.monthlyAllotment === null
                            ? 'Not available'
                            : creditBalance.monthlyAllotment.toLocaleString('en-US')}
                          {creditBalance.monthlyAllotment !== null ? (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">credits</span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {creditBalance.monthlyAllotment === null
                            ? 'Limit not provided'
                            : creditBalance.monthlyAllotment > 0
                              ? 'Included each period'
                              : 'No recurring allowance'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-medium text-muted-foreground">Used this period</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {creditBalance.periodUsed === null
                            ? 'Not available'
                            : creditBalance.periodUsed.toLocaleString('en-US')}
                          {creditBalance.periodUsed !== null ? (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">credits</span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Since {formatUsageDate(creditBalance.periodStart)}</p>
                      </div>

                      <div className="col-span-2 rounded-xl border border-border bg-card p-4 lg:col-span-1">
                        <p className="text-xs font-medium text-muted-foreground">Current plan</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{formatPlanName(creditBalance.plan)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Active for this period</p>
                      </div>
                    </div>

                    {monthlyCreditUsage !== null ? (
                      <div className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                          <span className="font-medium text-foreground">Monthly credit usage</span>
                          <span className="text-muted-foreground">{Math.round(monthlyCreditUsage)}%</span>
                        </div>
                        <Progress value={monthlyCreditUsage} aria-label={`${Math.round(monthlyCreditUsage)}% of monthly credits used`} />
                        <p className="mt-2 text-xs text-muted-foreground">
                          {(creditBalance.periodUsed ?? 0).toLocaleString('en-US')} of {creditBalance.monthlyAllotment?.toLocaleString('en-US')} included credits used
                        </p>
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-secondary p-2.5 text-foreground">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Current period</p>
                          <p className="text-sm text-muted-foreground">
                            {formatUsageDate(creditBalance.periodStart)} – {formatUsageDate(creditBalance.periodEnd)}
                          </p>
                        </div>
                      </div>

                      {periodMetrics ? (
                        <>
                          <div className="mt-5">
                            <Progress value={periodMetrics.progress} aria-label={`${Math.round(periodMetrics.progress)}% of the current period elapsed`} />
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                              <span>Started {formatUsageDate(creditBalance.periodStart)}</span>
                              <span>Ends {formatUsageDate(creditBalance.periodEnd)}</span>
                            </div>
                          </div>

                          <div className="mt-5 grid grid-cols-2 divide-x divide-border rounded-xl bg-secondary/40 py-3">
                            <div className="px-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock3 className="h-4 w-4" />
                                <span className="text-xs font-medium">Time used</span>
                              </div>
                              <p className="mt-1 text-lg font-semibold text-foreground">
                                {periodMetrics.elapsedDays} {periodMetrics.elapsedDays === 1 ? 'day' : 'days'}
                              </p>
                            </div>
                            <div className="px-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                <span className="text-xs font-medium">Time remaining</span>
                              </div>
                              <p className="mt-1 text-lg font-semibold text-foreground">
                                {periodMetrics.remainingDays} {periodMetrics.remainingDays === 1 ? 'day' : 'days'}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 text-center text-xs text-muted-foreground">
                            {periodMetrics.totalDays}-day plan period
                          </p>
                        </>
                      ) : (
                        <p className="mt-4 rounded-lg bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                          Period timeline is not available for this plan.
                        </p>
                      )}
                    </div>

                    {usageLoadError ? (
                      <p className="text-center text-xs text-destructive">Refresh failed. Showing the last loaded balance.</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : activeTab === 'customizeTheme' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Customize Theme</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Solid color theme controls for the entire app.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 rounded-lg border border-border bg-secondary/20 p-4">
                    <span className="text-sm font-medium text-foreground">Primary Color</span>
                    <input
                      type="color"
                      value={themeSettings.primaryColor}
                      onChange={(event) => {
                        const primaryColor = event.target.value.toUpperCase()
                        setThemeSettings((prev) => ({ ...prev, primaryColor }))
                        setThemeStatus(null)
                      }}
                      className="h-10 w-full cursor-pointer rounded border border-border bg-background"
                    />
                    <p className="text-xs text-muted-foreground">Used for highlights and brand accents.</p>
                  </label>

                  <label className="space-y-2 rounded-lg border border-border bg-secondary/20 p-4">
                    <span className="text-sm font-medium text-foreground">Button Color</span>
                    <input
                      type="color"
                      value={themeSettings.buttonColor}
                      onChange={(event) => {
                        const buttonColor = event.target.value.toUpperCase()
                        setThemeSettings((prev) => ({ ...prev, buttonColor }))
                        setThemeStatus(null)
                      }}
                      className="h-10 w-full cursor-pointer rounded border border-border bg-background"
                    />
                    <p className="text-xs text-muted-foreground">Controls button background color separately.</p>
                  </label>

                  <label className="space-y-2 rounded-lg border border-border bg-secondary/20 p-4">
                    <span className="text-sm font-medium text-foreground">Secondary Color</span>
                    <input
                      type="color"
                      value={themeSettings.secondaryColor}
                      onChange={(event) => {
                        const secondaryColor = event.target.value.toUpperCase()
                        setThemeSettings((prev) => ({ ...prev, secondaryColor }))
                        setThemeStatus(null)
                      }}
                      className="h-10 w-full cursor-pointer rounded border border-border bg-background"
                    />
                    <p className="text-xs text-muted-foreground">Used for neutral backgrounds and soft surfaces.</p>
                  </label>

                  <label className="space-y-2 rounded-lg border border-border bg-secondary/20 p-4">
                    <span className="text-sm font-medium text-foreground">Accent Color</span>
                    <input
                      type="color"
                      value={themeSettings.accentColor}
                      onChange={(event) => {
                        const accentColor = event.target.value.toUpperCase()
                        setThemeSettings((prev) => ({ ...prev, accentColor }))
                        setThemeStatus(null)
                      }}
                      className="h-10 w-full cursor-pointer rounded border border-border bg-background"
                    />
                    <p className="text-xs text-muted-foreground">Used for accents and supporting highlights.</p>
                  </label>

                  <label className="space-y-2 rounded-lg border border-border bg-secondary/20 p-4">
                    <span className="text-sm font-medium text-foreground">Sidebar Color</span>
                    <input
                      type="color"
                      value={themeSettings.sidebarColor}
                      onChange={(event) => {
                        const sidebarColor = event.target.value.toUpperCase()
                        setThemeSettings((prev) => ({ ...prev, sidebarColor }))
                        setThemeStatus(null)
                      }}
                      className="h-10 w-full cursor-pointer rounded border border-border bg-background"
                    />
                    <p className="text-xs text-muted-foreground">Controls the left sidebar background independently.</p>
                  </label>

                  <label className="block space-y-2 rounded-lg border border-border bg-secondary/20 p-4">
                    <span className="text-sm font-medium text-foreground">Text Color</span>
                    <input
                      type="color"
                      value={themeSettings.textColor}
                      onChange={(event) => {
                        const textColor = event.target.value.toUpperCase()
                        setThemeSettings((prev) => ({ ...prev, textColor }))
                        setThemeStatus(null)
                      }}
                      className="h-10 w-full cursor-pointer rounded border border-border bg-background"
                    />
                    <p className="text-xs text-muted-foreground">Contrast (Light): {textContrastOnLight}:1 ({getContrastRating(textContrastOnLight)})</p>
                    <p className="text-xs text-muted-foreground">Contrast (Dark): {textContrastOnDark}:1 ({getContrastRating(textContrastOnDark)})</p>
                    <p className="text-xs text-muted-foreground">For readable paragraph text.</p>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2 rounded-lg border border-border bg-secondary/20 p-4">
                    <span className="text-sm font-medium text-foreground">Body Font (Paragraph)</span>
                    <select
                      value={themeSettings.bodyFontFamily}
                      onChange={(event) => {
                        const bodyFontFamily = event.target.value
                        setThemeSettings((prev) => ({ ...prev, bodyFontFamily }))
                        setThemeStatus(null)
                      }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      {THEME_FONT_OPTIONS.map((fontOption) => (
                        <option key={fontOption.id} value={fontOption.value}>
                          {fontOption.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">Applied globally for body text and paragraph-heavy content.</p>
                  </label>

                  <label className="block space-y-2 rounded-lg border border-border bg-secondary/20 p-4">
                    <span className="text-sm font-medium text-foreground">Heading Font</span>
                    <select
                      value={themeSettings.headingFontFamily}
                      onChange={(event) => {
                        const headingFontFamily = event.target.value
                        setThemeSettings((prev) => ({ ...prev, headingFontFamily }))
                        setThemeStatus(null)
                      }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      {THEME_FONT_OPTIONS.map((fontOption) => (
                        <option key={fontOption.id} value={fontOption.value}>
                          {fontOption.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">Applied globally for headings.</p>
                  </label>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Preview</p>
                  <div className="mt-3 rounded-lg border border-border p-4">
                      <h4 className="text-base font-semibold" style={{ fontFamily: themeSettings.headingFontFamily, color: themeSettings.textColor }}>Neurova Theme Preview Heading</h4>
                    <p className="mt-1 text-sm" style={{ fontFamily: themeSettings.bodyFontFamily, color: themeSettings.textColor }}>This paragraph preview uses your selected text color and body font family.</p>
                    <button className="mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: themeSettings.buttonColor, color: '#FFFFFF' }}>Preview Button</button>
                    <div className="mt-3 flex gap-2">
                      <span className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: themeSettings.primaryColor }} />
                      <span className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: themeSettings.buttonColor }} />
                      <span className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: themeSettings.secondaryColor }} />
                      <span className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: themeSettings.accentColor }} />
                      <span className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: themeSettings.sidebarColor }} />
                      <span className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: themeSettings.textColor }} />
                    </div>
                  </div>
                </div>

                {themeStatus && <p className="text-sm text-primary">{themeStatus}</p>}

                <div className="flex flex-wrap gap-3">
                  <button onClick={saveThemeSettings} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Save Theme</button>
                  <button onClick={resetThemeSettings} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"><RotateCcw className="h-4 w-4" />Reset</button>
                </div>
              </div>
            ) : activeTab === 'billing' ? null : (
              <div className="rounded-xl border border-border bg-secondary/10 p-5">
                <h3 className="text-base font-semibold text-foreground">{menuItems.find((item) => item.id === activeTab)?.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">This section will be added soon. For now, only Personalized AI is enabled.</p>
              </div>
            )}

            <div className={activeTab === 'billing' ? 'block' : 'hidden'}>
              <BillingSettings
                isActive={activeTab === 'billing'}
                creditLimitDetails={creditLimitDetails}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
