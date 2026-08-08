'use client'

import Link from 'next/link'
import { Folder, LogOut, Menu, Search, Settings as SettingsIcon, type LucideIcon, X } from 'lucide-react'
import Image from 'next/image'

export type PortalNavItem = {
  label: string
  href: string
  icon: LucideIcon
  isActive?: boolean
}

type PortalShellProps = {
  children: React.ReactNode
  brandHref: string
  brandLabel: string
  navItems: PortalNavItem[]
  sidebarOpen: boolean
  onSidebarToggle: () => void
  onLogout: () => void
  isLoggingOut?: boolean
  showHeader?: boolean
  onOpenSettings?: () => void
  onOpenBilling?: () => void
  footerPrimaryActionLabel?: string
  footerProfileName?: string
  footerProfileInitial?: string
  footerProfileSubtitle?: string
}

export function PortalShell({
  children,
  brandHref,
  brandLabel,
  navItems,
  sidebarOpen,
  onSidebarToggle,
  onLogout,
  isLoggingOut = false,
  showHeader = true,
  onOpenSettings,
  onOpenBilling,
  footerPrimaryActionLabel = 'Upgrade to Unlimited',
  footerProfileName = 'Muntasir',
  footerProfileInitial = 'M',
  footerProfileSubtitle,
}: PortalShellProps) {
  const closeMobileSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && sidebarOpen) {
      onSidebarToggle()
    }
  }

  return (
    <div className="flex h-dvh min-w-0 overflow-hidden bg-background">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onSidebarToggle}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}
      <aside
        className={`${
          sidebarOpen
            ? 'translate-x-0 lg:w-[300px]'
            : '-translate-x-full lg:w-0 lg:translate-x-0 lg:border-r-0'
        } fixed inset-y-0 left-0 z-50 flex w-[min(300px,calc(100vw-3rem))] shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar shadow-2xl transition-[transform,width] duration-300 lg:relative lg:z-auto lg:shadow-none`}
        aria-label="Portal navigation"
      >
        <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-sidebar-border px-4 sm:px-6">
          <Link href={brandHref} onClick={closeMobileSidebar} className="flex min-w-0 items-center gap-2">
            <Image src="/logo.png" width={200} height={40} alt={brandLabel} className="h-auto w-full max-w-[200px]" />
          </Link>
          <button
            type="button"
            onClick={onSidebarToggle}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-sidebar-accent lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-auto">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={closeMobileSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  item.isActive
                    ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}

          {onOpenSettings ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          ) : null}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          {onOpenBilling ? (
            <button
              type="button"
              onClick={onOpenBilling}
              className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {footerPrimaryActionLabel}
            </button>
          ) : null}
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
              {footerProfileInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{footerProfileName}</p>
              {footerProfileSubtitle ? (
                <p className=" text-[11px] text-sidebar-foreground/70 truncate">{footerProfileSubtitle}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border px-4 py-2.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {showHeader ? (
          <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-border bg-background px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onSidebarToggle}
                className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-secondary"
                aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center gap-1 sm:gap-4">
              <button type="button" className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-secondary" aria-label="Search">
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <Folder className="w-4 h-4" />
                <span className="hidden sm:inline">Folders</span>
              </button>
            </div>
          </header>
        ) : null}

        <main className="min-w-0 flex-1 overflow-auto overscroll-contain bg-background">{children}</main>
      </div>
    </div>
  )
}
