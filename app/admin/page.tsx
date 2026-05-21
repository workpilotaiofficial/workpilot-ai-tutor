'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'


export default function AdminPortalPage() {
  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    const storedAuth = JSON.parse(localStorage.getItem('ai_tutora_auth_session') || 'null')
    setToken(storedAuth?.access_token ?? null)
  }, [])


  return (
    <section className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(91,101,224,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(159,203,152,0.2),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(248,248,252,1)_100%)] p-4 md:p-6">
                <div className="flex flex-wrap gap-3">
                  {token ? (
                    <Button asChild variant="outline" className="rounded-full border-dashed px-5">
                      <a
                        href={`https://tutor-ai.up.railway.app/api/v1/docs/login?token=${token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open API docs
                      </a>
                    </Button>
                  ) : null}
                </div>
    </section>
  )
}
