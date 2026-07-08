'use client'

import { useCallback, useEffect, useState } from 'react'
import { BarChart3, LoaderCircle, RefreshCcw, RotateCcw, X } from 'lucide-react'
import BillingSettings from '@/components/settings/billing-settings'
import { Button } from '@/components/ui/button'
import {
  fetchCreditBalance,
  fetchPersonalization,
  getApiClientErrorMessage,
  PERSONALIZATION_INSTRUCTIONS_MAX_LENGTH,
  updatePersonalization,
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

export type SettingsTab = 'account' | 'profile' | 'usage' | 'billing' | 'personalizedAi' | 'customizeTheme'

const menuItems: Array<{ id: SettingsTab; label: string }> = [
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
  { id: 'usage', label: 'Usage' },
  { id: 'billing', label: 'Billing' },
  { id: 'personalizedAi', label: 'Personalized AI' },
  { id: 'customizeTheme', label: 'Customize Theme' },
]

interface SettingsModalProps {
  onClose: () => void
  initialTab?: SettingsTab
}

const LIGHT_BACKGROUND_REFERENCE = '#FFFFFF'
const DARK_BACKGROUND_REFERENCE = '#1A1A1A'

const getContrastRating = (ratio: number) => {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'Large Text Only'
  return 'Fail'
}

export default function SettingsModal({ onClose, initialTab = 'personalizedAi' }: SettingsModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)
  const [instructions, setInstructions] = useState('')
  const [hasLoadedPersonalization, setHasLoadedPersonalization] = useState(false)
  const [isPersonalizationLoading, setIsPersonalizationLoading] = useState(false)
  const [themeSettings, setThemeSettings] = useState<ThemeCustomization>(DEFAULT_THEME_CUSTOMIZATION)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [themeStatus, setThemeStatus] = useState<string | null>(null)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [hasLoadedUsage, setHasLoadedUsage] = useState(false)
  const [isUsageLoading, setIsUsageLoading] = useState(false)
  const textContrastOnLight = getContrastRatio(themeSettings.textColor, LIGHT_BACKGROUND_REFERENCE)
  const textContrastOnDark = getContrastRatio(themeSettings.textColor, DARK_BACKGROUND_REFERENCE)

  useEffect(() => {
    setThemeSettings(getStoredThemeCustomization())
  }, [])

  const loadPersonalization = useCallback(async () => {
    setIsPersonalizationLoading(true)

    try {
      const result = await fetchPersonalization()
      setInstructions(result.instructions)
      setHasLoadedPersonalization(true)
    } catch (error) {
      toast({
        title: 'Unable to load instructions',
        description: getApiClientErrorMessage(error, 'Your personalization could not be loaded.'),
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

    try {
      const result = await fetchCreditBalance()
      setCreditBalance(result.current)
      setHasLoadedUsage(true)
    } catch (error) {
      toast({
        title: 'Unable to load usage',
        description: getApiClientErrorMessage(error, 'Current balance could not be loaded.'),
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

  const saveInstructions = async () => {
    const trimmed = instructions.trim()
    if (!trimmed) return

    setIsSaving(true)
    setStatus(null)

    try {
      const result = await updatePersonalization({ instructions: trimmed })
      setInstructions(result.instructions || trimmed)
      setStatus('Personalized AI instructions saved successfully.')
    } catch (error) {
      toast({
        title: 'Unable to save instructions',
        description: getApiClientErrorMessage(error, 'Your instructions could not be saved.'),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 md:p-8" onClick={onClose} role="presentation">
      <div className="mx-auto flex h-full max-h-[720px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Settings">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">Manage account and personalization preferences.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-secondary" aria-label="Close settings"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="w-full max-w-[220px] border-r border-border bg-secondary/20 p-3">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const active = activeTab === item.id
                return <button key={item.id} onClick={() => { setActiveTab(item.id); setStatus(null); setThemeStatus(null) }} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}>{item.label}</button>
              })}
            </nav>
          </aside>

          <section className="min-h-0 flex-1 overflow-auto px-6 py-5">
            {activeTab === 'personalizedAi' ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Personalized AI</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Add custom instructions to tailor how the AI responds to you. These will be applied across your sessions.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="personalization-instructions" className="text-sm font-medium text-foreground">Instructions</label>
                  <textarea
                    id="personalization-instructions"
                    value={instructions}
                    maxLength={PERSONALIZATION_INSTRUCTIONS_MAX_LENGTH}
                    onChange={(event) => { setInstructions(event.target.value); setStatus(null) }}
                    disabled={isPersonalizationLoading}
                    rows={8}
                    placeholder="e.g. Explain concepts step by step, use simple language, and include practice examples."
                    className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <p className="text-right text-xs text-muted-foreground">{instructions.length} / {PERSONALIZATION_INSTRUCTIONS_MAX_LENGTH}</p>
                </div>

                {isPersonalizationLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Loading your instructions...</p>}
                {status && <p className="text-sm text-primary">{status}</p>}

                <button onClick={saveInstructions} disabled={!instructions.trim() || isSaving || isPersonalizationLoading} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Saving...' : 'Save'}</button>
              </div>
            ) : activeTab === 'usage' ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Usage</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Your current credit balance.</p>
                  </div>

                  <Button variant="outline" onClick={() => void loadCreditBalance()} disabled={isUsageLoading}>
                    {isUsageLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Refresh
                  </Button>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/10 p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <BarChart3 className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">
                        {isUsageLoading && !hasLoadedUsage ? 'Loading...' : (creditBalance ?? 0).toLocaleString('en-US')}
                      </p>
                     
                    </div>
                  </div>
                </div>
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
                      <h4 className="text-base font-semibold" style={{ fontFamily: themeSettings.headingFontFamily, color: themeSettings.textColor }}>WorkPilot Theme Preview Heading</h4>
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
              <BillingSettings isActive={activeTab === 'billing'} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
