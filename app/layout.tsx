import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import {
  DEFAULT_THEME_CUSTOMIZATION,
  THEME_CUSTOMIZATION_STORAGE_KEY,
  THEME_FONT_OPTIONS,
} from '@/components/settings/theme-customization'
import './globals.css'
import Nav from '@/components/resizable-navbar'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const themeInitScript = `
(() => {
  const STORAGE_KEY = ${JSON.stringify(THEME_CUSTOMIZATION_STORAGE_KEY)};
  const DEFAULT_THEME = ${JSON.stringify(DEFAULT_THEME_CUSTOMIZATION)};
  const FONT_OPTIONS = ${JSON.stringify(THEME_FONT_OPTIONS.map((option) => option.value))};
  const HEX_COLOR_PATTERN = /^#([0-9a-f]{6})$/i;

  const normalizeHexColor = (value, fallback) => {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim();
    return HEX_COLOR_PATTERN.test(normalized) ? normalized.toUpperCase() : fallback;
  };

  const normalizeFontFamily = (value, fallback) => {
    return typeof value === 'string' && FONT_OPTIONS.includes(value) ? value : fallback;
  };

  const hexToRgb = (hex) => {
    const normalized = normalizeHexColor(hex, '#000000').slice(1);
    return {
      red: Number.parseInt(normalized.slice(0, 2), 16),
      green: Number.parseInt(normalized.slice(2, 4), 16),
      blue: Number.parseInt(normalized.slice(4, 6), 16),
    };
  };

  const rgbToHex = ({ red, green, blue }) => {
    const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
    const hex = [clamp(red), clamp(green), clamp(blue)]
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('');
    return '#' + hex.toUpperCase();
  };

  const mixHexColors = (foregroundHex, backgroundHex, foregroundWeight) => {
    const safeWeight = Math.max(0, Math.min(1, foregroundWeight));
    const foreground = hexToRgb(foregroundHex);
    const background = hexToRgb(backgroundHex);
    return rgbToHex({
      red: foreground.red * safeWeight + background.red * (1 - safeWeight),
      green: foreground.green * safeWeight + background.green * (1 - safeWeight),
      blue: foreground.blue * safeWeight + background.blue * (1 - safeWeight),
    });
  };

  const getContrastColor = (hex) => {
    const { red, green, blue } = hexToRgb(hex);
    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
    return luminance > 0.6 ? '#1A1A1A' : '#FFFFFF';
  };

  const normalizeTheme = (value) => {
    const raw = value && typeof value === 'object' ? value : {};

    const legacyFont = typeof raw.fontFamily === 'string' ? raw.fontFamily : undefined;

    const bodyFontFamily = normalizeFontFamily(
      raw.bodyFontFamily || legacyFont,
      DEFAULT_THEME.bodyFontFamily,
    );

    const headingFontFamily = normalizeFontFamily(
      raw.headingFontFamily || legacyFont,
      DEFAULT_THEME.headingFontFamily,
    );

    return {
      primaryColor: normalizeHexColor(raw.primaryColor, DEFAULT_THEME.primaryColor),
      buttonColor:
        typeof raw.buttonColor === 'string'
          ? normalizeHexColor(raw.buttonColor, DEFAULT_THEME.buttonColor)
          : normalizeHexColor(raw.primaryColor, DEFAULT_THEME.buttonColor),
      accentColor: normalizeHexColor(raw.accentColor, DEFAULT_THEME.accentColor),
      secondaryColor: normalizeHexColor(raw.secondaryColor, DEFAULT_THEME.secondaryColor),
      sidebarColor: normalizeHexColor(raw.sidebarColor, DEFAULT_THEME.sidebarColor),
      textColor: normalizeHexColor(raw.textColor, DEFAULT_THEME.textColor),
      bodyFontFamily,
      headingFontFamily,
    };
  };

  const root = document.documentElement;
  let theme = DEFAULT_THEME;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) theme = normalizeTheme(JSON.parse(raw));
  } catch {
    theme = DEFAULT_THEME;
  }

  const primaryForeground = getContrastColor(theme.primaryColor);
  const buttonForeground = getContrastColor(theme.buttonColor);
  const accentForeground = getContrastColor(theme.accentColor);
  const secondaryForeground = getContrastColor(theme.secondaryColor);
  const sidebarForeground = getContrastColor(theme.sidebarColor);
  const accentRgb = hexToRgb(theme.accentColor);
  const mutedText = mixHexColors(theme.textColor, '#FFFFFF', 0.62);
  const sidebarBorder = mixHexColors(sidebarForeground, theme.sidebarColor, 0.16);

  root.style.setProperty('--primary', theme.primaryColor);
  root.style.setProperty('--primary-foreground', primaryForeground);
  root.style.setProperty('--ring', theme.primaryColor);
  root.style.setProperty('--chart-1', theme.primaryColor);

  root.style.setProperty('--button', theme.buttonColor);
  root.style.setProperty('--button-foreground', buttonForeground);

  root.style.setProperty('--accent', theme.accentColor);
  root.style.setProperty('--accent-foreground', accentForeground);

  root.style.setProperty('--secondary', theme.secondaryColor);
  root.style.setProperty('--secondary-foreground', secondaryForeground);

  root.style.setProperty('--sidebar', theme.sidebarColor);
  root.style.setProperty('--sidebar-border', sidebarBorder);

  root.style.setProperty('--foreground', theme.textColor);
  root.style.setProperty('--card-foreground', theme.textColor);
  root.style.setProperty('--popover-foreground', theme.textColor);
  root.style.setProperty('--muted-foreground', mutedText);

  root.style.setProperty('--sidebar-foreground', sidebarForeground);
  root.style.setProperty('--sidebar-primary', theme.primaryColor);
  root.style.setProperty('--sidebar-primary-foreground', primaryForeground);
  root.style.setProperty('--sidebar-ring', theme.primaryColor);
  root.style.setProperty('--sidebar-accent', 'rgba(' + accentRgb.red + ', ' + accentRgb.green + ', ' + accentRgb.blue + ', 0.22)');
  root.style.setProperty('--sidebar-accent-foreground', theme.accentColor);

  root.style.setProperty('--font-sans', theme.bodyFontFamily);
  root.style.setProperty('--font-serif', theme.headingFontFamily);
  root.style.setProperty('--app-font-body', theme.bodyFontFamily);
  root.style.setProperty('--app-font-heading', theme.headingFontFamily);
})();
`

export const metadata: Metadata = {
  title: 'Neurova - AI-Powered Study Platform',
  description: 'Create interactive study materials, flashcards, quizzes, and grade your papers with AI-powered feedback',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
   <Nav>
        {children}
    </Nav>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
