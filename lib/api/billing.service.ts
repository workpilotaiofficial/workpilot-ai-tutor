import { apiClient } from '@/lib/api/client'

type ApiRecord = Record<string, unknown>

type SubscriptionPlanResponse = {
  data?: unknown
}

type SubscriptionResponse = {
  data?: unknown
  subscription?: unknown
  invoices?: unknown
  recent_invoices?: unknown
}

type CreateCheckoutPayload = {
  planId: string
  billingInterval: 'monthly'
}

type CreateCreditPackCheckoutPayload = {
  packId: string
}

type CreateCheckoutResponse = {
  checkout_url?: string
  session_id?: string
  expires_at?: string | null
}

type CreditBalanceResponse = {
  balance?: unknown
}

type CreditHistoryResponse = {
  data?: unknown
  history?: unknown
  entries?: unknown
  items?: unknown
  next_cursor?: unknown
  nextCursor?: unknown
  has_more?: unknown
  hasMore?: unknown
  pagination?: unknown
  meta?: unknown
}

type CreditPackResponse = {
  data?: unknown
}

export type SubscriptionPlan = {
  id: string
  code: string
  name: string
  monthlyCreditAllotment: number | null
  priceMonthly: number | null
  billingIntervals: string[]
}

export type CreditPack = {
  id: string
  code: string
  name: string
  credits: number
  price: number
  currency: string
}

export type RecentInvoice = {
  id: string
  status: string
  description: string | null
  amount: number | null
  currency: string | null
  hostedInvoiceUrl: string | null
  invoicePdfUrl: string | null
  createdAt: string | null
  paidAt: string | null
}

export type CurrentSubscription = {
  planId: string | null
  planCode: string
  planName: string
  status: string
  billingInterval: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  monthlyCreditAllotment: number | null
  recentInvoices: RecentInvoice[]
}

export type SubscriptionCheckoutSession = {
  checkoutUrl: string
  sessionId: string
  expiresAt: string | null
}

export type CreditBalance = {
  current: number
  plan: string | null
  monthlyAllotment: number | null
  periodUsed: number | null
  periodStart: string | null
  periodEnd: string | null
}

export type CreditHistoryEntry = {
  id: string
  eventType: string | null
  amount: number | null
  balanceAfter: number | null
  taskType: string | null
  modelName: string | null
  provider: string | null
  rawProviderTokens: number | null
  multiplier: number | null
  note: string | null
  createdAt: string | null
}

export type FetchCreditHistoryParams = {
  limit?: number
  cursor?: string | null
  eventType?: string
  from?: string
  to?: string
}

export type FetchCreditHistoryResult = {
  entries: CreditHistoryEntry[]
  nextCursor: string | null
  hasMore: boolean
}

const PAYMENTS_SUBSCRIPTION_ENDPOINT = '/api/v1/payments/subscription'
const PAYMENTS_PLANS_ENDPOINT = '/api/v1/payments/plans'
const PAYMENTS_PACKS_ENDPOINT = '/api/v1/payments/packs'
const PAYMENTS_CHECKOUT_ENDPOINT = '/api/v1/payments/create-checkout'
const PAYMENTS_TOPUP_ENDPOINT = '/api/v1/payments/topup'
const PAYMENTS_CANCEL_SUBSCRIPTION_ENDPOINT = '/api/v1/payments/cancel-subscription'
const CREDITS_BALANCE_ENDPOINT = '/api/v1/credits/balance'
const CREDITS_HISTORY_ENDPOINT = '/api/v1/credits/history'

const FREE_SUBSCRIPTION: CurrentSubscription = {
  planId: null,
  planCode: 'free',
  planName: 'Free',
  status: 'active',
  billingInterval: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  monthlyCreditAllotment: null,
  recentInvoices: [],
}

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ApiRecord) : null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : null
  }

  return null
}

function readBoolean(value: unknown): boolean {
  return value === true
}

function readStringArray(value: unknown): string[] {
  return asArray(value).filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function slugifyPlanValue(value: string | null) {
  if (!value) {
    return null
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return normalized.length > 0 ? normalized : null
}

function readNestedRecord(record: ApiRecord | null, keys: string[]) {
  if (!record) {
    return null
  }

  for (const key of keys) {
    const nested = asRecord(record[key])
    if (nested) {
      return nested
    }
  }

  return null
}

function readNestedArray(record: ApiRecord | null, keys: string[]) {
  if (!record) {
    return []
  }

  for (const key of keys) {
    const nested = asArray(record[key])
    if (nested.length > 0) {
      return nested
    }
  }

  return []
}

function normalizePlan(plan: unknown): SubscriptionPlan | null {
  const record = asRecord(plan)

  if (!record) {
    return null
  }

  const id = readString(record.id)
  const code = readString(record.code)
  const name = readString(record.name)

  if (!id || !code || !name) {
    return null
  }

  return {
    id,
    code,
    name,
    monthlyCreditAllotment: readNumber(record.monthly_credit_allotment),
    priceMonthly: readNumber(record.price_monthly),
    billingIntervals: readStringArray(record.billing_intervals),
  }
}

function normalizeCreditPack(pack: unknown): CreditPack | null {
  const record = asRecord(pack)

  if (!record) {
    return null
  }

  const id = readString(record.id)
  const code = readString(record.code)
  const name = readString(record.name)
  const credits = readNumber(record.credits)
  const price = readNumber(record.price)
  const currency = readString(record.currency)

  if (!id || !code || !name || credits === null || price === null || !currency) {
    return null
  }

  return {
    id,
    code,
    name,
    credits,
    price,
    currency,
  }
}

function normalizeInvoice(invoice: unknown, index: number): RecentInvoice | null {
  const record = asRecord(invoice)

  if (!record) {
    return null
  }

  const createdAt =
    readString(record.created_at) ??
    readString(record.date) ??
    readString(record.invoice_date) ??
    readString(record.period_start)

  const paidAt = readString(record.paid_at) ?? readString(record.status_transitions_paid_at)
  const fallbackId = `invoice-${createdAt ?? index}`

  return {
    id: readString(record.id) ?? fallbackId,
    status: readString(record.status) ?? 'unknown',
    description: readString(record.description),
    amount:
      readNumber(record.amount_paid) ??
      readNumber(record.amount_due) ??
      readNumber(record.total) ??
      readNumber(record.amount),
    currency: readString(record.currency),
    hostedInvoiceUrl: readString(record.hosted_invoice_url) ?? readString(record.invoice_url),
    invoicePdfUrl: readString(record.invoice_pdf) ?? readString(record.invoice_pdf_url),
    createdAt,
    paidAt,
  }
}

function normalizeCurrentSubscription(payload: SubscriptionResponse): CurrentSubscription {
  const root = asRecord(payload)
  const dataRecord = asRecord(root?.data) ?? root
  const subscriptionRecord =
    readNestedRecord(dataRecord, ['subscription', 'current_subscription', 'currentSubscription']) ??
    dataRecord

  const planRecord =
    readNestedRecord(subscriptionRecord, ['plan', 'subscription_plan']) ??
    readNestedRecord(dataRecord, ['plan', 'subscription_plan'])

  const invoices =
    dataRecord === root
      ? readNestedArray(root, ['recent_invoices', 'invoices'])
      : [...readNestedArray(dataRecord, ['recent_invoices', 'invoices']), ...readNestedArray(root, ['recent_invoices', 'invoices'])]

  const planId = readString(planRecord?.id) ?? readString(subscriptionRecord?.plan_id)
  const rawPlanName =
    readString(planRecord?.name) ??
    readString(subscriptionRecord?.plan_name)
  const planCode =
    slugifyPlanValue(readString(planRecord?.code)) ??
    slugifyPlanValue(readString(subscriptionRecord?.plan_code)) ??
    slugifyPlanValue(readString(subscriptionRecord?.plan)) ??
    slugifyPlanValue(rawPlanName) ??
    FREE_SUBSCRIPTION.planCode
  const planName =
    rawPlanName ??
    (planCode === 'free' ? 'Free' : planCode.charAt(0).toUpperCase() + planCode.slice(1))

  const normalized: CurrentSubscription = {
    planId,
    planCode,
    planName,
    status: readString(subscriptionRecord?.status) ?? FREE_SUBSCRIPTION.status,
    billingInterval:
      readString(subscriptionRecord?.billing_interval) ??
      readString(subscriptionRecord?.interval) ??
      FREE_SUBSCRIPTION.billingInterval,
    currentPeriodEnd:
      readString(subscriptionRecord?.current_period_end) ??
      readString(subscriptionRecord?.current_period_ends_at) ??
      readString(subscriptionRecord?.ends_at) ??
      FREE_SUBSCRIPTION.currentPeriodEnd,
    cancelAtPeriodEnd:
      readBoolean(subscriptionRecord?.cancel_at_period_end) ||
      readBoolean(subscriptionRecord?.cancel_at_renewal) ||
      FREE_SUBSCRIPTION.cancelAtPeriodEnd,
    monthlyCreditAllotment:
      readNumber(subscriptionRecord?.monthly_credit_allotment) ??
      readNumber(planRecord?.monthly_credit_allotment) ??
      FREE_SUBSCRIPTION.monthlyCreditAllotment,
    recentInvoices: invoices
      .map((invoice, index) => normalizeInvoice(invoice, index))
      .filter((invoice): invoice is RecentInvoice => Boolean(invoice)),
  }

  if (
    !normalized.planId &&
    normalized.planCode === FREE_SUBSCRIPTION.planCode &&
    normalized.planName === FREE_SUBSCRIPTION.planName
  ) {
    return normalized
  }

  if (!normalized.planId && !rawPlanName && normalized.planCode === FREE_SUBSCRIPTION.planCode) {
    return FREE_SUBSCRIPTION
  }

  return normalized
}

export async function fetchSubscriptionPlans(signal?: AbortSignal) {
  const response = await apiClient.request<SubscriptionPlanResponse>(PAYMENTS_PLANS_ENDPOINT, {
    signal,
    omitAuthHeader: true,
    retryOnUnauthorized: false,
  })
  return asArray(response?.data)
    .map(normalizePlan)
    .filter((plan): plan is SubscriptionPlan => Boolean(plan))
}

function normalizeCreditHistoryEntry(entry: unknown, index: number): CreditHistoryEntry | null {
  const record = asRecord(entry)

  if (!record) {
    return null
  }

  const createdAt = readString(record.created_at) ?? readString(record.createdAt)
  const eventType = readString(record.event_type) ?? readString(record.eventType)
  const id = readString(record.id) ?? `credit-history-${createdAt ?? eventType ?? index}`

  return {
    id,
    eventType,
    amount: readNumber(record.amount),
    balanceAfter: readNumber(record.balance_after) ?? readNumber(record.balanceAfter),
    taskType: readString(record.task_type) ?? readString(record.taskType),
    modelName: readString(record.model_name) ?? readString(record.modelName),
    provider: readString(record.provider),
    rawProviderTokens:
      readNumber(record.raw_provider_tokens) ?? readNumber(record.rawProviderTokens),
    multiplier: readNumber(record.multiplier),
    note: readString(record.note) ?? readString(record.description),
    createdAt,
  }
}

function extractCreditHistoryRecords(response: CreditHistoryResponse) {
  if (Array.isArray(response)) {
    return response
  }

  const root = asRecord(response)
  const data = root?.data

  if (Array.isArray(data)) {
    return data
  }

  const dataRecord = asRecord(data)
  const containers = [dataRecord, root]

  for (const container of containers) {
    if (!container) continue

    for (const key of ['history', 'entries', 'items', 'records']) {
      if (Array.isArray(container[key])) {
        return container[key] as unknown[]
      }
    }
  }

  return []
}

function extractCreditHistoryPagination(response: CreditHistoryResponse) {
  const root = asRecord(response)
  const data = asRecord(root?.data)
  const candidates = [
    asRecord(data?.pagination),
    asRecord(data?.meta),
    data,
    asRecord(root?.pagination),
    asRecord(root?.meta),
    root,
  ]

  let nextCursor: string | null = null
  let hasMore: boolean | null = null

  for (const candidate of candidates) {
    if (!candidate) continue

    nextCursor ??= readString(candidate.next_cursor) ?? readString(candidate.nextCursor)

    if (hasMore === null) {
      const rawHasMore = candidate.has_more ?? candidate.hasMore
      hasMore = typeof rawHasMore === 'boolean' ? rawHasMore : null
    }
  }

  return {
    nextCursor,
    hasMore: hasMore ?? Boolean(nextCursor),
  }
}

export async function fetchCreditPacks() {
  const response = await apiClient.request<CreditPackResponse>(PAYMENTS_PACKS_ENDPOINT)
  return asArray(response?.data)
    .map(normalizeCreditPack)
    .filter((pack): pack is CreditPack => Boolean(pack))
}

export async function fetchCurrentSubscription() {
  const response = await apiClient.request<SubscriptionResponse>(PAYMENTS_SUBSCRIPTION_ENDPOINT)
  return normalizeCurrentSubscription(response)
}

export async function createSubscriptionCheckout(payload: CreateCheckoutPayload) {
  const response = await apiClient.request<CreateCheckoutResponse>(PAYMENTS_CHECKOUT_ENDPOINT, {
    method: 'POST',
    body: {
      plan_id: payload.planId,
      billing_interval: payload.billingInterval,
    },
  })

  const responseRecord = asRecord(response)
  const checkoutRecord = asRecord(responseRecord?.data) ?? responseRecord
  const checkoutUrl = readString(checkoutRecord?.checkout_url)
  const sessionId = readString(checkoutRecord?.session_id)

  if (!checkoutUrl || !sessionId) {
    throw new Error('Checkout session response is incomplete.')
  }

  return {
    checkoutUrl,
    sessionId,
    expiresAt: readString(checkoutRecord?.expires_at),
  } satisfies SubscriptionCheckoutSession
}

export async function createCreditPackCheckout(payload: CreateCreditPackCheckoutPayload) {
  const response = await apiClient.request<CreateCheckoutResponse>(PAYMENTS_TOPUP_ENDPOINT, {
    method: 'POST',
    body: {
      topup_pack_id: payload.packId,
    },
  })

  const responseRecord = asRecord(response)
  const checkoutRecord = asRecord(responseRecord?.data) ?? responseRecord
  const checkoutUrl = readString(checkoutRecord?.checkout_url)
  const sessionId = readString(checkoutRecord?.session_id)

  if (!sessionId) {
    throw new Error('Checkout session response is incomplete.')
  }

  return {
    checkoutUrl: checkoutUrl ?? '',
    sessionId,
    expiresAt: readString(checkoutRecord?.expires_at),
  } satisfies SubscriptionCheckoutSession
}

export async function cancelCurrentSubscription() {
  return apiClient.request<unknown>(PAYMENTS_CANCEL_SUBSCRIPTION_ENDPOINT, {
    method: 'POST',
  })
}

export async function fetchCreditBalance() {
  const response = await apiClient.request<CreditBalanceResponse>(CREDITS_BALANCE_ENDPOINT)
  const root = asRecord(response)
  const balanceRecord = asRecord(root?.balance)

  return {
    current: readNumber(balanceRecord?.current) ?? 0,
    plan: readString(balanceRecord?.plan),
    monthlyAllotment: readNumber(balanceRecord?.monthly_allotment),
    periodUsed:
      readNumber(balanceRecord?.period_used) ??
      (typeof balanceRecord?.period_used === 'string' ? readNumber(Number(balanceRecord.period_used)) : null),
    periodStart: readString(balanceRecord?.period_start),
    periodEnd: readString(balanceRecord?.period_end),
  } satisfies CreditBalance
}

export async function fetchCreditHistory(
  params: FetchCreditHistoryParams = {},
  signal?: AbortSignal,
): Promise<FetchCreditHistoryResult> {
  const searchParams = new URLSearchParams()
  const limit = Math.min(100, Math.max(1, Math.trunc(params.limit ?? 10)))

  searchParams.set('limit', String(limit))

  if (params.cursor) {
    searchParams.set('cursor', params.cursor)
  }

  if (params.eventType?.trim()) {
    searchParams.set('event_type', params.eventType.trim())
  }

  if (params.from) {
    searchParams.set('from', params.from)
  }

  if (params.to) {
    searchParams.set('to', params.to)
  }

  const response = await apiClient.request<CreditHistoryResponse>(
    `${CREDITS_HISTORY_ENDPOINT}?${searchParams.toString()}`,
    { signal },
  )
  const pagination = extractCreditHistoryPagination(response)

  return {
    entries: extractCreditHistoryRecords(response)
      .map(normalizeCreditHistoryEntry)
      .filter((entry): entry is CreditHistoryEntry => Boolean(entry)),
    ...pagination,
  }
}
