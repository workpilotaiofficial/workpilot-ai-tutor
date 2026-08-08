'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  type ComponentType,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { FirebaseError } from 'firebase/app'
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { motion, useReducedMotion } from 'framer-motion'
import { BookOpenCheck, Eye, EyeOff, FileText, GraduationCap, Layers3, ListChecks, LoaderCircle, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createFirebaseSession } from '@/lib/api/auth.service'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { clearAuthBrowserState, getStoredAuthObject, saveAuthObject } from '@/lib/api/session-storage'
import { getPostLoginDestination } from '@/lib/auth-redirect'
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase'
import { flattenPermissionKeys } from '@/lib/rbac/permissions'

export default function LoginPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
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

  const createSessionAndRedirect = useCallback(async (firebaseIdToken: string) => {
    const session = await createFirebaseSession({
      firebaseIdToken,
      deviceName: getDeviceName(),
      deviceType: 'web',
    })

    const permissionKeys = flattenPermissionKeys(session.permissions)

    saveAuthObject({
      ...session.auth,
      user_role: session.user.role,
      user_display_name: session.user.display_name,
      user_onboarding: session.user.onboarding,
      user_permissions: session.permissions,
      flattened_permission_keys: permissionKeys,
    })
    const destination = new URLSearchParams(window.location.search).get('next')
    router.replace(getPostLoginDestination(destination, session.user.role, permissionKeys))
  }, [router])

  useEffect(() => {
    const storedAuth = getStoredAuthObject()

    if (!storedAuth?.access_token) {
      setAuthCheckComplete(true)
      return
    }

    const destination = new URLSearchParams(window.location.search).get('next')
    router.replace(
      getPostLoginDestination(
        destination,
        storedAuth.user_role,
        storedAuth.flattened_permission_keys ?? [],
      ),
    )
  }, [router])

  if (!authCheckComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 text-foreground">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </main>
    )
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

  /*
   * Future full-page Google redirect flow:
   *
   * 1. Import `getRedirectResult` and `signInWithRedirect` from `firebase/auth`.
   * 2. Replace the popup call below with:
   *
   *    googleProvider.setCustomParameters({ prompt: 'select_account' })
   *    await signInWithRedirect(auth, googleProvider)
   *
   * 3. On page load, complete the returned redirect before showing the login form:
   *
   *    const credential = await getRedirectResult(auth)
   *    if (credential) {
   *      const firebaseIdToken = await credential.user.getIdToken()
   *      await createSessionAndRedirect(firebaseIdToken)
   *    }
   *
   * Before enabling it, configure a same-domain Firebase auth helper/proxy so
   * browsers that block third-party storage do not lose the redirect result.
   */
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
    <main className="relative min-h-svh overflow-x-hidden bg-[#f7f8fc] p-3 text-foreground sm:p-5 lg:h-svh lg:overflow-hidden lg:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(#5B65E0_0.7px,transparent_0.7px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-22rem] h-[44rem] w-[72rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(91,101,224,0.16),rgba(81,0,167,0.06)_48%,transparent_72%)]" />

      <div className="relative mx-auto min-h-[calc(100svh-1.5rem)] w-full max-w-[1200px] sm:min-h-[calc(100svh-2.5rem)] lg:h-full lg:min-h-0">
        <section className="grid min-h-[inherit] w-full overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_32px_90px_rgba(42,48,92,0.12)] sm:rounded-[28px] lg:h-full lg:min-h-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative hidden min-h-0 overflow-hidden bg-gradient-to-br from-button via-thirdary to-primary p-7 lg:flex lg:items-center lg:justify-center xl:p-10">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
            <div aria-hidden="true" className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div aria-hidden="true" className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />

            <motion.div
              aria-hidden="true"
              className="absolute left-[12%] top-[14%] h-20 w-20 rotate-12 rounded-[22px] border border-white/15 bg-white/5"
              animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [12, 18, 12] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute bottom-[9%] right-[7%] h-28 w-28 rounded-full border border-white/10"
              animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
              className="relative z-10 w-full max-w-[590px]"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
       

              <motion.div
                className="relative mx-auto w-[86%] rotate-[-2deg]"
                initial={reduceMotion ? false : { opacity: 0, y: 28, rotate: -5 }}
                animate={reduceMotion ? { opacity: 1, y: 0, rotate: -2 } : { opacity: 1, y: [0, -7, 0], rotate: [-2, -1.2, -2] }}
                transition={reduceMotion ? { duration: 0.6 } : { opacity: { duration: 0.65 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }, rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 } }}
              >
                <div className="absolute -inset-4 rotate-[4deg] rounded-[28px] border border-white/15 bg-white/[0.07]" />
                <div className="relative aspect-[1.32] overflow-hidden rounded-[24px] border border-white/30 bg-white/10 p-2.5 shadow-[0_38px_90px_rgba(18,12,62,0.4)] backdrop-blur-sm">
                  <div className="absolute left-5 right-5 top-0 z-20 flex h-5 items-center gap-1.5 rounded-b-xl bg-white/90 px-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-white/95">
                    <Image
                      src="/demo-1.png"
                      alt="Neurova study workspace"
                      fill
                      priority
                      sizes="(min-width: 1024px) 48vw, 0px"
                      className="object-contain"
                    />
                  </div>
                </div>

                <FloatingStudyIcon className="-left-10 top-[14%] -rotate-6" icon={FileText} color="bg-blue-500" delay={0.25} reduceMotion={reduceMotion} />
                <FloatingStudyIcon className="-right-9 top-[8%] rotate-6" icon={Layers3} color="bg-amber-500" delay={0.4} reduceMotion={reduceMotion} />
                <FloatingStudyIcon className="-bottom-7 left-[13%] rotate-3" icon={ListChecks} color="bg-violet-500" delay={0.55} reduceMotion={reduceMotion} />
                <FloatingStudyIcon className="-bottom-9 right-[14%] -rotate-3" icon={GraduationCap} color="bg-emerald-500" delay={0.7} reduceMotion={reduceMotion} />
              </motion.div>

              <motion.div
                className="mx-auto mt-[clamp(1.25rem,4vh,2.5rem)] flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md"
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.65 }}
              >
                <div className="flex -space-x-2">
                  {[FileText, BookOpenCheck, Layers3].map((Icon, index) => (
                    <span key={index} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#6544bd] bg-white text-thirdary"><Icon className="h-3.5 w-3.5" /></span>
                  ))}
                </div>
                <div className="flex gap-1">{[0, 1, 2, 3].map((item) => <span key={item} className={`h-1.5 rounded-full ${item === 3 ? 'w-6 bg-white' : 'w-3 bg-white/35'}`} />)}</div>
              </motion.div>
            </motion.div>
          </div>

          <div className="relative flex min-h-0 items-center overflow-hidden px-4 py-8 sm:px-10 lg:px-12 lg:py-[clamp(1.25rem,4vh,2.5rem)] xl:px-16">
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/[0.07] blur-3xl" />

            <motion.div
              className="relative z-10 mx-auto flex w-full max-w-sm flex-col"
              initial={reduceMotion ? false : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-[clamp(1.5rem,5vh,3rem)] flex items-center justify-center gap-4">
                <Link href="/" className="inline-flex items-center">
                  <Image
                    src="/logo.png"
                    alt="Neurova"
                    width={20}
                    height={58}
                    className="h-auto w-[180px] sm:w-[210px]"
                  />
                </Link>

              </div>

              {/* <div className="mb-[clamp(1.25rem,4vh,2.25rem)] w-full"> */}
                {/* <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
                  Sign In!
                </h1> */}
                {/* <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-[15px]">
                  Welcome back you&apos;ve been missed!
                </p> */}
              {/* </div> */}

              <SocialIconButton
                label={isGoogleSigningIn ? 'Signing In...' : 'Continue with Google'}
                onClick={handleGoogleLogin}
                disabled={isSubmitting || Boolean(firebaseUnavailableMessage)}
              >
                {isGoogleSigningIn ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Image src="/google.png" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
                )}
              </SocialIconButton>

              <div className="my-[clamp(1rem,3vh,1.5rem)] flex items-center gap-4 text-sm text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>Or continue with</span>
                <span className="h-px flex-1 bg-slate-200" />
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
                    className="h-13 rounded-xl border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/10"
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
                      className="h-13 rounded-xl border-slate-200 bg-white px-4 pr-12 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={isSubmitting}
                      className="absolute right-2.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
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
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isSubmitting || Boolean(firebaseUnavailableMessage)}
                    className="text-sm font-medium text-primary transition-colors hover:text-thirdary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Forgot password?
                  </button>
                </div>

                {infoMessage && (
                  <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {infoMessage}
                  </p>
                )}

                {(errorMessage || firebaseUnavailableMessage) && (
                  <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMessage || firebaseUnavailableMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !email.trim() || !password || Boolean(firebaseUnavailableMessage)}
                  className="h-13 w-full rounded-xl text-sm font-semibold text-white shadow-[0_16px_36px_rgba(81,0,167,0.2)] transition-transform duration-300 hover:-translate-y-0.5"
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

              <p className="mt-4 text-center text-sm text-slate-500">Don&apos;t have an account? <Link href="/signup" className="font-semibold text-primary hover:text-thirdary">Create Account</Link></p>
            </motion.div>
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
      className="group inline-flex h-13 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_30px_rgba(91,101,224,0.12)] disabled:cursor-not-allowed disabled:opacity-55"
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

function FloatingStudyIcon({
  icon: Icon,
  color,
  className,
  delay,
  reduceMotion,
}: {
  icon: ComponentType<{ className?: string }>
  color: string
  className: string
  delay: number
  reduceMotion: boolean | null
}) {
  return (
    <motion.div
      className={`absolute z-30 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/50 bg-white shadow-[0_18px_40px_rgba(20,14,64,0.28)] ${className}`}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.6, y: 12 }}
      animate={reduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={reduceMotion ? { duration: 0.3 } : { opacity: { duration: 0.35, delay }, scale: { duration: 0.5, delay, type: 'spring' }, y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.6 } }}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${color}`}>
        <Icon className="h-4 w-4" />
      </span>
    </motion.div>
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
