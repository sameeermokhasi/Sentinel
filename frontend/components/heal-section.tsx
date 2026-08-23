'use client'

import { useEffect, useRef, useState } from 'react'
import { Activity } from 'lucide-react'
import { Eyebrow, Reveal } from '@/components/reveal'
import {
  heal,
  simulateHeal,
  useAudit,
  useCatalog,
  useFailures,
  type HealSummary,
} from '@/lib/sentinel-api'

function useCountUp(target: number, run: boolean, duration = 900) {
  const [value, setValue] = useState(target)
  const from = useRef(target)

  useEffect(() => {
    if (!run) return
    const start = performance.now()
    const origin = from.current
    let frame = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(origin + (target - origin) * eased))
      if (p < 1) frame = requestAnimationFrame(tick)
      else from.current = target
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, run, duration])

  return value
}

function Counter({ label, value, animate }: { label: string; value: number; animate: boolean }) {
  const display = useCountUp(value, animate)
  return (
    <div>
      <span className="eyebrow font-mono text-muted-foreground/70">{label}</span>
      <p className="mt-3 font-display text-5xl font-semibold tracking-[-0.04em] tabular-nums">
        {String(display).padStart(2, '0')}
      </p>
    </div>
  )
}

export function HealSection() {
  const [pending, setPending] = useState(false)
  const [summary, setSummary] = useState<HealSummary | null>(null)
  const [sample, setSample] = useState(false)

  const catalog = useCatalog()
  const failures = useFailures()
  const audit = useAudit()

  const unresolvedNow = failures.data.filter((f) => f.status === 'unresolved').length

  async function run() {
    if (pending) return
    setPending(true)
    try {
      const res = await heal()
      setSample(false)
      setSummary(res)
    } catch {
      setSample(true)
      setSummary(simulateHeal())
    } finally {
      setPending(false)
      void catalog.refresh()
      void failures.refresh()
      void audit.refresh()
    }
  }

  const before = summary?.unresolvedBefore ?? unresolvedNow
  const after = summary?.unresolvedAfter ?? unresolvedNow

  return (
    <section id="heal" className="relative border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
          <Reveal>
            <Eyebrow>
              Track 02 <span className="text-border">/</span> Self-healing
            </Eyebrow>
            <h2 className="mt-7 max-w-md font-display text-[2.1rem] leading-[1.06] font-semibold tracking-[-0.03em] text-balance md:text-[2.6rem]">
              Heal the catalog.
            </h2>
            <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
              The healer reads the failure log, infers the missing or mis-stated attributes, and
              rewrites catalog records so the same query resolves next time. Every write is recorded
              in the audit trail with its reasoning.
            </p>

            <button
              type="button"
              onClick={run}
              disabled={pending}
              className="group mt-10 inline-flex items-center gap-4 border border-primary/40 bg-transparent px-6 py-4 transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              <Activity
                className={`size-4 text-primary transition-colors group-hover:text-primary-foreground ${pending ? 'animate-pulse' : ''}`}
                strokeWidth={2}
              />
              <span className="eyebrow font-mono font-semibold">
                {pending ? 'Healing in progress' : 'Run the healer'}
              </span>
            </button>
            {sample && summary && (
              <p className="eyebrow mt-4 font-mono text-muted-foreground/60">
                Simulated locally — backend offline
              </p>
            )}
          </Reveal>

          <Reveal delay={120}>
            <div className="grain relative border border-border bg-card">
              <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                <div className="bg-card p-6">
                  <Counter label="Unresolved before" value={before} animate={Boolean(summary)} />
                </div>
                <div className="bg-card p-6">
                  <Counter
                    label="Unresolved after"
                    value={after}
                    animate={Boolean(summary)}
                  />
                </div>
                <div className="bg-card p-6">
                  <Counter
                    label="Records fixed"
                    value={summary?.fixed ?? 0}
                    animate={Boolean(summary)}
                  />
                </div>
                <div className="bg-card p-6">
                  <Counter
                    label="Entries scanned"
                    value={summary?.scanned ?? catalog.data.length}
                    animate={Boolean(summary)}
                  />
                </div>
              </div>

              <div className="border-t border-border p-6 md:p-8">
                <span className="eyebrow font-mono text-muted-foreground/70">
                  {summary ? 'Attribute diff' : 'Awaiting run'}
                </span>

                {!summary && (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Run the healer to see the exact catalog writes it proposes and applies.
                  </p>
                )}

                {summary && summary.changes.length === 0 && (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {summary.message ?? 'No catalog writes were required on this pass.'}
                  </p>
                )}

                <ul className="mt-5 grid gap-px bg-border">
                  {summary?.changes.map((change, i) => (
                    <li
                      key={`${change.id}-${change.field}`}
                      className="reveal bg-card py-4 font-mono text-xs"
                      data-shown="true"
                      style={{ transitionDelay: `${i * 60}ms` }}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-primary">{change.id}</span>
                        {change.product && (
                          <span className="font-sans text-[0.8rem] text-muted-foreground">
                            {change.product}
                          </span>
                        )}
                        <span className="text-muted-foreground/70">{change.field}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="bg-destructive/12 px-2 py-1 text-destructive line-through decoration-destructive/50">
                          {change.from}
                        </span>
                        <span className="text-muted-foreground/50">→</span>
                        <span className="bg-success/12 px-2 py-1 text-success">{change.to}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
