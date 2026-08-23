'use client'

import { useAudit, useCatalog, useFailures } from '@/lib/sentinel-api'

export function LiveSignals() {
  const catalog = useCatalog()
  const failures = useFailures()
  const audit = useAudit()

  const unresolved = failures.data.filter((f) => f.status === 'unresolved').length
  const flagged = catalog.data.filter((p) => p.needsReview).length

  const stats = [
    { label: 'Catalog entries', value: catalog.data.length, note: 'indexed for agents' },
    { label: 'Flagged for review', value: flagged, note: 'incomplete attributes' },
    { label: 'Unresolved failures', value: unresolved, note: 'awaiting the healer' },
    { label: 'Audit records', value: audit.data.length, note: 'agent decisions logged' },
  ]

  return (
    <div className="border-t border-border">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-baseline justify-between gap-6 border-b border-border py-5"
        >
          <div>
            <p className="text-sm">{stat.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
          </div>
          <p className="font-display text-3xl font-semibold tracking-[-0.03em] tabular-nums">
            {String(stat.value).padStart(2, '0')}
          </p>
        </div>
      ))}
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        {catalog.live
          ? 'Reading live data from the FastAPI service.'
          : 'FastAPI service unreachable — showing representative sample data. Start the backend on port 8000 to go live.'}
      </p>
    </div>
  )
}
