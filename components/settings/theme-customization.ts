export const THEME_CUSTOMIZATION_STORAGE_KEY = 'Tutora-theme-customization'

export type ThemeCustomization = {
  primaryColor: string
  buttonColor: string
  accentColor: string
  secondaryColor: string
  sidebarColor: string
  textColor: string
  bodyFontFamily: string
  headingFontFamily: string
}

type LegacyThemeCustomization = {
  primaryColor: string
  accentColor: string
  textColor?: string
  fontFamily: string
}

type LegacyThemeCustomizationV2 = {
  primaryColor: string
  accentColor: string
  bodyFontFamily: string
  headingFontFamily: string
}

type LegacyThemeCustomizationV3 = {
  primaryColor: string
  accentColor: string
  textColor: string
  bodyFontFamily: string
  headingFontFamily: string
}

type LegacyThemeCustomizationV4 = {
  primaryColor: string
  accentColor: string
  secondaryColor: string
  textColor: string
  bodyFontFamily: string
  headingFontFamily: string
}

type LegacyThemeCustomizationV5 = {
  primaryColor: string
  accentColor: string
  secondaryColor: string
  sidebarColor: string
  textColor: string
  bodyFontFamily: string
  headingFontFamily: string
}

export type ThemeFontOption = {
  id: string
  label: string
  value: string
}

export const THEME_FONT_OPTIONS: ThemeFontOption[] = [
  {
    id: 'geist',
    label: 'Geist (Default)',
    value: "'Geist', 'Geist Fallback', system-ui, sans-serif",
  },
  {
    id: 'segoe',
    label: 'Segoe UI',
    value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  {
    id: 'arial',
    label: 'Arial',
    value: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
  },
  {
    id: 'trebuchet',
    label: 'Trebuchet',
    value: "'Trebuchet MS', 'Segoe UI', sans-serif",
  },
  {
    id: 'georgia',
    label: 'Georgia',
    value: "Georgia, 'Times New Roman', serif",
  },
]

export const DEFAULT_THEME_CUSTOMIZATION: ThemeCustomization = {
  primaryColor: '#5B65E0',
  buttonColor: '#5B65E0',
  accentColor: '#afc0fd',
  secondaryColor: '#F5F5F5',
  sidebarColor: '#f5f6ff',
  textColor: '#1A1A1A',
  bodyFontFamily: THEME_FONT_OPTIONS[0].value,
  headingFontFamily: THEME_FONT_OPTIONS[0].value,
  
}

const HEX_COLOR_PATTERN = /^#([0-9a-f]{6})$/i

const isThemeCustomization = (value: unknown): value is ThemeCustomization => {
  if (!value || typeof value !== 'object') return false
  const draft = value as Partial<ThemeCustomization>
  return (
    typeof draft.primaryColor === 'string' &&
    typeof draft.buttonColor === 'string' &&
    typeof draft.accentColor === 'string' &&
    typeof draft.secondaryColor === 'string' &&
    typeof draft.sidebarColor === 'string' &&
    typeof draft.textColor === 'string' &&
    typeof draft.bodyFontFamily === 'string' &&
    typeof draft.headingFontFamily === 'string'
  )
}

const normalizeHexColor = (value: string, fallback: string) => {
  const normalized = value.trim()
  return HEX_COLOR_PATTERN.test(normalized) ? normalized.toUpperCase() : fallback
}

const normalizeFontFamily = (value: string) => {
  const matched = THEME_FONT_OPTIONS.find((option) => option.value === value)
  return matched?.value ?? DEFAULT_THEME_CUSTOMIZATION.bodyFontFamily
}

const hexToRgb = (hex: string) => {
  const normalized = normalizeHexColor(hex, '#000000').slice(1)
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  return { red, green, blue }
}

const rgbToHex = ({ red, green, blue }: { red: number; green: number; blue: number }) => {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)))
  const hex = [clamp(red), clamp(green), clamp(blue)]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
  return `#${hex.toUpperCase()}`
}

const hexToRgba = (hex: string, alpha: number) => {
  const { red, green, blue } = hexToRgb(hex)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const mixHexColors = (foregroundHex: string, backgroundHex: string, foregroundWeight: number) => {
  const safeWeight = Math.max(0, Math.min(1, foregroundWeight))
  const foreground = hexToRgb(foregroundHex)
  const background = hexToRgb(backgroundHex)

  return rgbToHex({
    red: foreground.red * safeWeight + background.red * (1 - safeWeight),
    green: foreground.green * safeWeight + background.green * (1 - safeWeight),
    blue: foreground.blue * safeWeight + background.blue * (1 - safeWeight),
  })
}

const toRelativeChannel = (channel: number) => {
  const normalized = channel / 255
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

const getRelativeLuminance = (hex: string) => {
  const { red, green, blue } = hexToRgb(hex)
  return 0.2126 * toRelativeChannel(red) + 0.7152 * toRelativeChannel(green) + 0.0722 * toRelativeChannel(blue)
}

export const getContrastRatio = (foregroundHex: string, backgroundHex: string) => {
  const foreground = getRelativeLuminance(normalizeHexColor(foregroundHex, '#000000'))
  const background = getRelativeLuminance(normalizeHexColor(backgroundHex, '#FFFFFF'))
  const lighter = Math.max(foreground, background)
  const darker = Math.min(foreground, background)
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
}

const getContrastColor = (hex: string) => {
  const { red, green, blue } = hexToRgb(hex)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  return luminance > 0.6 ? '#1A1A1A' : '#FFFFFF'
}

const normalizeThemeCustomization = (customization: ThemeCustomization): ThemeCustomization => ({
  primaryColor: normalizeHexColor(customization.primaryColor, DEFAULT_THEME_CUSTOMIZATION.primaryColor),
  buttonColor: normalizeHexColor(customization.buttonColor, DEFAULT_THEME_CUSTOMIZATION.buttonColor),
  accentColor: normalizeHexColor(customization.accentColor, DEFAULT_THEME_CUSTOMIZATION.accentColor),
  secondaryColor: normalizeHexColor(customization.secondaryColor, DEFAULT_THEME_CUSTOMIZATION.secondaryColor),
  sidebarColor: normalizeHexColor(customization.sidebarColor, DEFAULT_THEME_CUSTOMIZATION.sidebarColor),
  textColor: normalizeHexColor(customization.textColor, DEFAULT_THEME_CUSTOMIZATION.textColor),
  bodyFontFamily: normalizeFontFamily(customization.bodyFontFamily),
  headingFontFamily: normalizeFontFamily(customization.headingFontFamily),
})

export const getStoredThemeCustomization = (): ThemeCustomization => {
  if (typeof window === 'undefined') return DEFAULT_THEME_CUSTOMIZATION

  try {
    const raw = window.localStorage.getItem(THEME_CUSTOMIZATION_STORAGE_KEY)
    if (!raw) return DEFAULT_THEME_CUSTOMIZATION
    const parsed = JSON.parse(raw) as Record<string, unknown>

    if (isThemeCustomization(parsed)) return normalizeThemeCustomization(parsed)

    const legacyFont = typeof parsed.fontFamily === 'string' ? parsed.fontFamily : undefined
    const bodyFontFamily = typeof parsed.bodyFontFamily === 'string' ? parsed.bodyFontFamily : legacyFont
    const headingFontFamily = typeof parsed.headingFontFamily === 'string' ? parsed.headingFontFamily : legacyFont

    const parsedTheme: ThemeCustomization = {
      primaryColor:
        typeof parsed.primaryColor === 'string' ? parsed.primaryColor : DEFAULT_THEME_CUSTOMIZATION.primaryColor,
      buttonColor:
        typeof parsed.buttonColor === 'string'
          ? parsed.buttonColor
          : typeof parsed.primaryColor === 'string'
            ? parsed.primaryColor
            : DEFAULT_THEME_CUSTOMIZATION.buttonColor,
      accentColor:
        typeof parsed.accentColor === 'string' ? parsed.accentColor : DEFAULT_THEME_CUSTOMIZATION.accentColor,
      secondaryColor:
        typeof parsed.secondaryColor === 'string' ? parsed.secondaryColor : DEFAULT_THEME_CUSTOMIZATION.secondaryColor,
      sidebarColor:
        typeof parsed.sidebarColor === 'string' ? parsed.sidebarColor : DEFAULT_THEME_CUSTOMIZATION.sidebarColor,
      textColor: typeof parsed.textColor === 'string' ? parsed.textColor : DEFAULT_THEME_CUSTOMIZATION.textColor,
      bodyFontFamily: bodyFontFamily ?? DEFAULT_THEME_CUSTOMIZATION.bodyFontFamily,
      headingFontFamily: headingFontFamily ?? DEFAULT_THEME_CUSTOMIZATION.headingFontFamily,
    }

    return normalizeThemeCustomization(parsedTheme)
  } catch {
    return DEFAULT_THEME_CUSTOMIZATION
  }
}

export const persistThemeCustomization = (customization: ThemeCustomization) => {
  if (typeof window === 'undefined') return
  const normalized = normalizeThemeCustomization(customization)
  window.localStorage.setItem(THEME_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(normalized))
}

export const clearThemeCustomization = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(THEME_CUSTOMIZATION_STORAGE_KEY)
}

export const applyThemeCustomization = (customization: ThemeCustomization) => {
  if (typeof document === 'undefined') return

  const normalized = normalizeThemeCustomization(customization)
  const primaryForeground = getContrastColor(normalized.primaryColor)
  const buttonForeground = getContrastColor(normalized.buttonColor)
  const accentForeground = getContrastColor(normalized.accentColor)
  const secondaryForeground = getContrastColor(normalized.secondaryColor)
  const sidebarForeground = getContrastColor(normalized.sidebarColor)
  const mutedText = mixHexColors(normalized.textColor, '#FFFFFF', 0.62)
  const sidebarBorder = mixHexColors(sidebarForeground, normalized.sidebarColor, 0.16)
  const root = document.documentElement

  root.style.setProperty('--primary', normalized.primaryColor)
  root.style.setProperty('--primary-foreground', primaryForeground)
  root.style.setProperty('--ring', normalized.primaryColor)
  root.style.setProperty('--chart-1', normalized.primaryColor)

  root.style.setProperty('--button', normalized.buttonColor)
  root.style.setProperty('--button-foreground', buttonForeground)

  root.style.setProperty('--accent', normalized.accentColor)
  root.style.setProperty('--accent-foreground', accentForeground)

  root.style.setProperty('--secondary', normalized.secondaryColor)
  root.style.setProperty('--secondary-foreground', secondaryForeground)

  root.style.setProperty('--sidebar', normalized.sidebarColor)
  root.style.setProperty('--sidebar-border', sidebarBorder)

  root.style.setProperty('--foreground', normalized.textColor)
  root.style.setProperty('--card-foreground', normalized.textColor)
  root.style.setProperty('--popover-foreground', normalized.textColor)
  root.style.setProperty('--muted-foreground', mutedText)

  root.style.setProperty('--sidebar-foreground', sidebarForeground)
  root.style.setProperty('--sidebar-primary', normalized.primaryColor)
  root.style.setProperty('--sidebar-primary-foreground', primaryForeground)
  root.style.setProperty('--sidebar-ring', normalized.primaryColor)
  root.style.setProperty('--sidebar-accent', hexToRgba(normalized.accentColor, 0.22))
  root.style.setProperty('--sidebar-accent-foreground', normalized.accentColor)

  root.style.setProperty('--font-sans', normalized.bodyFontFamily)
  root.style.setProperty('--font-serif', normalized.headingFontFamily)
  root.style.setProperty('--app-font-body', normalized.bodyFontFamily)
  root.style.setProperty('--app-font-heading', normalized.headingFontFamily)
}
