const DEFAULT_SITE_URL = 'https://goneurova.com'

export function getSiteUrl() {
  const rawValue = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!rawValue) return DEFAULT_SITE_URL

  try {
    return new URL(rawValue).toString().replace(/\/$/, '')
  } catch {
    return DEFAULT_SITE_URL
  }
}

export function getMetadataBase() {
  return new URL(getSiteUrl())
}

export function absoluteUrl(path: string = '/') {
  return new URL(path, `${getSiteUrl()}/`).toString()
}
