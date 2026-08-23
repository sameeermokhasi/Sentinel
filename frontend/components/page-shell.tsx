import { Eyebrow, Reveal } from '@/components/reveal'

export const TRACKS = [
  {
    href: '/shop',
    track: '01',
    label: 'Buyer agent',
    title: 'Shop the catalog in plain language.',
    blurb: 'Post a natural-language request to /shop and watch the agent parse, match and order.',
  },
  {
    href: '/healer',
    track: '02',
    label: 'Healer',
    title: 'Repair the data, not the query.',
    blurb: 'Run /heal to rewrite missing attributes and synonyms behind every failed request.',
  },
  {
    href: '/catalog',
    track: '03',
    label: 'Catalog',
    title: 'Every entry, as an agent sees it.',
    blurb: 'Live product records from /catalog with review flags on incomplete attributes.',
  },
  {
    href: '/failures',
    track: '04',
    label: 'Failures',
    title: 'The queries this catalog could not answer.',
    blurb: 'Each miss from /failures kept with its parsed filters and resolution state.',
  },
  {
    href: '/audit',
    track: '05',
    label: 'Audit',
    title: 'Why the agent did what it did.',
    blurb: 'A timestamped trail of decisions and reasoning from /audit.',
  },
] as const

export function PageHeading({
  track,
  label,
  title,
  children,
}: {
  track: string
  label: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-x-16 gap-y-8">
      <div>
        <Eyebrow>
          Track {track} <span className="text-border">/</span> {label}
        </Eyebrow>
        <h1 className="mt-7 max-w-2xl font-display text-[2.3rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance md:text-[3.1rem]">
          {title}
        </h1>
      </div>
      {children && (
        <div className="max-w-xs text-sm leading-relaxed text-muted-foreground">{children}</div>
      )}
    </Reveal>
  )
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-32 pb-24 md:px-10 md:pt-40 md:pb-32">
      {children}
    </div>
  )
}
