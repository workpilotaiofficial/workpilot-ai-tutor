'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, updateProfile, type User } from 'firebase/auth'
import { CheckCircle2, LoaderCircle, RefreshCcw, UserRound } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { getStoredAuthObject, replaceStoredAuthObject } from '@/lib/api/session-storage'
import { auth } from '@/lib/firebase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function initials(name: string, email: string) {
  const source = name.trim() || email.trim()
  if (!source) return 'U'

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function ProfileSettings() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) {
      setIsLoading(false)
      return
    }

    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setDisplayName(firebaseUser?.displayName?.trim() ?? '')
      setIsLoading(false)
    })
  }, [])

  const hasChanges = useMemo(
    () => displayName.trim() !== (user?.displayName?.trim() ?? ''),
    [displayName, user?.displayName],
  )

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextDisplayName = displayName.trim()

    if (!nextDisplayName) {
      setStatus('Display name is required.')
      return
    }

    if (!auth?.currentUser) {
      toast({
        title: 'Firebase session unavailable',
        description: 'Please sign in again before updating your profile.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    setStatus(null)

    try {
      await updateProfile(auth.currentUser, { displayName: nextDisplayName })

      const storedAuth = getStoredAuthObject()
      if (storedAuth) {
        replaceStoredAuthObject({ ...storedAuth, user_display_name: nextDisplayName })
      }

      setUser(auth.currentUser)
      setStatus('Profile updated successfully.')
      toast({ title: 'Profile updated', description: 'Your display name was saved to Firebase.' })
    } catch (error) {
      toast({
        title: 'Unable to update profile',
        description: error instanceof Error ? error.message : 'Firebase could not update your profile.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && !user) {
    return (
      <div className="flex min-h-56 items-center justify-center text-muted-foreground">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading profile...
      </div>
    )
  }

  return (
    <form className="space-y-6" onSubmit={saveProfile}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Profile</h3>
          <p className="mt-1 text-sm text-muted-foreground">View your account details and update your basic information.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const firebaseUser = auth?.currentUser ?? null
            setUser(firebaseUser)
            setDisplayName(firebaseUser?.displayName?.trim() ?? '')
            setStatus(null)
          }}
          disabled={isLoading || isSaving}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/10 p-5">
        <Avatar className="h-16 w-16 border border-border">
          <AvatarImage src={user?.photoURL ?? undefined} alt={displayName || user?.email || 'User'} />
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {initials(displayName, user?.email ?? '') || <UserRound className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{user?.displayName?.trim() || 'Unnamed user'}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email || 'No email available'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={user?.emailVerified ? 'default' : 'outline'}>
              {user?.emailVerified && <CheckCircle2 className="h-3 w-3" />}
              {user?.emailVerified ? 'Verified' : 'Not verified'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-display-name">Display name</Label>
          <Input
            id="profile-display-name"
            value={displayName}
            onChange={(event) => { setDisplayName(event.target.value); setStatus(null) }}
            maxLength={80}
            autoComplete="name"
            disabled={isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email">Email address</Label>
          <Input id="profile-email" value={user?.email ?? ''} disabled />
          <p className="text-xs text-muted-foreground">Email is managed by your sign-in provider.</p>
        </div>
      </div>

      {status && <p className={status.includes('successfully') ? 'text-sm text-primary' : 'text-sm text-destructive'}>{status}</p>}

      <Button type="submit" disabled={isSaving || !hasChanges || !displayName.trim()}>
        {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  )
}
