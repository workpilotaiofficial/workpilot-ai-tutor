'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
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
    setIsEmailSigningIn(true)

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const firebaseIdToken = await credential.user.getIdToken()
      await createSessionAndRedirect(firebaseIdToken)
    } catch (error) {
      // await signOut(auth).catch(() => null)
      // clearAuthBrowserState()
      console.log(error);
      
      setErrorMessage(getFirebaseAuthErrorMessage(error))
    } finally {
      setIsEmailSigningIn(false)
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
    <main className="relative bg-background px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 34%),
            radial-gradient(circle at right 18% top 12%, color-mix(in srgb, var(--thirdary) 18%, white) 0%, transparent 30%),
            linear-gradient(180deg, #f9fbff 0%, #eef4ff 50%, #f6f9ff 100%)
          `,
        }}
      />

      <div className="relative mx-auto flex h-screen w-full max-w-7xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-[0_30px_90px_rgba(60,86,134,0.14)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative overflow-hidden p-5 sm:p-7 lg:p-8 box-border">
            <div
              className="relative flex  items-end justify-center overflow-hidden rounded-[28px] px-6 pb-0 pt-10 sm:px-8 h-screen"
              style={{
                background: `linear-gradient(160deg, color-mix(in srgb, var(--thirdary) 42%, white) 0%, color-mix(in srgb, var(--button) 50%, white) 54%, color-mix(in srgb, var(--primary) 26%, white) 100%)`,
              }}
            >
              <div className="absolute left-6 top-6 rounded-full border border-white/25 bg-white/16 px-4 py-2 text-xs font-medium tracking-[0.22em] text-white/88 uppercase backdrop-blur">
                Study smarter
              </div>

              <div className="absolute inset-x-10 bottom-12 h-14 rounded-full bg-white/18 blur-3xl" />
              <div className="absolute -left-12 top-20 h-36 w-36 rounded-full bg-white/16 blur-3xl" />
              <div className="absolute -right-10 bottom-24 h-48 w-48 rounded-full bg-white/18 blur-3xl" />

              <div className="relative z-10 mx-auto flex w-full max-w-xl items-end justify-center">
                <Image
                  src="/charecter.png"
                  alt="Student illustration"
                  width={620}
                  height={620}
                  priority
                  className="h-auto w-full max-w-[470px] object-contain drop-shadow-[0_32px_50px_rgba(42,56,120,0.2)]"
                />
              </div>
            </div>
          </div>

          <div className="relative flex items-center p-6 sm:p-8 lg:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 bottom-8 h-28 rounded-full blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--thirdary) 12%, white) 0%, transparent 72%)',
              }}
            />

            <div className="relative z-10 mx-auto flex w-full max-w-md flex-col">
              <div className="mb-10 flex items-start justify-between gap-4">
                <Link href="/" className="inline-flex items-center">
                  <Image
                    src="/logo.png"
                    alt="WorkPilot"
                    width={124}
                    height={36}
                    className="h-auto w-[108px] sm:w-[124px]"
                  />
                </Link>

                <p className="pt-2 text-right text-xs font-medium text-slate-500 sm:text-sm">
                  Not a member?{' '}
                  <Link
                    href="/"
                    className="font-semibold"
                    style={{ color: 'var(--button)' }}
                  >
                    Register now
                  </Link>
                </p>
              </div>

              <div className="mx-auto mb-8 w-full max-w-sm text-center">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-[2.3rem]">
                  Hello Again!
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-[15px]">
                  Welcome back you&apos;ve been missed!
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleEmailLogin}>
                <div className="space-y-4">
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
                    className="h-14 rounded-2xl border-white bg-white/90 px-5 text-sm text-slate-700 shadow-[0_14px_38px_rgba(53,81,143,0.08)] placeholder:text-slate-400 focus-visible:ring-[3px]"
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
                      className="h-14 rounded-2xl border-white bg-white/90 px-5 pr-14 text-sm text-slate-700 shadow-[0_14px_38px_rgba(53,81,143,0.08)] placeholder:text-slate-400 focus-visible:ring-[3px]"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={isSubmitting}
                      className="absolute right-4 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/"
                    className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Recovery Password
                  </Link>
                </div>

                {(errorMessage || firebaseUnavailableMessage) && (
                  <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMessage || firebaseUnavailableMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !email.trim() || !password || Boolean(firebaseUnavailableMessage)}
                  className="h-14 w-full rounded-2xl text-base font-semibold text-white shadow-[0_20px_45px_rgba(39,61,133,0.22)] transition-transform duration-300 hover:-translate-y-0.5"
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

              <div className="mt-10">
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>Or continue with</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="mt-6 flex items-center justify-center gap-4 sm:gap-5">
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

                  <SocialIconButton label="Continue with Apple" disabled>
                    <Image
                      src="/apple-icon.png"
                      alt="Apple"
                      width={22}
                      height={22}
                      className="h-[22px] w-[22px]"
                    />
                  </SocialIconButton>

                  <SocialIconButton label="Continue with Facebook" disabled>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-lg font-bold text-white">
                      f
                    </span>
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
      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white bg-white/90 shadow-[0_16px_36px_rgba(53,81,143,0.08)] transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
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
