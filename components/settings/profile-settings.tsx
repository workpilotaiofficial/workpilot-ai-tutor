'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut, updateProfile, type User } from 'firebase/auth'
import { CheckCircle2, LoaderCircle, RefreshCcw, Trash2, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useToast } from '@/hooks/use-toast'
import { deleteCurrentUserAccount } from '@/lib/api/auth.service'
import { getApiClientErrorMessage } from '@/lib/api/client'
import {
  clearAuthBrowserState,
  getStoredAuthObject,
  replaceStoredAuthObject,
} from '@/lib/api/session-storage'
import { auth } from '@/lib/firebase'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
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
  const isDeleteConfirmed = deleteConfirmation.trim().toUpperCase() === 'DELETE'

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

  const deleteAccount = async () => {
    if (isDeleting || !isDeleteConfirmed) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteCurrentUserAccount()

      if (auth) {
        await signOut(auth).catch(() => null)
      }

      clearAuthBrowserState()
      setIsDeleteDialogOpen(false)
      toast({
        title: 'Account deleted',
        description: 'Your account and associated data have been permanently deleted.',
      })
      router.replace('/')
    } catch (error) {
      toast({
        title: 'Unable to delete account',
        description: getApiClientErrorMessage(
          error,
          'Your account could not be deleted. Please try again.',
        ),
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
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
        </div>
      </div>

      {status && <p className={status.includes('successfully') ? 'text-sm text-primary' : 'text-sm text-destructive'}>{status}</p>}

      <Button type="submit" disabled={isSaving || !hasChanges || !displayName.trim()}>
        {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>

      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-semibold text-destructive">Danger zone</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            className="shrink-0"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isSaving || isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </Button>
        </div>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (isDeleting) {
            return
          }

          setIsDeleteDialogOpen(open)

          if (!open) {
            setDeleteConfirmation('')
          }
        }}
      >
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Your profile, study materials, billing history, and other account data will be
              permanently deleted. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-account-confirmation">
              Type <span className="font-semibold text-foreground">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-account-confirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="off"
              disabled={isDeleting}
              aria-describedby="delete-account-description"
            />
            <p id="delete-account-description" className="text-xs text-muted-foreground">
              You will be signed out immediately after deletion.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Keep account</AlertDialogCancel>
            <button
              type="button"
              onClick={() => void deleteAccount()}
              disabled={isDeleting || !isDeleteConfirmed}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {isDeleting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting account...' : 'Delete permanently'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
