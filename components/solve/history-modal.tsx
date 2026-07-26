'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatUTCDate } from '@/lib/utils'
import { getApiClientErrorMessage } from '@/lib/api/client'
import { fetchSolveSessionHistory, type SolveSessionSummary } from '@/lib/api/solve.service'

interface SolveHistoryModalProps {
  open: boolean
  onClose: () => void
  onSelect: (sessionId: string) => void
}

export default function SolveHistoryModal({ open, onClose, onSelect }: SolveHistoryModalProps) {
  const [items, setItems] = useState<SolveSessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    const abortController = new AbortController()
    setIsLoading(true)
    setError('')

    fetchSolveSessionHistory(abortController.signal)
      .then((response) => {
        if (abortController.signal.aborted) return
        setItems(response.data)
      })
      .catch((err) => {
        if (abortController.signal.aborted) return
        setError(getApiClientErrorMessage(err, 'Failed to load your past questions.'))
      })
      .finally(() => {
        if (!abortController.signal.aborted) setIsLoading(false)
      })

    return () => abortController.abort()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Past questions</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No questions solved yet.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    {item.last_message_preview ? (
                      <p className="truncate text-xs text-muted-foreground">{item.last_message_preview}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatUTCDate(item.updated_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
