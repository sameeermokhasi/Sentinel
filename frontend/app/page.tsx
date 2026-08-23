import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { LiveSignals } from '@/components/live-signals'
import { TRACKS } from '@/components/page-shell'
import { Eyebrow, Reveal } from '@/components/reveal'

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-5 pt-24 pb-20 md:px-10 md:pt-32 md:pb-28">
          <div className="grid gap-16 lg:grid-cols-[1.55fr_1fr] lg:gap-24">
            <div>
              <Reveal>
                <Eyebrow>Agent-readable commerce</Eyebrow>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="mt-7 max-w-3xl font-display text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-[3.4rem] lg:text-[4.1rem]">
                  A catalog that teaches itself to be shopped by AI.
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="mt-7 max-w-xl text-[0.975rem] leading-relaxed text-muted-foreground">
                  Sentinel sits between buyer agents and your commerce data. Every failed query is
                  captured, diagnosed and repaired at the attribute level — so the catalog becomes
                  more answerable with each attempt, not less.
                </p>
              </Reveal>

              <Reveal delay={240} className="mt-12 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="flex items-center gap-2 bg-primary px-5 py-3 text-primary-foreground transition-all duration-300 hover:gap-3"
                >
                  <span className="eyebrow font-mono font-semibold">Open the buyer agent</span>
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </Link>
                <Link
                  href="/catalog"
                  className="flex items-center gap-2 border border-border px-5 py-3 transition-colors duration-300 hover:border-primary/50"
                >
                  <span className="eyebrow font-mono">Browse the catalog</span>
                </Link>
              </Reveal>
            </div>

            <Reveal delay={200} className="lg:pt-2">
              <LiveSignals />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-24">
          <Eyebrow>The five tracks</Eyebrow>
          <ul className="mt-10 grid border-t border-l border-border md:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((track, i) => (
              <Reveal
                as="li"
                key={track.href}
                delay={(i % 3) * 70}
                className="border-r border-b border-border"
              >
                <Link
                  href={track.href}
                  className="group flex h-full flex-col justify-between gap-10 p-8 transition-colors duration-300 hover:bg-card"
                >
                  <div className="flex items-baseline justify-between gap-6">
                    <span className="font-mono text-xs text-primary">{track.track}</span>
                    <span className="eyebrow font-mono text-muted-foreground/60">
                      {track.label}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-display text-xl leading-snug font-medium tracking-[-0.015em] text-pretty">
                      {track.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {track.blurb}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-primary transition-all duration-300 group-hover:gap-3">
                      <span className="eyebrow font-mono">Open</span>
                      <ArrowRight className="size-3.5" strokeWidth={2.5} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
