import Link from 'next/link'
import { TRACKS } from '@/components/page-shell'

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-5 py-14 md:flex-row md:items-start md:justify-between md:px-10">
        <div>
          <p className="font-display text-sm font-semibold tracking-[-0.01em]">Sentinel</p>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
            A self-healing commerce catalog for AI buyer agents. Built on a FastAPI service exposing
            /shop, /heal, /catalog, /failures and /audit.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-10 gap-y-3">
          {TRACKS.map((track) => (
            <Link
              key={track.href}
              href={track.href}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="font-mono text-muted-foreground/50">{track.track}</span>{' '}
              {track.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
