'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  CreditCard,
  LoaderCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  createCreditPackCheckout,
  createSubscriptionCheckout,
  fetchCreditBalance,
  fetchCreditPacks,
  fetchCurrentSubscription,
  fetchSubscriptionPlans,
  type CreditBalance,
  type CreditPack,
  type CurrentSubscription,
  type SubscriptionPlan,
} from '@/lib/api/billing.service'
import {
  getApiClientErrorMessage,
  type CreditLimitReachedEventDetail,
} from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { ScrollArea } from '../ui/scroll-area'

type Offer =
  | { kind: 'plan'; id: string }
  | { kind: 'pack'; id: string }

type InsufficientCreditsModalProps = {
  details?: CreditLimitReachedEventDetail | null
  onClose: () => void
  onOpenBilling: () => void
}

const DEMO_CREDIT_LIMIT_DETAILS: CreditLimitReachedEventDetail = {
  message:
    'Your current balance cannot cover this generation. ',
  path: '/demo/generation',
  data: {
    code: 'insufficient_credits',
    required_credits: 100,
    available_credits: 0,
  },
  status: 402,
}

function normalizeMatcher(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function isFreePlan(plan: SubscriptionPlan) {
  return normalizeMatcher(plan.code) === 'free'
}

function isCurrentPlan(
  plan: SubscriptionPlan,
  subscription: CurrentSubscription | null,
) {
  if (!subscription) {
    return false
  }

  const candidates = [
    [plan.id, subscription.planId],
    [plan.code, subscription.planCode],
    [plan.name, subscription.planName],
  ]

  return candidates.some(
    ([planValue, currentValue]) =>
      normalizeMatcher(planValue).length > 0 &&
      normalizeMatcher(planValue) === normalizeMatcher(currentValue),
  )
}

function formatUsd(value: number | null) {
  if (value === null) {
    return 'Contact us'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPackPrice(pack: CreditPack) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: pack.currency.toUpperCase(),
      minimumFractionDigits: pack.price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(pack.price)
  } catch {
    return `${pack.price.toLocaleString('en-US')} ${pack.currency.toUpperCase()}`
  }
}

function OfferSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-[98px] animate-pulse rounded-[19px] border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  )
}

export default function InsufficientCreditsModal({
  details = null,
  onClose,
  onOpenBilling,
}: InsufficientCreditsModalProps) {
  const resolvedDetails = details ?? DEMO_CREDIT_LIMIT_DETAILS
  const [subscription, setSubscription] =
    useState<CurrentSubscription | null>(null)
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [offerMode, setOfferMode] = useState<Offer['kind']>('plan')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  useEffect(() => {
    let isCancelled = false

    const loadOffers = async () => {
      setIsLoading(true)
      setLoadError('')

      const [subscriptionResult, balanceResult, plansResult, packsResult] =
        await Promise.allSettled([
          fetchCurrentSubscription(),
          fetchCreditBalance(),
          fetchSubscriptionPlans(),
          fetchCreditPacks(),
        ])

      if (isCancelled) {
        return
      }

      const nextSubscription =
        subscriptionResult.status === 'fulfilled'
          ? subscriptionResult.value
          : null
      const nextPlans =
        plansResult.status === 'fulfilled' ? plansResult.value : []
      const nextPacks =
        packsResult.status === 'fulfilled' ? packsResult.value : []

      setSubscription(nextSubscription)
      setBalance(
        balanceResult.status === 'fulfilled' ? balanceResult.value : null,
      )
      setPlans(nextPlans)
      setPacks(nextPacks)

      const firstUpgradePlan = nextPlans
        .filter(
          (plan) =>
            !isFreePlan(plan) &&
            plan.billingIntervals.includes('monthly') &&
            !isCurrentPlan(plan, nextSubscription),
        )
        .sort(
          (left, right) =>
            (left.priceMonthly ?? Number.POSITIVE_INFINITY) -
            (right.priceMonthly ?? Number.POSITIVE_INFINITY),
        )[0]

      setSelectedOffer(
        firstUpgradePlan
          ? { kind: 'plan', id: firstUpgradePlan.id }
          : nextPacks[0]
            ? { kind: 'pack', id: nextPacks[0].id }
            : null,
      )
      setOfferMode(firstUpgradePlan ? 'plan' : 'pack')

      if (
        plansResult.status === 'rejected' &&
        packsResult.status === 'rejected'
      ) {
        setLoadError(
          'We could not load checkout options right now. Open Billing to review your plan and credits.',
        )
      }

      setIsLoading(false)
    }

    void loadOffers()

    return () => {
      isCancelled = true
    }
  }, [])

  const upgradePlans = useMemo(
    () =>
      plans
        .filter(
          (plan) =>
            !isFreePlan(plan) &&
            plan.billingIntervals.includes('monthly') &&
            !isCurrentPlan(plan, subscription),
        )
        .sort(
          (left, right) =>
            (left.priceMonthly ?? Number.POSITIVE_INFINITY) -
            (right.priceMonthly ?? Number.POSITIVE_INFINITY),
        ),
    [plans, subscription],
  )

  const selectedPlan =
    selectedOffer?.kind === 'plan'
      ? upgradePlans.find((plan) => plan.id === selectedOffer.id) ?? null
      : null
  const selectedPack =
    selectedOffer?.kind === 'pack'
      ? packs.find((pack) => pack.id === selectedOffer.id) ?? null
      : null

  const handleOfferModeChange = (kind: Offer['kind']) => {
    setOfferMode(kind)

    if (kind === 'plan') {
      const firstPlan = upgradePlans[0]
      setSelectedOffer(
        firstPlan ? { kind: 'plan', id: firstPlan.id } : null,
      )
      return
    }

    const firstPack = packs[0]
    setSelectedOffer(
      firstPack ? { kind: 'pack', id: firstPack.id } : null,
    )
  }

  const handleContinue = async () => {
    if (!selectedPlan && !selectedPack) {
      onOpenBilling()
      return
    }

    setIsCheckingOut(true)
    setCheckoutError('')

    try {
      const checkout = selectedPlan
        ? await createSubscriptionCheckout({
            planId: selectedPlan.id,
            billingInterval: 'monthly',
          })
        : await createCreditPackCheckout({
            packId: (selectedPack as CreditPack).id,
          })

      if (!checkout.checkoutUrl) {
        throw new Error('Checkout URL was not returned.')
      }

      window.location.assign(checkout.checkoutUrl)
    } catch (error) {
      setCheckoutError(
        getApiClientErrorMessage(
          error,
          'Unable to start checkout. Please try again.',
        ),
      )
      setIsCheckingOut(false)
    }
  }

  const currentPlanName =
    subscription?.planName || balance?.plan || 'Current plan'

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="z-[81] max-h-[calc(100vh-2rem)] w-[min(672px,calc(100%-2rem))] max-w-none gap-0  rounded-[20px] border border-slate-200 bg-white p-0 text-slate-900 shadow-[0_32px_90px_rgba(0,0,0,0.32)] [&_[data-slot=dialog-close]]:right-7 [&_[data-slot=dialog-close]]:top-7 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:p-1 [&_[data-slot=dialog-close]]:text-slate-500 [&_[data-slot=dialog-close]]:hover:bg-slate-100 [&_[data-slot=dialog-close]_svg]:size-5"
        showCloseButton
      >
<ScrollArea className="max-h-[calc(100vh-2rem)] w-full overflow-y-auto">
          <DialogHeader className="border-b border-slate-200 px-8 pb-8 pt-8 text-center sm:px-12 sm:text-center">
            <DialogTitle className="text-[32px] font-bold leading-tight tracking-[-0.025em] text-primary">
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-lg text-sm leading-6 text-slate-600 sm:text-sm">
              {resolvedDetails.message}
            </DialogDescription>
          </DialogHeader>

          <div className="px-7 pb-7 pt-6 sm:px-[20px]">
            <div className="space-y-[17px] text-sm">
              {[
                'More credits for uploads and pasted study material',
                'Create more flashcards, quizzes, and study notes',
                'Turn more syllabi into clear learning roadmaps',
                'Grade more papers with rubric-based AI feedback',
                'Use one credit balance across every AI study tool',
              ].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-4 text-sm leading-6 text-slate-700 "
                >
                  <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-[12px] w-[12px]" strokeWidth={2} />
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-7">
              {isLoading ? (
                <OfferSkeleton />
              ) : offerMode === 'plan' && upgradePlans.length > 0 ? (
                <div className="space-y-[18px] pt-2">
                  {upgradePlans.map((plan, index) => {
                    const isSelected =
                      selectedOffer?.kind === 'plan' &&
                      selectedOffer.id === plan.id

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() =>
                          setSelectedOffer({ kind: 'plan', id: plan.id })
                        }
                        className={cn(
                          'relative flex min-h-[98px] w-full items-center gap-4 rounded-[19px] border px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0877ee]/50',
                          isSelected
                            ? 'border-[#2f80ff] bg-[#edf4ff] shadow-[0_8px_24px_rgba(21,101,247,0.08)]'
                            : 'border-slate-200 bg-white hover:border-[#2f80ff]/50',
                        )}
                      >
                        {index === 0 ? (
                          <span className="absolute -top-[15px] left-1/2 -translate-x-1/2 rounded-full bg-[#3478ed] px-4 py-1.5 text-[11px] font-bold text-white shadow-md">
                            ☆ Recommended
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            'flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full border-2',
                            isSelected
                              ? 'border-[#3e8cff]'
                              : 'border-slate-300',
                          )}
                        >
                          {isSelected ? (
                            <span className="h-[13px] w-[13px] rounded-full bg-[#3e8cff]" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px] font-medium text-slate-700">
                            {plan.name}
                          </span>
                          <span className="mt-1.5 inline-flex rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {plan.monthlyCreditAllotment === null
                              ? 'Monthly credits included'
                              : `${plan.monthlyCreditAllotment.toLocaleString('en-US')} credits every month`}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[18px] font-bold text-slate-800">
                            {formatUsd(plan.priceMonthly)}
                          </span>
                          <span className="mt-1 block text-[13px] text-slate-500">
                            Billed monthly
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : offerMode === 'pack' && packs.length > 0 ? (
                <div className="space-y-3">
                  {packs.map((pack) => {
                    const isSelected =
                      selectedOffer?.kind === 'pack' &&
                      selectedOffer.id === pack.id

                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() =>
                          setSelectedOffer({ kind: 'pack', id: pack.id })
                        }
                        className={cn(
                          'flex min-h-[98px] w-full items-center gap-4 rounded-[19px] border px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0877ee]/50',
                          isSelected
                            ? 'border-[#2f80ff] bg-[#edf4ff] shadow-[0_8px_24px_rgba(21,101,247,0.08)]'
                            : 'border-slate-200 bg-white hover:border-[#2f80ff]/50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full border-2',
                            isSelected
                              ? 'border-[#3e8cff]'
                              : 'border-slate-300',
                          )}
                        >
                          {isSelected ? (
                            <span className="h-[13px] w-[13px] rounded-full bg-[#3e8cff]" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-[17px] font-medium text-slate-700">
                            {pack.name}
                          </span>
                          <span className="mt-1.5 block text-[13px] text-slate-500">
                            {pack.credits.toLocaleString('en-US')} credits ·
                            one-time purchase
                          </span>
                        </span>
                        <span className="shrink-0 text-[18px] font-bold text-slate-800">
                          {formatPackPrice(pack)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-[19px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  {loadError ||
                    'No checkout options are available at the moment.'}
                </div>
              )}
            </div>

            {!isLoading && upgradePlans.length > 0 && packs.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  handleOfferModeChange(
                    offerMode === 'plan' ? 'pack' : 'plan',
                  )
                }
                className="mt-4 block w-full text-center text-[13px] font-medium text-[#0877ee] hover:underline"
              >
                {offerMode === 'plan'
                  ? 'Prefer a one-time top-up? View credit packs'
                  : 'Prefer monthly credits? View subscription plans'}
              </button>
            ) : null}

            {checkoutError ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {checkoutError}
              </p>
            ) : null}

            <Button
              type="button"
              size="lg"
              className="mt-7 h-16 w-full rounded-[17px] bg-gradient-to-r from-[#1275f4] to-[#0797ed] text-[19px] font-bold text-white shadow-[0_10px_22px_rgba(24,111,225,0.24)] hover:opacity-95"
              onClick={() => void handleContinue()}
              disabled={isLoading || isCheckingOut}
            >
              {isCheckingOut ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              {isCheckingOut
                ? 'Opening secure checkout...'
                : 'Continue'}
            </Button>

            {/* <div className="mt-4 text-center text-[13px] text-slate-500">
            <span>
              {currentPlanName} plan
              {' · '}
              {(balance?.current ?? 0).toLocaleString('en-US')} credits
              available
            </span>
            <span aria-hidden="true"> · </span>
            <button
              type="button"
              onClick={onOpenBilling}
              className="font-semibold text-[#0877ee] hover:underline"
            >
              Billing details
            </button>
          </div> */}
          </div>
  </ScrollArea>

      </DialogContent>
    </Dialog>
  )
}
