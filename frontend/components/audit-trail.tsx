'use client'

import { Eyebrow, Reveal } from '@/components/reveal'
import { formatStamp, useAudit } from '@/lib/sentinel-api'

export function AuditTrail() {
  const { data, live } = useAudit()

  return (
    <section id="audit" className="grain relative border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.6fr] lg:gap-24">
          <Reveal>
            <Eyebrow>
              Track 05 <span className="text-border">/</span> Audit trail
            </Eyebrow>
            <h2 className="mt-7 max-w-sm font-display text-[2.1rem] leading-[1.06] font-semibold tracking-[-0.03em] text-balance md:text-[2.6rem]">
              Every decision, with its reasoning.
            </h2>
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
              Agent commerce only works if merchants can inspect it. Sentinel records the parse, the
              match attempt, the heal and the order as a single chronological record.
            </p>
            {!live && (
              <p className="eyebrow mt-8 font-mono text-muted-foreground/50">
                Sample data — /audit unreachable
              </p>
            )}
          </Reveal>

          <Reveal delay={120}>
            <ol className="relative border-l border-border pl-8 md:pl-10">
              {data.map((entry, i) => (
                <li key={entry.id} className="group relative pb-10 last:pb-0">
                  <span className="absolute -left-[calc(2rem+1px)] top-1.5 flex size-2 -translate-x-1/2 items-center justify-center md:-left-[calc(2.5rem+1px)]">
                    <span className="size-2 rounded-full border border-primary/50 bg-background transition-colors duration-300 group-hover:bg-primary" />
                  </span>

                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-mono text-xs text-muted-foreground/70 tabular-nums">
                      {formatStamp(entry.timestamp)}
                    </span>
                    <span className="font-mono text-xs text-primary">{entry.action}</span>
                    {entry.actor && (
                      <span className="eyebrow font-mono text-muted-foreground/50">
                        {entry.actor}
                      </span>
                    )}
                  </div>

                  {entry.reasoning && (
                    <p className="mt-3 max-w-xl text-[0.9rem] leading-relaxed text-muted-foreground">
                      {entry.reasoning}
                    </p>
                  )}

                  {entry.refs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.refs.map((ref) => (
                        <span
                          key={ref}
                          className="border border-border px-2 py-1 font-mono text-[0.68rem] text-muted-foreground"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  )}

                  {i === 0 && (
                    <span className="eyebrow absolute right-0 top-0 hidden font-mono text-muted-foreground/40 lg:block">
                      Latest
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
