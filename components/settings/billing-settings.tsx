'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Coins,
  CreditCard,
  LoaderCircle,
  Package,
  Receipt,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  cancelCurrentSubscription,
  createCreditPackCheckout,
  createSubscriptionCheckout,
  fetchCreditPacks,
  fetchCurrentSubscription,
  fetchSubscriptionPlans,
  getApiClientErrorMessage,
  type CreditPack,
  type CurrentSubscription,
  type RecentInvoice,
  type SubscriptionPlan,
} from '@/lib/api'
import { CreditLimitReachedEventDetail } from '@/lib/api/client'

type BillingSettingsProps = {
  isActive: boolean,
  creditLimitDetails?: CreditLimitReachedEventDetail | null
}

const BILLING_QUERY_KEY = 'billing'
const CHECKOUT_PLAN_QUERY_KEY = 'checkout_plan'

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

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatPackPrice = (pack: CreditPack) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: pack.currency.toUpperCase(),
      minimumFractionDigits: pack.price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(pack.price)
  } catch {
    return `${pack.price.toLocaleString('en-US', {
      minimumFractionDigits: pack.price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })} ${pack.currency.toUpperCase()}`
  }
}

const getPlanDescription = (code: string) => {
  const descriptions: Record<string, string> = {
    free: 'Explore the essentials at your own pace.',
    starter: 'A simple start for everyday learning.',
    premium: 'More room for consistent, focused study.',
    power: 'High-capacity access for ambitious learners.',
  }

  return descriptions[code.toLowerCase()] ?? 'Flexible monthly access for your learning needs.'
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

export default function BillingSettings({ isActive, creditLimitDetails = null }: BillingSettingsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null)
  const [checkoutPackId, setCheckoutPackId] = useState<string | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)
  const handledBillingStateRef = useRef<string | null>(null)
  const handledCheckoutPlanRef = useRef<string | null>(null)

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
        const [subscription, availablePlans, availableCreditPacks] = await Promise.all([
          fetchCurrentSubscription(),
          fetchSubscriptionPlans(),
          fetchCreditPacks(),
        ])

        setCurrentSubscription(subscription)
        setPlans(availablePlans)
        setCreditPacks(availableCreditPacks)
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

    if (
      !billingState ||
      !['success', 'cancel'].includes(billingState) ||
      handledBillingStateRef.current === billingState
    ) {
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

  const clearCheckoutPlanQueryMarker = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (!params.has(CHECKOUT_PLAN_QUERY_KEY)) {
      return
    }

    params.delete(CHECKOUT_PLAN_QUERY_KEY)

    if (params.get(BILLING_QUERY_KEY) === 'checkout') {
      params.delete(BILLING_QUERY_KEY)
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [pathname, router, searchParams])

  const handleUpgrade = useCallback(async (plan: SubscriptionPlan) => {
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
      clearCheckoutPlanQueryMarker()
    }
  }, [clearCheckoutPlanQueryMarker, toast])

  useEffect(() => {
    const requestedPlanId = searchParams.get(CHECKOUT_PLAN_QUERY_KEY)

    if (
      !isActive ||
      !hasLoaded ||
      !requestedPlanId ||
      searchParams.get(BILLING_QUERY_KEY) !== 'checkout' ||
      handledCheckoutPlanRef.current === requestedPlanId
    ) {
      return
    }

    handledCheckoutPlanRef.current = requestedPlanId

    const requestedPlan = plans.find((plan) => plan.id === requestedPlanId)

    if (!requestedPlan || !requestedPlan.billingIntervals.includes('monthly')) {
      toast({
        title: 'Plan unavailable',
        description: 'The selected monthly plan is no longer available.',
        variant: 'destructive',
      })
      clearCheckoutPlanQueryMarker()
      return
    }

    const isCurrentPlan =
      requestedPlan.id === currentSubscription?.planId ||
      requestedPlan.code.toLowerCase() === currentSubscription?.planCode.toLowerCase()

    if (isCurrentPlan) {
      toast({
        title: 'Current plan',
        description: `You are already subscribed to the ${requestedPlan.name} plan.`,
      })
      clearCheckoutPlanQueryMarker()
      return
    }

    void handleUpgrade(requestedPlan)
  }, [
    clearCheckoutPlanQueryMarker,
    currentSubscription,
    handleUpgrade,
    hasLoaded,
    isActive,
    plans,
    searchParams,
    toast,
  ])

  const handleBuyPack = async (pack: CreditPack) => {
    setCheckoutPackId(pack.id)

    try {
      const checkoutSession = await createCreditPackCheckout({
        packId: pack.id,
      })

      if (!checkoutSession.checkoutUrl) {
        throw new Error('Checkout URL was not returned for this credit pack.')
      }

      window.location.assign(checkoutSession.checkoutUrl)
    } catch (error) {
      toast({
        title: 'Pack checkout failed',
        description: getApiClientErrorMessage(error, 'Unable to start credit pack checkout.'),
        variant: 'destructive',
      })
      setCheckoutPackId(null)
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
      {creditLimitDetails && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <h3 className="font-semibold">
              You’ve reached your credit limit
            </h3>

            <p className="mt-1 text-sm">
              {creditLimitDetails.message ||
                'You do not have enough credits to complete this action. Buy a credit pack or upgrade your plan to continue.'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  document
                    .getElementById('credit-packs')
                    ?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                }}
              >
                Buy credits
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  document
                    .getElementById('subscription-plans')
                    ?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                }}
              >
                Upgrade plan
              </Button>
            </div>
          </div>
        </div>
      )}
      {isLoading && !hasLoaded ? (
        <CurrentPlanSkeleton />
      ) : (
        <Card className="overflow-hidden border-border/80 shadow-sm">
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

      <Card id="subscription-plans" className="scroll-mt-4 overflow-hidden border-border/80 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
 
            
              <CardTitle className="text-base sm:text-lg">Choose your plan</CardTitle>
              
       
        </CardHeader>
        <CardContent>
          {isLoading && !hasLoaded ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border bg-secondary/20 p-5">
                  <div className="h-5 w-24 animate-pulse rounded bg-secondary" />
                  <div className="mt-3 h-8 w-32 animate-pulse rounded bg-secondary" />
                  <div className="mt-4 h-9 w-full animate-pulse rounded bg-secondary" />
                </div>
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid items-stretch gap-4 grid-cols-1 sm:grid-cols-2 ">
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
                const isPopular = plan.code.toLowerCase() === 'premium'

                return (
                  <div
                    key={plan.id}
                    className={`relative flex min-h-[300px] flex-col overflow-hidden rounded-2xl border bg-card p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      isPopular
                        ? 'border-primary/50 shadow-[0_12px_30px_-18px_color-mix(in_srgb,var(--primary)_55%,transparent)]'
                        : 'border-border/80'
                    }`}
                  >
                    {isPopular ? (
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-thirdary to-primary" />
                    ) : null}

                    <div className="flex min-h-12 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold tracking-tight text-foreground">{plan.name}</p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {getPlanDescription(plan.code)}
                        </p>
                      </div>
                      {isCurrentPlan ? (
                        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Current
                        </div>
                      ) : isPopular ? (
                        <div className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                          Popular
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 flex items-end gap-1.5 border-b border-border/70 pb-5">
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {formatPlanPrice(plan.priceMonthly)}
                      </p>
                      {plan.priceMonthly !== null ? (
                        <span className="pb-1 text-sm text-muted-foreground">/ month</span>
                      ) : null}
                    </div>

                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3.5 stroke-[2.5]" />
                        </span>
                        <span className="text-foreground/80">
                          <strong className="font-semibold text-foreground">
                            {plan.monthlyCreditAllotment?.toLocaleString('en-US') ?? 'Flexible'}
                          </strong>{' '}
                          credits included each month
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3.5 stroke-[2.5]" />
                        </span>
                        <span className="text-foreground/80">
                          {supportsMonthly ? 'Simple monthly billing' : 'Contact us for billing options'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto pt-6">
                      <Button
                        onClick={() => void handleUpgrade(plan)}
                        disabled={
                          isCurrentPlan ||
                          !supportsMonthly ||
                          isCheckingOut ||
                          Boolean(checkoutPlanId) ||
                          Boolean(checkoutPackId)
                        }
                        variant={isCurrentPlan ? 'outline' : 'default'}
                        className={`h-10 w-full rounded-lg font-semibold ${isCurrentPlan ? '' : 'btn-primary'}`}
                      >
                        {isCheckingOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        {isCurrentPlan ? 'Your current plan' : supportsMonthly ? 'Choose plan' : 'Monthly unavailable'}
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

      <Card id="credit-packs" className="scroll-mt-4 overflow-hidden border-border/80 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-2">
   
              <CardTitle className="text-base sm:text-lg">Top up your credits</CardTitle>
        
    
        </CardHeader>
        <CardContent>
          {isLoading && !hasLoaded ? (
            <div className="grid gap-4 sm:grid-cols-2 grid-cols-1">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border bg-secondary/20 p-5">
                  <div className="h-5 w-24 animate-pulse rounded bg-secondary" />
                  <div className="mt-3 h-8 w-32 animate-pulse rounded bg-secondary" />
                  <div className="mt-4 h-9 w-full animate-pulse rounded bg-secondary" />
                </div>
              ))}
            </div>
          ) : creditPacks.length > 0 ? (
            <div className="grid items-stretch gap-4 sm:grid-cols-2 grid-cols-1">
              {creditPacks.map((pack) => {
                const isCheckingOut = checkoutPackId === pack.id

                return (
                  <div
                    key={pack.id}
                    className="group flex min-h-[270px] flex-col rounded-2xl border border-border/80 bg-card p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60 text-primary transition-colors group-hover:border-primary/15 group-hover:bg-primary/10">
                          <Package className="size-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{pack.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">One-time purchase</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-border/70 bg-muted/25 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Credit amount
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-3xl font-bold tracking-tight text-foreground">
                          {pack.credits.toLocaleString('en-US')}
                        </p>
                        <span className="text-sm font-medium text-muted-foreground">credits</span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4 pt-5">
                      <div>
                        <p className="text-xs text-muted-foreground">Total price</p>
                        <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
                          {formatPackPrice(pack)}
                        </p>
                      </div>
                      <Button
                        onClick={() => void handleBuyPack(pack)}
                        disabled={isCheckingOut || Boolean(checkoutPlanId) || Boolean(checkoutPackId)}
                        className="btn-primary h-10 rounded-lg px-4 font-semibold"
                      >
                        {isCheckingOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        Buy credits
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-6 text-sm text-muted-foreground">
              No credit packs are available right now.
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
