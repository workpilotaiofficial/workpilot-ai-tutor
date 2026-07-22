'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createFirebaseSession } from '@/lib/api/auth.service'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { clearAuthBrowserState, getStoredAuthObject, saveAuthObject } from '@/lib/api/session-storage'
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase'
import { flattenPermissionKeys, getPortalRouteByPermissions } from '@/lib/rbac/permissions'

export default function LoginPage() {
  const router = useRouter()
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isEmailSigningIn, setIsEmailSigningIn] = useState(false)
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)

  const isSubmitting = isEmailSigningIn || isGoogleSigningIn
  const firebaseUnavailableMessage =
    isFirebaseConfigured && auth
      ? ''
      : 'Firebase login is not configured. Check the public Firebase environment variables.'

  useEffect(() => {
    const storedAuth = getStoredAuthObject()

    if (!storedAuth?.access_token) {
      setAuthCheckComplete(true)
      return
    }

    router.replace(getPortalRouteByPermissions(storedAuth.user_role, storedAuth.flattened_permission_keys ?? []))
  }, [router])

  if (!authCheckComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 text-foreground">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </main>
    )
  }

  const createSessionAndRedirect = async (firebaseIdToken: string) => {
    const session = await createFirebaseSession({
      firebaseIdToken,
      deviceName: getDeviceName(),
      deviceType: 'web',
    })

    saveAuthObject({
      ...session.auth,
      user_role: session.user.role,
      user_display_name: session.user.display_name,
      user_permissions: session.permissions,
      flattened_permission_keys: flattenPermissionKeys(session.permissions),
    })
    router.replace(getPortalRouteByPermissions(session.user.role, flattenPermissionKeys(session.permissions)))
  }

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    if (!auth || !isFirebaseConfigured) {
      setErrorMessage(firebaseUnavailableMessage)
      return
    }

    setErrorMessage('')
    setInfoMessage('')
    setIsEmailSigningIn(true)

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const firebaseIdToken = await credential.user.getIdToken()
      await createSessionAndRedirect(firebaseIdToken)
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error))
    } finally {
      setIsEmailSigningIn(false)
    }
  }

  const handlePasswordReset = async () => {
    if (isSubmitting) {
      return
    }

    if (!auth || !isFirebaseConfigured) {
      setErrorMessage(firebaseUnavailableMessage)
      return
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setInfoMessage('')
      setErrorMessage('Enter your email above first, then tap "Forgot password?" to get a reset link.')
      return
    }

    setErrorMessage('')
    try {
      await sendPasswordResetEmail(auth, trimmedEmail)
      setInfoMessage(`If an account exists for ${trimmedEmail}, a password reset link has been sent.`)
    } catch (error) {
      setInfoMessage('')
      setErrorMessage(getFirebaseAuthErrorMessage(error))
    }
  }

  const handleGoogleLogin = async () => {
    if (isSubmitting) {
      return
    }

    if (!auth || !isFirebaseConfigured) {
      setErrorMessage(firebaseUnavailableMessage)
      return
    }

    setErrorMessage('')
    setInfoMessage('')
    setIsGoogleSigningIn(true)

    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' })
      const credential = await signInWithPopup(auth, googleProvider)
      const firebaseIdToken = await credential.user.getIdToken()
      await createSessionAndRedirect(firebaseIdToken)
    } catch (error) {
      await signOut(auth).catch(() => null)
      clearAuthBrowserState()
      setErrorMessage(getFirebaseAuthErrorMessage(error))
    } finally {
      setIsGoogleSigningIn(false)
    }
  }

  return (
    <main className="relative h-[100svh] overflow-hidden bg-background p-3 text-foreground sm:p-4 lg:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 8% 4%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 32%),
            radial-gradient(circle at 92% 10%, color-mix(in srgb, var(--thirdary) 16%, transparent) 0%, transparent 30%),
            linear-gradient(180deg, color-mix(in srgb, var(--background) 94%, white) 0%, color-mix(in srgb, var(--primary) 7%, white) 100%)
          `,
        }}
      />

      <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-center">
        <section className="grid h-full max-h-[780px] w-full overflow-hidden rounded-[26px] border border-white/70 bg-white/75 shadow-[0_24px_80px_rgba(60,86,134,0.14)] backdrop-blur-xl sm:rounded-[30px] lg:h-[min(760px,calc(100svh-3rem))] lg:grid-cols-[1.06fr_0.94fr]">
          <div className="hidden min-h-0 p-4 lg:block xl:p-5">
            <div
              className="relative flex h-full min-h-0 items-end justify-center overflow-hidden rounded-[24px] px-6"
              style={{
                background:
                  'linear-gradient(155deg, color-mix(in srgb, var(--thirdary) 40%, white) 0%, color-mix(in srgb, var(--button) 46%, white) 52%, color-mix(in srgb, var(--primary) 24%, white) 100%)',
              }}
            >
              <div className="absolute inset-x-14 bottom-10 h-12 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute -left-10 top-16 h-36 w-36 rounded-full bg-white/16 blur-3xl" />
              <div className="absolute -right-12 bottom-20 h-48 w-48 rounded-full bg-white/18 blur-3xl" />

              <Image
                src="/charecter.png"
                alt="Student illustration"
                width={620}
                height={620}
                priority
                className="relative z-10 max-h-[88%] w-auto max-w-full object-contain object-bottom drop-shadow-[0_28px_46px_rgba(42,56,120,0.2)]"
              />
            </div>
          </div>

          <div className="relative flex min-h-0 items-center justify-center p-5 sm:p-7 lg:p-8 xl:p-10 [@media(max-height:700px)]:p-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 bottom-6 h-24 rounded-full blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--thirdary) 11%, white) 0%, transparent 72%)',
              }}
            />

            <div className="relative z-10 flex w-full max-w-[420px] flex-col">
              <Link href="/" className="mb-7 inline-flex w-fit items-center [@media(max-height:700px)]:mb-4">
                <Image
                  src="/logo.png"
                  alt="WorkPilot"
                  width={124}
                  height={36}
                  className="h-auto w-[108px] sm:w-[118px]"
                />
              </Link>

              <div className="mb-7 text-center [@media(max-height:700px)]:mb-4">
                <h1 className="text-[2rem] font-semibold tracking-[-0.045em] text-slate-900 sm:text-[2.25rem] [@media(max-height:700px)]:text-[1.8rem]">
                  Hello Again!
                </h1>
                <p className="mt-2 text-sm leading-5 text-slate-500 sm:text-[15px]">
                  Welcome back you&apos;ve been missed!
                </p>
              </div>

              <form className="space-y-4 [@media(max-height:700px)]:space-y-3" onSubmit={handleEmailLogin}>
                <div className="space-y-3">
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={isSubmitting}
                    className="h-[52px] rounded-2xl border-white bg-white/90 px-5 text-sm text-slate-700 shadow-[0_12px_32px_rgba(53,81,143,0.08)] placeholder:text-slate-400 focus-visible:ring-[3px] [@media(max-height:700px)]:h-12"
                  />

                  <div className="relative">
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className="h-[52px] rounded-2xl border-white bg-white/90 px-5 pr-14 text-sm text-slate-700 shadow-[0_12px_32px_rgba(53,81,143,0.08)] placeholder:text-slate-400 focus-visible:ring-[3px] [@media(max-height:700px)]:h-12"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={isSubmitting}
                      className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isSubmitting || Boolean(firebaseUnavailableMessage)}
                    className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Forgot password?
                  </button>
                </div>

                {infoMessage && (
                  <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
                    {infoMessage}
                  </p>
                )}

                {(errorMessage || firebaseUnavailableMessage) && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                    {errorMessage || firebaseUnavailableMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !email.trim() || !password || Boolean(firebaseUnavailableMessage)}
                  className="h-[52px] w-full rounded-2xl text-base font-semibold text-white shadow-[0_18px_40px_rgba(39,61,133,0.2)] transition-transform duration-300 hover:-translate-y-0.5 [@media(max-height:700px)]:h-12"
                  style={{
                    background:
                      'linear-gradient(135deg, color-mix(in srgb, var(--button) 82%, white) 0%, color-mix(in srgb, var(--thirdary) 72%, white) 100%)',
                    color: '#ffffff',
                  }}
                >
                  {isEmailSigningIn ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-7 [@media(max-height:700px)]:mt-4">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>Or continue with</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="mt-4 flex items-center justify-center">
                  <SocialIconButton
                    label="Continue with Google"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting || Boolean(firebaseUnavailableMessage)}
                  >
                    <Image
                      src="/google.png"
                      alt="Google"
                      width={22}
                      height={22}
                      className="h-[22px] w-[22px]"
                    />
                  </SocialIconButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function SocialIconButton({
  children,
  label,
  onClick,
  disabled = false,
}: {
  children: ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white/90 shadow-[0_14px_30px_rgba(53,81,143,0.08)] transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
    >
      {children}
    </button>
  )
}

function getDeviceName() {
  if (typeof window === 'undefined') {
    return 'web'
  }

  const platform = window.navigator.platform?.trim()
  const language = window.navigator.language?.trim()

  return [platform, language].filter(Boolean).join(' - ') || 'web'
}

function getFirebaseAuthErrorMessage(error: unknown) {
  const apiErrorMessage = getApiClientErrorMessage(error, '')
  if (apiErrorMessage) {
    return apiErrorMessage
  }

  if (error instanceof FirebaseError) {
    const errorMap: Record<string, string> = {
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/missing-password': 'Password is required.',
      'auth/user-not-found': 'No account was found with this email.',
      'auth/wrong-password': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled before completion.',
      'auth/popup-blocked': 'Popup was blocked. Allow popups and try again.',
      'auth/cancelled-popup-request': 'Another sign-in popup is already open.',
      'auth/account-exists-with-different-credential':
        'This email is already linked with a different sign-in method.',
      'auth/network-request-failed': 'Network error. Check your connection and try again.',
    }

    return errorMap[error.code] ?? 'Login failed. Please try again.'
  }

  return 'Login failed. Please try again.'
}