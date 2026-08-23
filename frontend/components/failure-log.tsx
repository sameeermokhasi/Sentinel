'use client'

import { useState } from 'react'
import { Eyebrow, Reveal } from '@/components/reveal'
import { formatStamp, useFailures, type FailureStatus } from '@/lib/sentinel-api'

const STATUS: Record<FailureStatus, { label: string; className: string }> = {
  resolved: { label: 'Resolved', className: 'text-success border-success/35 bg-success/8' },
  no_match_unfixable: {
    label: 'Unfixable',
    className: 'text-destructive border-destructive/35 bg-destructive/8',
  },
  unresolved: { label: 'Unresolved', className: 'text-primary border-primary/40 bg-primary/8' },
}

const FILTERS: (FailureStatus | 'all')[] = ['all', 'resolved', 'unresolved', 'no_match_unfixable']

export function FailureLog() {
  const { data, live } = useFailures()
  const [filter, setFilter] = useState<FailureStatus | 'all'>('all')

  const rows = filter === 'all' ? data : data.filter((f) => f.status === filter)

  return (
    <section id="failures" className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Eyebrow>
              Track 04 <span className="text-border">/</span> Failure log
            </Eyebrow>
            <h2 className="mt-7 max-w-lg font-display text-[2.1rem] leading-[1.06] font-semibold tracking-[-0.03em] text-balance md:text-[2.6rem]">
              What the catalog could not answer.
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`eyebrow border px-3 py-2 font-mono transition-colors duration-200 ${
                  filter === key
                    ? 'border-primary/60 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {key === 'all' ? 'All' : STATUS[key].label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100} className="mt-14 border-t border-border">
          <div className="hidden grid-cols-[auto_1fr_2fr_auto] gap-8 border-b border-border py-4 md:grid">
            {['Ref', 'Query', 'Diagnosis', 'Status'].map((h) => (
              <span key={h} className="eyebrow font-mono text-muted-foreground/60">
                {h}
              </span>
            ))}
          </div>

          <ul>
            {rows.map((row) => (
              <li
                key={row.id}
                className="group grid gap-3 border-b border-border py-6 transition-colors duration-200 hover:bg-card md:grid-cols-[auto_1fr_2fr_auto] md:items-start md:gap-8"
              >
                <div className="font-mono text-xs text-muted-foreground/70">
                  <p className="text-primary/80">{row.id}</p>
                  <p className="mt-1">{formatStamp(row.timestamp)}</p>
                </div>
                <p className="font-display text-sm leading-snug tracking-[-0.01em]">
                  “{row.query}”
                </p>
                <p className="max-w-xl text-[0.8rem] leading-relaxed text-muted-foreground">
                  {row.reason ?? '—'}
                </p>
                <span
                  className={`eyebrow inline-flex w-fit items-center gap-2 border px-2.5 py-1 font-mono ${STATUS[row.status].className}`}
                >
                  {STATUS[row.status].label}
                </span>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="py-10 text-sm text-muted-foreground">
                No entries with this status.
              </li>
            )}
          </ul>
        </Reveal>

        {!live && (
          <p className="eyebrow mt-6 font-mono text-muted-foreground/50">
            Sample data — /failures unreachable
          </p>
        )}
      </div>
    </section>
  )
}
