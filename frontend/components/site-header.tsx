'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { API_BASE, useCatalog } from '@/lib/sentinel-api'

const NAV = [
  { href: '/shop', label: 'Buyer agent' },
  { href: '/healer', label: 'Healer' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/failures', label: 'Failures' },
  { href: '/audit', label: 'Audit' },
]

export function SiteHeader() {
  const { live, isLoading } = useCatalog()
  const pathname = usePathname()

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-5 md:px-10">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="relative flex size-3 items-center justify-center">
            <span className="absolute inset-0 border border-primary/60 transition-transform duration-500 group-hover:rotate-45" />
            <span className="size-1 bg-primary" />
          </span>
          <span className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
            Sentinel
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3 py-1.5 text-[0.8rem] transition-colors duration-200 ${
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-primary" aria-hidden />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span
            className="eyebrow hidden font-mono text-muted-foreground/70 lg:inline"
            title={API_BASE}
          >
            {API_BASE.replace(/^https?:\/\//, '')}
          </span>
          <span className="flex items-center gap-2 border border-border px-2.5 py-1">
            <span
              className={`pulse-dot size-1.5 rounded-full ${
                isLoading ? 'bg-primary' : live ? 'bg-success' : 'bg-destructive'
              }`}
            />
            <span className="eyebrow font-mono">
              {isLoading ? 'Probing' : live ? 'Live' : 'Sample'}
            </span>
          </span>
        </div>
      </div>

      {/* mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-5 py-2 md:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 border px-2.5 py-1 text-xs transition-colors ${
                active
                  ? 'border-primary/50 text-foreground'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
