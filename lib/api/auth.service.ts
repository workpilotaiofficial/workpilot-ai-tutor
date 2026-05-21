import { apiClient } from '@/lib/api/client'
import { type SessionPermissions } from '@/lib/rbac/permissions'

export type CreateFirebaseSessionPayload = {
  firebaseIdToken: string
  deviceName?: string
  deviceType?: string
}

type SessionUser = {
  id: string
  firebase_uid: string
  email: string
  display_name: string
  role: string
  is_email_verified: boolean
  last_login_at: string | null
}

type SessionMetadata = {
  session_id: string
  expires_at: string
}

export type SessionAuth = {
  token_type: string
  access_token: string
  expires_at: string
  refresh_token: string
  refresh_expires_at: string
}

type SessionSubscription = {
  plan: string
  status: string
  current_period_end: string | null
  billing_interval: string
}

export type FirebaseSessionResponse = {
  user: SessionUser
  session: SessionMetadata
  auth: SessionAuth
  subscription: SessionSubscription
  token_balance: number
  permissions: SessionPermissions
  is_new_user: boolean
}

const SESSION_ENDPOINT = '/api/v1/auth/session'

export type UserRole = 'student' | 'admin'

export function getPortalRouteByRole(role: string | null | undefined) {
  return role === 'admin' ? '/admin' : '/dashboard'
}

export async function createFirebaseSession(payload: CreateFirebaseSessionPayload) {
  return apiClient.request<FirebaseSessionResponse>(SESSION_ENDPOINT, {
    method: 'POST',
    body: {
      firebase_id_token: payload.firebaseIdToken,
      device_name: payload.deviceName ?? 'pc',
      device_type: payload.deviceType ?? 'web',
    },
    headers: {
      'content-type': 'application/json',
    },
    omitDefaultHeaders: true,
    omitAuthHeader: true,
  })
}

export async function refreshAccessToken(refreshToken: string) {
  return apiClient.refreshAccessToken(refreshToken)
}

export async function deleteCurrentSession() {
  return apiClient.request<null>(SESSION_ENDPOINT, {
    method: 'DELETE',
  })
}
