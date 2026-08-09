'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { motion, useReducedMotion } from 'framer-motion'
import { BookOpenCheck, Eye, EyeOff, FileText, GraduationCap, Layers3, ListChecks, LoaderCircle, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createFirebaseSession } from '@/lib/api/auth.service'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { getStoredAuthObject, saveAuthObject } from '@/lib/api/session-storage'
import { getPostLoginDestination } from '@/lib/auth-redirect'
import { auth, isFirebaseConfigured } from '@/lib/firebase'
import { flattenPermissionKeys } from '@/lib/rbac/permissions'

export default function SignupPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postSignupDestination, setPostSignupDestination] = useState<string | null>(null)

  const firebaseUnavailableMessage =
    isFirebaseConfigured && auth
      ? ''
      : 'Firebase signup is not configured. Check the public Firebase environment variables.'

  useEffect(() => {
    const storedAuth = getStoredAuthObject()
    const destination = new URLSearchParams(window.location.search).get('next')

    if (!storedAuth?.access_token) {
      setPostSignupDestination(destination)
      setAuthCheckComplete(true)
      return
    }

    router.replace(
      getPostLoginDestination(
        destination,
        storedAuth.user_role,
        storedAuth.flattened_permission_keys ?? [],
      ),
    )
  }, [router])

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting || !auth || !isFirebaseConfigured) return

    const displayName = name.trim()
    if (!displayName) {
      setErrorMessage('Name is required.')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(credential.user, { displayName })
      const firebaseIdToken = await credential.user.getIdToken(true)
      const session = await createFirebaseSession({
        firebaseIdToken,
        deviceName: getDeviceName(),
        deviceType: 'web',
      })
      const permissionKeys = flattenPermissionKeys(session.permissions)
      saveAuthObject({
        ...session.auth,
        user_role: session.user.role,
        user_display_name: session.user.display_name || displayName,
        user_onboarding: session.user.onboarding,
        user_permissions: session.permissions,
        flattened_permission_keys: permissionKeys,
      })
      router.replace(
        getPostLoginDestination(postSignupDestination, session.user.role, permissionKeys),
      )
    } catch (error) {
      setErrorMessage(getSignupErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!authCheckComplete) {
    return <main className="flex h-svh items-center justify-center overflow-hidden bg-background"><LoaderCircle className="h-8 w-8 animate-spin" /></main>
  }

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[#f7f8fc] p-3 text-foreground sm:p-5 lg:h-svh lg:overflow-hidden lg:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(#5B65E0_0.7px,transparent_0.7px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-22rem] h-[44rem] w-[72rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(91,101,224,0.16),rgba(81,0,167,0.06)_48%,transparent_72%)]" />

      <div className="relative mx-auto min-h-[calc(100svh-1.5rem)] w-full max-w-[1200px] sm:min-h-[calc(100svh-2.5rem)] lg:h-full lg:min-h-0">
        <section className="grid min-h-[inherit] overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_32px_90px_rgba(42,48,92,0.12)] sm:rounded-[28px] lg:h-full lg:min-h-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative flex min-h-0 items-center overflow-hidden px-4 py-8 sm:px-10 lg:px-12 lg:py-[clamp(1rem,3vh,2rem)] xl:px-16">
            <motion.div
              className="mx-auto w-full max-w-sm"
              initial={reduceMotion ? false : { opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* <Link href="/" className="inline-flex"><Image src="/logo.png" alt="Neurova" width={128} height={38} className="h-auto w-[116px] sm:w-[128px]" /></Link> */}

              <div className="mb-[clamp(1rem,3vh,1.75rem)] mt-[clamp(1.25rem,4vh,2.5rem)]">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">Create Account</h1>
                <p className="mt-2 text-sm text-slate-500">Start your learning journey today.</p>
              </div>

              <form className="space-y-3.5" onSubmit={handleSignup}>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" autoComplete="name" disabled={isSubmitting} className="h-12 rounded-xl border-slate-200 px-4 shadow-sm focus-visible:ring-4 focus-visible:ring-primary/10" />
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" autoComplete="email" disabled={isSubmitting} className="h-12 rounded-xl border-slate-200 px-4 shadow-sm focus-visible:ring-4 focus-visible:ring-primary/10" />
                <PasswordInput id="password" value={password} onChange={setPassword} placeholder="Password" show={showPassword} onToggle={() => setShowPassword((value) => !value)} disabled={isSubmitting} />
                <PasswordInput id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" show={showPassword} onToggle={() => setShowPassword((value) => !value)} disabled={isSubmitting} />

                {(errorMessage || firebaseUnavailableMessage) && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">{errorMessage || firebaseUnavailableMessage}</p>}

                <Button type="submit" disabled={isSubmitting || !name.trim() || !email.trim() || !password || !confirmPassword || Boolean(firebaseUnavailableMessage)} className="h-12 w-full rounded-xl text-sm font-semibold text-white shadow-[0_16px_36px_rgba(81,0,167,0.2)]" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--button) 82%, white), color-mix(in srgb, var(--thirdary) 72%, white))', color: '#fff' }}>
                  {isSubmitting ? <><LoaderCircle className="h-4 w-4 animate-spin" />Creating Account...</> : 'Create Account'}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-500">Already have an account? <Link href={postSignupDestination ? `/login?next=${encodeURIComponent(postSignupDestination)}` : '/login'} className="font-semibold text-primary hover:text-thirdary">Sign In</Link></p>
            </motion.div>
          </div>

          <div className="relative hidden min-h-0 overflow-hidden bg-gradient-to-br from-button via-thirdary to-primary p-7 lg:flex lg:items-center lg:justify-center xl:p-10">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
            <motion.div aria-hidden="true" className="absolute -right-16 top-14 h-48 w-48 rounded-full border border-white/10" animate={reduceMotion ? undefined : { scale: [1, 1.1, 1], rotate: [0, 14, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="relative z-10 w-full max-w-[590px]" initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
              <motion.div className="relative mx-auto w-[86%] rotate-2" animate={reduceMotion ? undefined : { y: [0, -8, 0], rotate: [2, 1, 2] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
                <div className="absolute -inset-4 -rotate-[4deg] rounded-[28px] border border-white/15 bg-white/[0.07]" />
                <div className="relative aspect-[1.32] overflow-hidden rounded-[24px] border border-white/30 bg-white/10 p-2.5 shadow-[0_38px_90px_rgba(18,12,62,0.4)]">
                  <div className="relative h-full overflow-hidden rounded-[18px] bg-white/95"><Image src="/demo-1.png" alt="Neurova study workspace" fill priority sizes="(min-width: 1024px) 48vw, 0px" className="object-contain" /></div>
                </div>
                <StudyIcon className="-left-10 top-[14%]" icon={FileText} color="bg-blue-500" delay={0} reduceMotion={reduceMotion} />
                <StudyIcon className="-right-9 top-[8%]" icon={Layers3} color="bg-amber-500" delay={0.4} reduceMotion={reduceMotion} />
                <StudyIcon className="-bottom-7 left-[13%]" icon={ListChecks} color="bg-violet-500" delay={0.8} reduceMotion={reduceMotion} />
                <StudyIcon className="-bottom-9 right-[14%]" icon={GraduationCap} color="bg-emerald-500" delay={1.2} reduceMotion={reduceMotion} />
              </motion.div>
              <div className="mx-auto mt-[clamp(1.25rem,4vh,2.5rem)] flex w-fit -space-x-2">{[FileText, BookOpenCheck, Layers3].map((Icon, index) => <span key={index} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#6544bd] bg-white text-thirdary"><Icon className="h-4 w-4" /></span>)}</div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  )
}

function PasswordInput({ id, value, onChange, placeholder, show, onToggle, disabled }: { id: string; value: string; onChange: (value: string) => void; placeholder: string; show: boolean; onToggle: () => void; disabled: boolean }) {
  return <div className="relative"><Input id={id} type={show ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="new-password" disabled={disabled} className="h-12 rounded-xl border-slate-200 px-4 pr-12 shadow-sm focus-visible:ring-4 focus-visible:ring-primary/10" /><button type="button" onClick={onToggle} disabled={disabled} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
}

function StudyIcon({ icon: Icon, color, className, delay, reduceMotion }: { icon: typeof FileText; color: string; className: string; delay: number; reduceMotion: boolean | null }) {
  return <motion.div className={`absolute flex h-14 w-14 items-center justify-center rounded-2xl border border-white/50 bg-white shadow-xl ${className}`} animate={reduceMotion ? undefined : { y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay }}><span className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${color}`}><Icon className="h-4 w-4" /></span></motion.div>
}

function getDeviceName() {
  if (typeof window === 'undefined') return 'web'
  return [window.navigator.platform?.trim(), window.navigator.language?.trim()].filter(Boolean).join(' - ') || 'web'
}

function getSignupErrorMessage(error: unknown) {
  const apiMessage = getApiClientErrorMessage(error, '')
  if (apiMessage) return apiMessage
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'An account already exists with this email.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/weak-password': 'Choose a stronger password.',
      'auth/operation-not-allowed': 'Email and password signup is not enabled.',
      'auth/network-request-failed': 'Network error. Check your connection and try again.',
      'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    }
    return messages[error.code] ?? 'Account creation failed. Please try again.'
  }
  return 'Account creation failed. Please try again.'
}
