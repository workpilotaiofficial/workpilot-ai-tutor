'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2, CreditCard, LoaderCircle, Receipt, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  cancelCurrentSubscription,
  createSubscriptionCheckout,
  fetchCurrentSubscription,
  fetchSubscriptionPlans,
  getApiClientErrorMessage,
  type CurrentSubscription,
  type RecentInvoice,
  type SubscriptionPlan,
} from '@/lib/api'

type BillingSettingsProps = {
  isActive: boolean
}

const BILLING_QUERY_KEY = 'billing'

const formatDate = (value: string | null) => {
  if (!value) {
    return 'Not available'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

const formatPlanPrice = (value: number | null) => {
  if (value === null) {
    return 'Custom pricing'
  }

  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} / month`
}

const formatInvoiceAmount = (invoice: RecentInvoice) => {
  if (invoice.amount === null) {
    return 'Amount unavailable'
  }

  if (!invoice.currency) {
    return invoice.amount.toLocaleString('en-US', {
      minimumFractionDigits: invoice.amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency.toUpperCase(),
    }).format(invoice.amount)
  } catch {
    return `${invoice.amount} ${invoice.currency.toUpperCase()}`
  }
}

const formatStatusLabel = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')

const normalizePlanMatcher = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

function CurrentPlanSkeleton() {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
        <div className="h-3 w-64 animate-pulse rounded bg-secondary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border bg-secondary/20 p-4">
              <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
              <div className="mt-3 h-5 w-28 animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
        <div className="h-9 w-40 animate-pulse rounded bg-secondary" />
      </CardContent>
    </Card>
  )
}

export default function BillingSettings({ isActive }: BillingSettingsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)
  const handledBillingStateRef = useRef<string | null>(null)

  const clearBillingQueryMarker = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (!params.has(BILLING_QUERY_KEY)) {
      return
    }

    params.delete(BILLING_QUERY_KEY)

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [pathname, router, searchParams])

  const loadBillingData = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      if (background) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const [subscription, availablePlans] = await Promise.all([
          fetchCurrentSubscription(),
          fetchSubscriptionPlans(),
        ])

        setCurrentSubscription(subscription)
        setPlans(availablePlans)
        setHasLoaded(true)

        return true
      } catch (error) {
        toast({
          title: 'Unable to load billing',
          description: getApiClientErrorMessage(error, 'Try again in a moment.'),
          variant: 'destructive',
        })

        return false
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    if (!isActive || hasLoaded || searchParams.get(BILLING_QUERY_KEY) === 'success') {
      return
    }

    void loadBillingData()
  }, [hasLoaded, isActive, loadBillingData, searchParams])

  useEffect(() => {
    if (!isActive) {
      return
    }

    const billingState = searchParams.get(BILLING_QUERY_KEY)

    if (!billingState || handledBillingStateRef.current === billingState) {
      return
    }

    handledBillingStateRef.current = billingState

    const handleBillingReturn = async () => {
      if (billingState === 'success') {
        const loaded = await loadBillingData({ background: hasLoaded })

        if (loaded) {
          toast({
            title: 'Payment completed',
            description: 'Your billing details were refreshed successfully.',
          })
        }
      }

      if (billingState === 'cancel') {
        toast({
          title: 'Checkout canceled',
          description: 'No billing changes were made.',
        })
      }

      clearBillingQueryMarker()
    }

    void handleBillingReturn()
  }, [clearBillingQueryMarker, hasLoaded, isActive, loadBillingData, searchParams, toast])

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setCheckoutPlanId(plan.id)

    try {
      const checkoutSession = await createSubscriptionCheckout({
        planId: plan.id,
        billingInterval: 'monthly',
      })

      window.location.assign(checkoutSession.checkoutUrl)
    } catch (error) {
      toast({
        title: 'Checkout failed',
        description: getApiClientErrorMessage(error, 'Unable to start checkout.'),
        variant: 'destructive',
      })
      setCheckoutPlanId(null)
    }
  }

  const handleCancelSubscription = async () => {
    setIsCanceling(true)

    try {
      await cancelCurrentSubscription()
      const loaded = await loadBillingData({ background: true })

      if (loaded) {
        toast({
          title: 'Subscription canceled',
          description: 'Your plan will stay updated after the billing refresh.',
        })
      }
    } catch (error) {
      toast({
        title: 'Cancellation failed',
        description: getApiClientErrorMessage(error, 'Unable to cancel the subscription right now.'),
        variant: 'destructive',
      })
    } finally {
      setIsCanceling(false)
    }
  }

  const invoiceItems = currentSubscription?.recentInvoices.slice(0, 5) ?? []
  const canCancel =
    currentSubscription !== null &&
    currentSubscription.planCode !== 'free' &&
    currentSubscription.status.toLowerCase() !== 'canceled'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Billing</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your current plan, change subscription tiers, and check recent invoices.
          </p>
        </div>

        {hasLoaded && (
          <Button variant="outline" onClick={() => void loadBillingData({ background: true })} disabled={isRefreshing}>
            {isRefreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
        )}
      </div>

      {isLoading && !hasLoaded ? (
        <CurrentPlanSkeleton />
      ) : (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Live subscription details from the billing service.</CardDescription>
              </div>
              <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                {formatStatusLabel(currentSubscription?.status ?? 'active')}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-secondary/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Plan</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{currentSubscription?.planName ?? 'Free'}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Billing Interval</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {currentSubscription?.billingInterval ? formatStatusLabel(currentSubscription.billingInterval) : 'Free plan'}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Current Period End</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatDate(currentSubscription?.currentPeriodEnd ?? null)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Monthly Credits</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {currentSubscription?.monthlyCreditAllotment ?? 'Not specified'}
                </p>
              </div>
            </div>

            {currentSubscription?.cancelAtPeriodEnd ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="text-sm">
                  This subscription is scheduled to end on {formatDate(currentSubscription.currentPeriodEnd)}.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="text-sm">
                  {currentSubscription?.planCode === 'free'
                    ? 'You are currently on the free plan.'
                    : 'Your paid subscription is active and ready for use.'}
                </div>
              </div>
            )}

            {canCancel ? (
              <div className="flex justify-start">
                <Button variant="outline" onClick={() => void handleCancelSubscription()} disabled={isCanceling}>
                  {isCanceling ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Cancel Subscription
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Upgrade Plans</CardTitle>
          <CardDescription>Available paid plans.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !hasLoaded ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-border bg-secondary/20 p-5">
                  <div className="h-5 w-24 animate-pulse rounded bg-secondary" />
                  <div className="mt-3 h-8 w-32 animate-pulse rounded bg-secondary" />
                  <div className="mt-4 h-9 w-full animate-pulse rounded bg-secondary" />
                </div>
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => {
                const currentPlanId = normalizePlanMatcher(currentSubscription?.planId)
                const currentPlanCode = normalizePlanMatcher(currentSubscription?.planCode)
                const currentPlanName = normalizePlanMatcher(currentSubscription?.planName)
                const planId = normalizePlanMatcher(plan.id)
                const planCode = normalizePlanMatcher(plan.code)
                const planName = normalizePlanMatcher(plan.name)
                const isCurrentPlan =
                  (currentPlanId.length > 0 && currentPlanId === planId) ||
                  (currentPlanCode.length > 0 && currentPlanCode === planCode) ||
                  (currentPlanName.length > 0 && currentPlanName === planName)
                const supportsMonthly = plan.billingIntervals.includes('monthly')
                const isCheckingOut = checkoutPlanId === plan.id

                return (
                  <div key={plan.id} className="rounded-xl border border-border bg-secondary/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{plan.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Code: {plan.code}</p>
                      </div>
                      {isCurrentPlan ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Current Plan
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-2xl font-semibold text-foreground">{formatPlanPrice(plan.priceMonthly)}</p>
                      <p className="text-sm text-muted-foreground">
                        Monthly credits: {plan.monthlyCreditAllotment ?? 'Not specified'}
                      </p>
                    </div>

                    <div className="mt-5">
                      <Button
                        onClick={() => void handleUpgrade(plan)}
                        disabled={isCurrentPlan || !supportsMonthly || isCheckingOut || Boolean(checkoutPlanId)}
                        className=' btn-primary'
                      >
                        {isCheckingOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        {isCurrentPlan ? 'Current Plan' : supportsMonthly ? 'Upgrade via Stripe' : 'Monthly unavailable'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-6 text-sm text-muted-foreground">
              No paid plans are available right now.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Recent Billing</CardTitle>
          <CardDescription>Recent invoice activity attached to your subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoiceItems.length > 0 ? (
            <div className="space-y-3">
              {invoiceItems.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/10 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-background p-2 text-primary">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {invoice.description ?? 'Subscription invoice'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatStatusLabel(invoice.status)} • {formatDate(invoice.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-foreground">{formatInvoiceAmount(invoice)}</p>
                    {invoice.hostedInvoiceUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                          View invoice
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-6 text-sm text-muted-foreground">
              No recent invoices are available for this account.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
