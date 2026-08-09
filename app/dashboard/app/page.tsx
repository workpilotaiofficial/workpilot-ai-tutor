'use client'

import { IconBrandChrome, IconBrandFirefox } from '@tabler/icons-react'
import {
  ArrowUpRight,
  Check,
  Puzzle,
  ScanLine,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const chromeExtensionUrl = process.env.NEXT_PUBLIC_CHROME_EXTENSION_URL?.trim()
const firefoxExtensionUrl = process.env.NEXT_PUBLIC_FIREFOX_EXTENSION_URL?.trim()
const mobileAppUrl =
  process.env.NEXT_PUBLIC_MOBILE_APP_URL?.trim() || 'https://goneurova.com'

type BrowserCardProps = {
  name: string
  store: string
  href?: string
  icon: typeof IconBrandChrome
  iconClassName: string
  iconBackground: string
}

function BrowserCard({
  name,
  store,
  href,
  icon: Icon,
  iconClassName,
  iconBackground,
}: BrowserCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBackground}`}
      >
        <Icon className={`h-7 w-7 ${iconClassName}`} stroke={1.8} />
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-foreground">{name}</h2>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{store}</p>
      </div>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Add Neurova to ${name}`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="hidden sm:inline">Add to {name}</span>
          <span className="sm:hidden">Install</span>
          <ArrowUpRight className="h-4 w-4" />
        </a>
      ) : (
        <button
          type="button"
          disabled
          title={`${name} store URL has not been configured yet`}
          className="min-h-10 shrink-0 cursor-not-allowed rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-muted-foreground"
        >
          Coming soon
        </button>
      )}
    </article>
  )
}

export default function AppsAndExtensionsPage() {
  return (
    <div className="min-h-full bg-[#fbfbfd] text-foreground dark:bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-7 sm:py-10 lg:px-9">
        <header>
     
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            Apps &amp; Extensions
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Use Neurova from your browser or continue learning on mobile.
          </p>
        </header>

        <main className="mt-8 space-y-8">
          <section aria-labelledby="browser-extensions-title">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id="browser-extensions-title" className="text-base font-semibold">
                  Browser extensions
                </h2>
                
              </div>
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Safe &amp; secure
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <BrowserCard
                name="Google Chrome"
                store="Chrome Web Store"
                href={chromeExtensionUrl}
                icon={IconBrandChrome}
                iconClassName="text-blue-600"
                iconBackground="bg-blue-500/10"
              />
              <BrowserCard
                name="Mozilla Firefox"
                store="Firefox Add-ons"
                href={firefoxExtensionUrl}
                icon={IconBrandFirefox}
                iconClassName="text-orange-600"
                iconBackground="bg-orange-500/10"
              />
            </div>

       
          </section>

          <div className="h-px bg-border" />

          <section
            aria-labelledby="mobile-app-title"
            className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:p-6"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-6 w-6" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 id="mobile-app-title" className="font-semibold">
                Neurova mobile app
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Scan the code to continue learning from your phone.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <ScanLine className="hidden h-5 w-5 text-muted-foreground sm:block" />
              <a
                href={mobileAppUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open Neurova mobile app"
                className="rounded-xl border border-border bg-white p-1.5 shadow-sm transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white"
              >
                <QRCodeSVG
                  value={mobileAppUrl}
                  level="H"
                  marginSize={1}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  className="h-16 w-16"
                  imageSettings={{
                    src: '/logo-icon.png',
                    height: 14,
                    width: 14,
                    excavate: true,
                  }}
                />
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
