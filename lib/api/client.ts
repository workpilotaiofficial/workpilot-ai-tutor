import { signOut } from 'firebase/auth'
import {
  clearAuthBrowserState,
  getStoredAuthObject,
  isStoredAccessTokenExpired,
  isStoredRefreshTokenUsable,
  replaceStoredAuthObject,
  type StoredAuthObject,
} from '@/lib/api/session-storage'
import { auth } from '@/lib/firebase'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type ApiRequestOptions = {
  method?: HttpMethod
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  omitDefaultHeaders?: boolean
  omitAuthHeader?: boolean
  retryOnUnauthorized?: boolean
}

type ApiClientConfig = {
  baseUrl?: string
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15_000

export class ApiClientError extends Error {
  status: number
  data: unknown

  constructor(message: string, status = 0, data: unknown = null) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.data = data
  }
}

function isStoredAuthObject(value: unknown): value is StoredAuthObject {
  if (!value || typeof value !== 'object') {
    return false
  }

  return (
    'token_type' in value &&
    typeof value.token_type === 'string' &&
    'access_token' in value &&
    typeof value.access_token === 'string' &&
    'expires_at' in value &&
    typeof value.expires_at === 'string' &&
    'refresh_token' in value &&
    typeof value.refresh_token === 'string' &&
    'refresh_expires_at' in value &&
    typeof value.refresh_expires_at === 'string'
  )
}

function normalizeRefreshAuthPayload(payload: unknown): StoredAuthObject | null {
  if (isStoredAuthObject(payload)) {
    return payload
  }

  if (!payload || typeof payload !== 'object' || !('auth' in payload)) {
    return null
  }

  const authPayload = payload.auth
  return isStoredAuthObject(authPayload) ? authPayload : null
}

function isBodyInit(body: unknown): body is BodyInit {
  return (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  )
}

function extractErrorMessage(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return null
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error
  }

  if ('detail' in payload) {
    const detail = payload.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (Array.isArray(detail) && detail.length > 0) {
      const firstDetail = detail[0]

      if (firstDetail && typeof firstDetail === 'object' && 'msg' in firstDetail && typeof firstDetail.msg === 'string') {
        return firstDetail.msg
      }
    }
  }

  return null
}

function parseResponsePayload(responseText: string): unknown {
  if (!responseText) {
    return null
  }

  try {
    return JSON.parse(responseText)
  } catch {
    return responseText
  }
}

export class ApiClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private refreshPromise: Promise<StoredAuthObject | null> | null = null

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '')
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  private createRequestUrl(path: string) {
    return `${this.baseUrl}${path}`
  }

  private async executeFetch(
    path: string,
    method: HttpMethod,
    requestBody: BodyInit | undefined,
    headers: Headers,
    signal?: AbortSignal,
  ) {
    const abortController = new AbortController()
    const timeoutHandle = setTimeout(() => abortController.abort(), this.timeoutMs)

    if (signal) {
      signal.addEventListener('abort', () => abortController.abort(), { once: true })
    }

    try {
      return await fetch(this.createRequestUrl(path), {
        method,
        body: requestBody,
        headers,
        signal: abortController.signal,
      })
    } finally {
      clearTimeout(timeoutHandle)
    }
  }

  private async handleAuthFailure() {
    if (typeof window === 'undefined') {
      return
    }

    console.warn('Auth failure - clearing session')

    if (auth) {
      await signOut(auth).catch(() => null)
    }

    clearAuthBrowserState()
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const response = await this.request<unknown>('/api/v1/auth/refresh', {
        method: 'POST',
        body: {
          refresh_token: refreshToken,
        },
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        omitAuthHeader: true,
        retryOnUnauthorized: false,
      })

      const normalizedAuth = normalizeRefreshAuthPayload(response)

      if (!normalizedAuth) {
        console.error('Invalid refresh response format:', response)
        throw new ApiClientError('Refresh token response did not include a valid auth session.')
      }

      return normalizedAuth
    } catch (error) {
      console.error('Refresh token error:', error)
      throw error
    }
  }

  private async refreshStoredSession() {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      const storedAuth = getStoredAuthObject()

      if (!storedAuth?.refresh_token) {
        console.warn('No refresh token available')
        await this.handleAuthFailure()
        return null
      }

      if (!isStoredRefreshTokenUsable()) {
        console.warn('Refresh token is expired or unusable')
        await this.handleAuthFailure()
        return null
      }

      try {
        console.log('Attempting to refresh access token...')
        const refreshedAuth = await this.refreshAccessToken(storedAuth.refresh_token)
        replaceStoredAuthObject(refreshedAuth)
        console.log('Access token refreshed successfully')
        return refreshedAuth
      } catch (error) {
        console.error('Failed to refresh access token:', error)
        await this.handleAuthFailure()
        return null
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async ensureValidAccessToken() {
    const storedAuth = getStoredAuthObject()

    if (!storedAuth) {
      return null
    }

    if (!storedAuth.access_token || isStoredAccessTokenExpired()) {
      const refreshedAuth = await this.refreshStoredSession()
      return refreshedAuth?.access_token ?? null
    }

    return storedAuth.access_token
  }

  async request<TResponse>(path: string, options: ApiRequestOptions = {}) {
    const {
      method = 'GET',
      body,
      headers,
      signal,
      omitDefaultHeaders = false,
      omitAuthHeader = false,
      retryOnUnauthorized = true,
    } = options

    const requestHeaders = new Headers()

    if (!omitDefaultHeaders) {
      requestHeaders.set('accept', 'application/json')
    }

    if (!omitAuthHeader) {
      const accessToken = await this.ensureValidAccessToken()

      if (accessToken) {
        requestHeaders.set('authorization', `Bearer ${accessToken}`)
      }
    }

    if (headers) {
      const customHeaders = new Headers(headers)
      customHeaders.forEach((value, key) => {
        requestHeaders.set(key, value)
      })
    }

    let requestBody: BodyInit | undefined

    if (typeof body !== 'undefined') {
      if (isBodyInit(body)) {
        requestBody = body
      } else {
        requestBody = JSON.stringify(body)

        if (!omitDefaultHeaders && !requestHeaders.has('content-type')) {
          requestHeaders.set('content-type', 'application/json')
        }
      }
    }

    try {
      let response = await this.executeFetch(path, method, requestBody, requestHeaders, signal)

      if (response.status === 401 && !omitAuthHeader && retryOnUnauthorized) {
        console.warn(`Got 401 for ${path}, attempting to refresh token...`)
        const refreshedAuth = await this.refreshStoredSession()

        if (refreshedAuth?.access_token) {
          console.log(`Token refreshed, retrying ${path}...`)
          requestHeaders.set('authorization', `Bearer ${refreshedAuth.access_token}`)
          response = await this.executeFetch(path, method, requestBody, requestHeaders, signal)
        } else {
          console.error(`Token refresh failed for ${path}`)
        }
      }

      const responseText = await response.text()
      const responseData = parseResponsePayload(responseText)

      if (!response.ok) {
        const message = extractErrorMessage(responseData) ?? `Request failed with status ${response.status}`
        throw new ApiClientError(message, response.status, responseData)
      }

      return responseData as TResponse
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiClientError('Request timed out. Please try again.')
      }

      throw new ApiClientError('Network error. Please check your connection and try again.')
    }
  }
}

export const apiClient = new ApiClient()

export function getApiClientErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiClientError) {
    return error.message
  }

  return fallbackMessage
}
