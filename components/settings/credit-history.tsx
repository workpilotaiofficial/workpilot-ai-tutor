'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarClock, Coins, Filter, LoaderCircle, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  fetchCreditHistory,
  getApiClientErrorMessage,
  type CreditHistoryEntry,
  type FetchCreditHistoryParams,
} from '@/lib/api'

type CreditHistoryProps = {
  refreshKey?: number
}

type HistoryFilters = {
  limit: number
  eventType: string
  from: string
  to: string
}

const DEFAULT_FILTERS: HistoryFilters = {
  limit: 10,
  eventType: '',
  from: '',
  to: '',
}

function formatLabel(value: string | null) {
  if (!value) return 'Credit event'

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatDateTime(value: string | null) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)
}

function toRfc3339(value: string) {
  if (!value) return undefined

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function getAmountTone(amount: number | null) {
  if (amount === null || amount === 0) return 'bg-secondary text-foreground'
  return amount > 0
    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
}

function EntryDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-foreground" title={value}>{value}</dd>
    </div>
  )
}

export default function CreditHistory({ refreshKey = 0 }: CreditHistoryProps) {
  const [draftFilters, setDraftFilters] = useState<HistoryFilters>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<HistoryFilters>(DEFAULT_FILTERS)
  const [entries, setEntries] = useState<CreditHistoryEntry[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [reloadNonce, setReloadNonce] = useState(0)
  const requestIdRef = useRef(0)

  const eventTypeSuggestions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.eventType).filter((value): value is string => Boolean(value)))),
    [entries],
  )

  const buildParams = useCallback((filters: HistoryFilters, cursor?: string | null): FetchCreditHistoryParams => ({
    limit: filters.limit,
    cursor,
    eventType: filters.eventType,
    from: toRfc3339(filters.from),
    to: toRfc3339(filters.to),
  }), [])

  useEffect(() => {
    const abortController = new AbortController()
    const requestId = ++requestIdRef.current

    setIsLoading(true)
    setIsLoadingMore(false)
    setError(null)

    void fetchCreditHistory(buildParams(appliedFilters), abortController.signal)
      .then((result) => {
        if (requestId !== requestIdRef.current) return
        setEntries(result.entries)
        setNextCursor(result.nextCursor)
        setHasMore(result.hasMore)
      })
      .catch((requestError) => {
        if (abortController.signal.aborted || requestId !== requestIdRef.current) return
        setEntries([])
        setNextCursor(null)
        setHasMore(false)
        setError(getApiClientErrorMessage(requestError, 'Your credit history could not be loaded.'))
      })
      .finally(() => {
        if (!abortController.signal.aborted && requestId === requestIdRef.current) {
          setIsLoading(false)
        }
      })

    return () => abortController.abort()
  }, [appliedFilters, buildParams, refreshKey, reloadNonce])

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const from = toRfc3339(draftFilters.from)
    const to = toRfc3339(draftFilters.to)

    if (draftFilters.from && !from) {
      setFilterError('Enter a valid start date and time.')
      return
    }

    if (draftFilters.to && !to) {
      setFilterError('Enter a valid end date and time.')
      return
    }

    if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
      setFilterError('The start date must be before the end date.')
      return
    }

    setFilterError(null)
    setAppliedFilters({ ...draftFilters, eventType: draftFilters.eventType.trim() })
  }

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setFilterError(null)
    setAppliedFilters(DEFAULT_FILTERS)
  }

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return

    const requestId = ++requestIdRef.current
    setIsLoadingMore(true)
    setError(null)

    try {
      const result = await fetchCreditHistory(buildParams(appliedFilters, nextCursor))
      if (requestId !== requestIdRef.current) return

      setEntries((currentEntries) => {
        const existingIds = new Set(currentEntries.map((entry) => entry.id))
        return [...currentEntries, ...result.entries.filter((entry) => !existingIds.has(entry.id))]
      })
      setNextCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return
      setError(getApiClientErrorMessage(requestError, 'More credit history could not be loaded.'))
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingMore(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby="credit-history-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl bg-secondary p-2.5 text-foreground">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h4 id="credit-history-title" className="font-semibold text-foreground">Credit history</h4>
            <p className="text-sm text-muted-foreground">Review credits added to and used from your balance.</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isLoading || isLoadingMore}
          onClick={() => setReloadNonce((value) => value + 1)}
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <form className="border-b border-border bg-secondary/20 p-4 sm:p-5" onSubmit={applyFilters}>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="credit-history-event-type">Event type</Label>
            <Input
              id="credit-history-event-type"
              list="credit-history-event-types"
              placeholder="All events"
              value={draftFilters.eventType}
              onChange={(event) => setDraftFilters((current) => ({ ...current, eventType: event.target.value }))}
            />
            <datalist id="credit-history-event-types">
              {eventTypeSuggestions.map((eventType) => <option key={eventType} value={eventType} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="credit-history-from">From</Label>
            <Input
              id="credit-history-from"
              type="datetime-local"
              value={draftFilters.from}
              onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="credit-history-to">To</Label>
            <Input
              id="credit-history-to"
              type="datetime-local"
              value={draftFilters.to}
              onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Results</Label>
            <Select
              value={String(draftFilters.limit)}
              onValueChange={(value) => setDraftFilters((current) => ({ ...current, limit: Number(value) }))}
            >
              <SelectTrigger className="w-full" aria-label="Results per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((limit) => (
                  <SelectItem key={limit} value={String(limit)}>{limit} per page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {filterError ? <p className="mt-3 text-sm text-destructive">{filterError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={isLoading}>Apply filters</Button>
          <Button type="button" size="sm" variant="ghost" disabled={isLoading} onClick={clearFilters}>Clear</Button>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-3 p-4 sm:p-5" aria-label="Loading credit history">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : error && entries.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="font-medium text-foreground">Credit history is unavailable</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => setReloadNonce((value) => value + 1)}>
            Try again
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Coins className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 font-medium text-foreground">No credit activity found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try clearing the filters or check back after using credits.</p>
        </div>
      ) : (
        <div>
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <article key={entry.id} className="px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground">
                      {formatLabel(entry.eventType)}
                    </span>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold ${getAmountTone(entry.amount)}`}>
                    {entry.amount === null ? 'N/A' : `${entry.amount > 0 ? '+' : ''}${formatNumber(entry.amount)}`}
                    {entry.amount !== null ? <span className="ml-1 text-xs font-medium">credits</span> : null}
                  </span>
                </div>

                {(entry.taskType || entry.modelName || entry.provider || entry.rawProviderTokens !== null || entry.balanceAfter !== null) ? (
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-secondary/35 p-3 sm:grid-cols-3">
                    {entry.taskType ? <EntryDetail label="Task" value={formatLabel(entry.taskType)} /> : null}
                    {entry.modelName ? <EntryDetail label="Model" value={entry.modelName} /> : null}
                    {entry.provider ? <EntryDetail label="Provider" value={formatLabel(entry.provider)} /> : null}
                    {entry.rawProviderTokens !== null ? <EntryDetail label="Provider tokens" value={formatNumber(entry.rawProviderTokens)} /> : null}
                    {entry.multiplier !== null ? <EntryDetail label="Multiplier" value={`${formatNumber(entry.multiplier)}×`} /> : null}
                    {entry.balanceAfter !== null ? <EntryDetail label="Balance after" value={formatNumber(entry.balanceAfter)} /> : null}
                  </dl>
                ) : null}

                {entry.note ? <p className="mt-3 break-words text-sm leading-5 text-muted-foreground">{entry.note}</p> : null}
              </article>
            ))}
          </div>

          {error ? <p className="border-t border-border px-5 py-3 text-center text-xs text-destructive">{error}</p> : null}
          {hasMore && nextCursor ? (
            <div className="border-t border-border p-4 text-center">
              <Button variant="outline" size="sm" disabled={isLoadingMore} onClick={() => void loadMore()}>
                {isLoadingMore ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Load more
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
