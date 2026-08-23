'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Info } from 'lucide-react'
import { ProductImage } from '@/components/product-image'
import { PageHeading } from '@/components/page-shell'
import { Eyebrow, Reveal } from '@/components/reveal'
import { formatMoney, shop, simulateShop, type ShopResult } from '@/lib/sentinel-api'

const SAMPLES = [
  'white running shoes under 7000, size 9',
  'beige linen shirt in large',
  'merino wool overcoat',
]

const STEPS = ['Parsing intent', 'Resolving attributes', 'Matching catalog', 'Creating order']

function LoadingSequence() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 900)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="grid gap-px border border-border md:grid-cols-[1fr_1.15fr]">
      <div className="shimmer aspect-square bg-card md:aspect-auto md:min-h-[380px]" />
      <div className="flex flex-col justify-center gap-5 bg-card p-8">
        <Eyebrow>Buyer agent working</Eyebrow>
        <ul className="grid gap-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span
                className={`size-1.5 rounded-full transition-colors duration-300 ${
                  i === step ? 'bg-primary' : i < step ? 'bg-primary/40' : 'bg-border'
                }`}
              />
              <span
                className={`text-sm transition-colors duration-300 ${
                  i === step ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>
        <div className="h-px w-full bg-border" />
        <div className="shimmer h-3 w-2/3 bg-secondary" />
        <div className="shimmer h-3 w-1/3 bg-secondary" />
      </div>
    </div>
  )
}

function SuccessCard({ result }: { result: Extract<ShopResult, { ok: true }> }) {
  const { product, orderId, amount, currency } = result

  return (
    <div className="grid gap-px border border-border bg-border md:grid-cols-[1fr_1.15fr]">
      <ProductImage
        product={product}
        priority
        sizes="(min-width: 768px) 45vw, 100vw"
        className="aspect-square w-full md:aspect-auto md:h-full md:min-h-[420px]"
      />

      <div className="flex flex-col bg-card p-8 md:p-10">
        <div className="flex items-center gap-2.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary">
            <Check className="size-3 text-primary-foreground" strokeWidth={3} />
          </span>
          <Eyebrow className="text-primary">Order confirmed</Eyebrow>
        </div>

        <h2 className="mt-6 font-display text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">
          {product.name}
        </h2>
        {product.description && (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-px bg-border">
          {[
            { label: 'Price', value: formatMoney(amount ?? product.price, currency) },
            { label: 'Size', value: product.size ?? '—' },
            { label: 'Colour', value: product.color ?? '—' },
            { label: 'Category', value: product.category },
          ].map((cell) => (
            <div key={cell.label} className="bg-card py-4 pr-4">
              <span className="eyebrow font-mono text-muted-foreground/70">{cell.label}</span>
              <p className="mt-2 text-sm capitalize">{cell.value}</p>
            </div>
          ))}
        </div>

        <dl className="mt-8 grid gap-2 border-t border-border pt-6 font-mono text-xs">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground/70">product_id</dt>
            <dd className="truncate">{product.id}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground/70">razorpay_order_id</dt>
            <dd className="truncate text-primary">{orderId ?? 'pending'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function FailureCard({ result }: { result: Extract<ShopResult, { ok: false }> }) {
  const entries = Object.entries(result.filters).filter(([, v]) => v !== null && v !== undefined)

  return (
    <div className="border border-border bg-card">
      <div className="grid gap-8 p-8 md:grid-cols-[1.2fr_1fr] md:p-10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-full border border-primary/50">
              <Info className="size-3 text-primary" />
            </span>
            <Eyebrow className="text-primary">No match — logged for healing</Eyebrow>
          </div>
          <p className="mt-6 max-w-xl font-display text-xl leading-[1.35] tracking-[-0.01em] text-pretty">
            {result.message}
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Sentinel treats this as a data defect rather than a dead end. The query is written to the
            failure log with its parsed filters, and the healer will attempt to make the catalog
            answerable before the next agent arrives.
          </p>
        </div>

        <div className="border-l border-border pl-8">
          <span className="eyebrow font-mono text-muted-foreground/70">Parsed filters</span>
          <ul className="mt-4 grid gap-2 font-mono text-xs">
            {entries.length === 0 && <li className="text-muted-foreground">no filters returned</li>}
            {entries.map(([key, value]) => (
              <li
                key={key}
                className="flex items-baseline justify-between gap-4 border-b border-border pb-2"
              >
                <span className="text-muted-foreground/70">{key}</span>
                <span className="truncate">{String(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function AgentConsole() {
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<ShopResult | null>(null)
  const [sample, setSample] = useState(false)
  const [runId, setRunId] = useState(0)
  const resultRef = useRef<HTMLDivElement>(null)

  async function run(nextQuery: string) {
    const trimmed = nextQuery.trim()
    if (!trimmed || pending) return
    setPending(true)
    setResult(null)
    try {
      const res = await shop(trimmed)
      setSample(false)
      setResult(res)
    } catch {
      setSample(true)
      setResult(simulateShop(trimmed))
    } finally {
      setRunId((n) => n + 1)
      setPending(false)
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      )
    }
  }

  return (
    <>
      <PageHeading track="01" label="Buyer agent" title="Shop the catalog in plain language.">
        The request is parsed into structured filters, matched against the live catalog, and turned
        into a Razorpay order — or logged as a failure for the healer.
      </PageHeading>

      <Reveal delay={120} className="mt-14 max-w-3xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(query)
          }}
        >
          <label htmlFor="agent-query" className="eyebrow font-mono text-muted-foreground/70">
            Ask the buyer agent to shop for you
          </label>
          <div className="mt-4 flex items-center gap-4 border-b border-input pb-4 transition-colors duration-300 focus-within:border-primary">
            <input
              id="agent-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  run(query)
                }
              }}
              placeholder="white running shoes under 7000, size 9"
              autoComplete="off"
              className="w-full bg-transparent font-display text-lg tracking-[-0.01em] outline-none placeholder:text-muted-foreground/50 md:text-xl"
            />
            <button
              type="submit"
              disabled={pending || !query.trim()}
              className="flex shrink-0 items-center gap-2 bg-primary px-4 py-2.5 text-primary-foreground transition-all duration-300 hover:gap-3 disabled:pointer-events-none disabled:opacity-35"
            >
              <span className="eyebrow font-mono font-semibold">
                {pending ? 'Working' : 'Shop'}
              </span>
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="eyebrow font-mono text-muted-foreground/60">Try</span>
          {SAMPLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s)
                run(s)
              }}
              className="border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:border-primary/50 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </Reveal>

      <div ref={resultRef} className="mt-16 min-h-4 scroll-mt-28">
        {pending && <LoadingSequence />}
        {!pending && result && (
          <div key={runId}>
            {sample && (
              <p className="eyebrow mb-4 font-mono text-muted-foreground/60">
                Simulated locally — backend offline
              </p>
            )}
            {result.ok ? <SuccessCard result={result} /> : <FailureCard result={result} />}
          </div>
        )}
      </div>
    </>
  )
}
