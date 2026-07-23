import { signOut } from 'firebase/auth'
import {
  clearAuthBrowserState,
  getStoredAuthObject,
  isStoredAccessTokenExpired,
  replaceStoredAuthObject,
  type StoredAuthObject,
} from '@/lib/api/session-storage'
import { auth } from '@/lib/firebase'
export const CREDIT_LIMIT_REACHED_EVENT =
  'Neurova:credit-limit-reached'

export type CreditLimitReachedEventDetail = {
  message: string
  path: string
  data: unknown
  status: number
}
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type ApiRequestOptions = {
  method?: HttpMethod
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  omitDefaultHeaders?: boolean
  omitAuthHeader?: boolean
  retryOnUnauthorized?: boolean
  timeoutMs?: number
}

type ApiStreamRequestOptions = {
  headers?: HeadersInit
  signal?: AbortSignal
  retryOnUnauthorized?: boolean
}

type ApiClientConfig = {
  baseUrl?: string
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15_000

// Auth/refresh diagnostics are only useful during development; keep production consoles clean.
const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

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

  if (!payload || typeof payload !== 'object') {
    return null
  }

  if ('auth' in payload && isStoredAuthObject(payload.auth)) {
    return payload.auth
  }

  // Support the standard API envelope: { data: auth } or { data: { auth } }.
  if ('data' in payload && payload.data && typeof payload.data === 'object') {
    if (isStoredAuthObject(payload.data)) {
      return payload.data
    }

    if ('auth' in payload.data && isStoredAuthObject(payload.data.auth)) {
      return payload.data.auth
    }
  }

  return null
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

  if ('error' in payload) {
    const errorValue = payload.error

    if (typeof errorValue === 'string') {
      return errorValue
    }

    if (
      errorValue &&
      typeof errorValue === 'object' &&
      'message' in errorValue &&
      typeof errorValue.message === 'string'
    ) {
      return errorValue.message
    }
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

function getFallbackMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'The request could not be processed. Please review your input and try again.'
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 402:
      return 'You do not have enough credits to complete this action.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'The requested resource could not be found.'
    case 408:
      return 'The request took too long. Please try again.'
    case 409:
      return 'This action conflicts with the current state. Please refresh and try again.'
    case 413:
      return 'The file or content is too large to upload.'
    case 422:
      return 'Some of the submitted information is invalid. Please review and try again.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
  }

  if (status >= 500) {
    return 'Something went wrong on our end. Please try again in a moment.'
  }

  return `Request failed (${status}). Please try again.`
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
    timeoutMs?: number,
  ) {
    const abortController = new AbortController()
    const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs ?? this.timeoutMs)

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

    debugLog('Auth failure - clearing session')

    if (auth) {
      await signOut(auth).catch(() => null)
    }

    clearAuthBrowserState()
  }

  private createSessionExpiredError(data: unknown = null) {
    return new ApiClientError('Your session has expired. Please sign in again.', 401, data)
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
        debugLog('Invalid refresh response format')
        throw new ApiClientError('Refresh token response did not include a valid auth session.')
      }

      return normalizedAuth
    } catch (error) {
      debugLog('Refresh token error:', error)
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
        debugLog('No refresh token available')
        await this.handleAuthFailure()
        return null
      }

      try {
        debugLog('Attempting to refresh access token...')
        const refreshedAuth = await this.refreshAccessToken(storedAuth.refresh_token)
        replaceStoredAuthObject(refreshedAuth)
        debugLog('Access token refreshed successfully')
        return refreshedAuth
      } catch (error) {
        debugLog('Failed to refresh access token:', error)

        // `refresh_expires_at` is only client metadata and can be affected by
        // clock skew or an older API timestamp format. Always let the auth
        // server validate the refresh token. Also preserve the stored session
        // on transient network/server errors so a later request can retry.
        const isDefinitiveAuthRejection =
          error instanceof ApiClientError &&
          (error.status === 400 || error.status === 401 || error.status === 403)

        if (isDefinitiveAuthRejection) {
          await this.handleAuthFailure()
          return null
        }

        throw error
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async ensureValidAccessToken() {
    const storedAuth = getStoredAuthObject()

    if (!storedAuth) {
      debugLog('No stored auth session found while resolving access token.')
      return null
    }

    if (!storedAuth.access_token || isStoredAccessTokenExpired()) {
      debugLog('Stored access token is missing or expired, attempting refresh before request.')
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
      timeoutMs,
    } = options

    const requestHeaders = new Headers()

    if (!omitDefaultHeaders) {
      requestHeaders.set('accept', 'application/json')
    }

    if (!omitAuthHeader) {
      const accessToken = await this.ensureValidAccessToken()

      if (!accessToken) {
        // Never send a protected request without credentials. Apart from leaking
        // a misleading backend error, that also creates avoidable API traffic.
        throw this.createSessionExpiredError()
      }

      requestHeaders.set('authorization', `Bearer ${accessToken}`)
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
      let response = await this.executeFetch(
        path,
        method,
        requestBody,
        requestHeaders,
        signal,
        timeoutMs,
      )

      /*
       * Attempt to refresh the access token once when the API returns 401.
       */
      if (
        response.status === 401 &&
        !omitAuthHeader &&
        retryOnUnauthorized
      ) {
        debugLog(
          `Got 401 for ${path}. ` +
          `Request options: omitAuthHeader=${omitAuthHeader}, ` +
          `retryOnUnauthorized=${retryOnUnauthorized}. ` +
          'Attempting refresh...',
        )

        const refreshedAuth = await this.refreshStoredSession()

        if (!refreshedAuth?.access_token) {
          debugLog(`Token refresh failed for ${path}`)
          throw this.createSessionExpiredError()
        }

        debugLog(`Token refreshed, retrying ${path}...`)

        requestHeaders.set(
          'authorization',
          `Bearer ${refreshedAuth.access_token}`,
        )

        response = await this.executeFetch(
          path,
          method,
          requestBody,
          requestHeaders,
          signal,
          timeoutMs,
        )

        /*
         * The refreshed token was rejected too.
         * Clear the stored authentication and report session expiry.
         */
        if (response.status === 401) {
          const responseText = await response.text()
          const responseData = parseResponsePayload(responseText)

          await this.handleAuthFailure()

          throw this.createSessionExpiredError(responseData)
        }
      } else if (response.status === 401) {
        debugLog(
          `Skipping refresh retry for ${path} because request options disabled it. ` +
          `omitAuthHeader=${omitAuthHeader}, ` +
          `retryOnUnauthorized=${retryOnUnauthorized}`,
        )
      }

      const responseText = await response.text()
      const responseData = parseResponsePayload(responseText)

      if (!response.ok) {
        const message =
          extractErrorMessage(responseData) ??
          getFallbackMessageForStatus(response.status)

        const apiError = new ApiClientError(
          message,
          response.status,
          responseData,
        )

        /*
         * A 402 response means the user does not have enough credits.
         * Dispatch a global event so the dashboard can open the billing modal.
         *
         * Billing endpoints are excluded to avoid reopening the same modal
         * when a checkout or credit request itself fails.
         */
        const isBillingRequest =
          path.startsWith('/api/v1/payments/') ||
          path.startsWith('/api/v1/credits/') ||
          path.startsWith('/api/v1/subscriptions/')

        if (
          response.status === 402 &&
          !isBillingRequest &&
          typeof window !== 'undefined'
        ) {
          window.dispatchEvent(
            new CustomEvent<CreditLimitReachedEventDetail>(
              CREDIT_LIMIT_REACHED_EVENT,
              {
                detail: {
                  message,
                  path,
                  status: response.status,
                  data: responseData,
                },
              },
            ),
          )
        }

        throw apiError
      }

      return responseData as TResponse
    } catch (error) {
      /*
       * Preserve errors that already came from the API client,
       * including 401, 402, validation errors and server errors.
       */
      if (error instanceof ApiClientError) {
        throw error
      }

      /*
       * AbortError may be caused by the configured request timeout
       * or by another AbortController.
       */
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        throw new ApiClientError(
          'Request timed out. Please try again.',
          408,
          null,
        )
      }

      debugLog(`Network request failed for ${path}`, error)

      throw new ApiClientError(
        'Network error. Please check your connection and try again.',
        0,
        null,
      )
    }
  }

  async requestStream(path: string, options: ApiStreamRequestOptions = {}) {
    const {
      headers,
      signal,
      retryOnUnauthorized = true,
    } = options
    const accessToken = await this.ensureValidAccessToken()

    if (!accessToken) {
      throw this.createSessionExpiredError()
    }

    const requestHeaders = new Headers(headers)
    requestHeaders.set('authorization', `Bearer ${accessToken}`)
    if (!requestHeaders.has('accept')) {
      requestHeaders.set('accept', 'text/event-stream')
    }

    const executeStreamFetch = () =>
      fetch(this.createRequestUrl(path), {
        method: 'GET',
        headers: requestHeaders,
        signal,
        cache: 'no-store',
      })

    try {
      let response = await executeStreamFetch()

      if (response.status === 401 && retryOnUnauthorized) {
        const refreshedAuth = await this.refreshStoredSession()

        if (!refreshedAuth?.access_token) {
          throw this.createSessionExpiredError()
        }

        requestHeaders.set('authorization', `Bearer ${refreshedAuth.access_token}`)
        response = await executeStreamFetch()

        if (response.status === 401) {
          const responseText = await response.text()
          const responseData = parseResponsePayload(responseText)
          await this.handleAuthFailure()
          throw this.createSessionExpiredError(responseData)
        }
      }

      if (!response.ok) {
        const responseText = await response.text()
        const responseData = parseResponsePayload(responseText)
        const message =
          extractErrorMessage(responseData) ??
          getFallbackMessageForStatus(response.status)

        throw new ApiClientError(message, response.status, responseData)
      }

      return response
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error
      }

      if (
        error instanceof DOMException &&
        error.name === 'AbortError' &&
        signal?.aborted
      ) {
        throw error
      }

      debugLog(`Streaming request failed for ${path}`, error)

      throw new ApiClientError(
        'Network error. Please check your connection and try again.',
        0,
        null,
      )
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
export function isInsufficientCreditsError(
  error: unknown,
): error is ApiClientError {
  return error instanceof ApiClientError && error.status === 402
}
