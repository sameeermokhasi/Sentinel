'use client'

import useSWR from 'swr'

export const API_BASE =
  process.env.NEXT_PUBLIC_SENTINEL_API?.replace(/\/$/, '') || 'http://localhost:8005'


/* ---------------------------------- types --------------------------------- */

export type Product = {
  id: string
  name: string
  price: number | null
  currency: string
  category: string
  size: string | null
  color: string | null
  needsReview: boolean
  description: string | null
  raw: Record<string, unknown>
}

export type ShopResult =
  | {
      ok: true
      product: Product
      orderId: string | null
      amount: number | null
      currency: string
      message: string | null
    }
  | {
      ok: false
      message: string
      filters: Record<string, unknown>
    }

export type FailureStatus = 'resolved' | 'no_match_unfixable' | 'unresolved'

export type FailureEntry = {
  id: string
  query: string
  status: FailureStatus
  reason: string | null
  timestamp: string | null
  filters: Record<string, unknown>
}

export type AuditEntry = {
  id: string
  timestamp: string | null
  action: string
  reasoning: string | null
  actor: string | null
  refs: string[]
}

export type HealSummary = {
  scanned: number
  fixed: number
  unresolvedBefore: number
  unresolvedAfter: number
  changes: { id: string; field: string; from: string; to: string; product?: string }[]
  message: string | null
}

/* -------------------------------- utilities ------------------------------- */

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null

const num = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Pull the first array found in a response body, whatever the wrapper key is. */
const asList = (body: unknown): Record<string, unknown>[] => {
  if (Array.isArray(body)) return body.map(asRecord)
  const rec = asRecord(body)
  for (const value of Object.values(rec)) {
    if (Array.isArray(value)) return value.map(asRecord)
  }
  return []
}

export function normalizeProduct(input: unknown, index = 0): Product {
  const r = asRecord(input)
  const price = num(r.price ?? r.amount ?? r.mrp ?? r.cost)
  return {
    id: str(r.id ?? r.product_id ?? r.sku ?? r.handle) ?? `product-${index + 1}`,
    name: str(r.name ?? r.title ?? r.product_name) ?? 'Untitled product',
    price: price === null ? null : price > 100000 ? price / 100 : price,
    currency: str(r.currency) ?? 'INR',
    category: (str(r.category ?? r.type ?? r.collection) ?? 'general').toLowerCase(),
    size: str(r.size ?? r.sizes ?? r.variant_size),
    color: str(r.color ?? r.colour ?? r.colors),
    needsReview: Boolean(
      r.needs_review ?? r.needsReview ?? r.flagged ?? r.review_required ?? false,
    ),
    description: str(r.description ?? r.summary ?? r.agent_description),
    raw: r,
  }
}

function normalizeFailure(input: unknown, index: number): FailureEntry {
  const r = asRecord(input)
  const rawStatus = (str(r.status ?? r.state ?? r.resolution) ?? 'unresolved').toLowerCase()
  const status: FailureStatus = rawStatus.includes('resolv')
    ? rawStatus.includes('un')
      ? 'unresolved'
      : 'resolved'
    : rawStatus.includes('unfix') || rawStatus.includes('no_match')
      ? 'no_match_unfixable'
      : 'unresolved'
  return {
    id: str(r.id ?? r.failure_id) ?? `failure-${index + 1}`,
    query: str(r.query ?? r.q ?? r.request) ?? '—',
    status,
    reason: str(r.reason ?? r.message ?? r.detail ?? r.note),
    timestamp: str(r.timestamp ?? r.created_at ?? r.time ?? r.at),
    filters: asRecord(r.filters ?? r.parsed_filters),
  }
}

function normalizeAudit(input: unknown, index: number): AuditEntry {
  const r = asRecord(input)
  const refs = [
    str(r.product_id),
    str(r.order_id),
    str(r.failure_id),
    str(asRecord(r.meta).product_id),
  ].filter((v): v is string => Boolean(v))
  return {
    id: str(r.id ?? r.audit_id) ?? `audit-${index + 1}`,
    timestamp: str(r.timestamp ?? r.created_at ?? r.time ?? r.at),
    action: str(r.action ?? r.event ?? r.decision ?? r.type) ?? 'agent.decision',
    reasoning: str(r.reasoning ?? r.reason ?? r.message ?? r.detail ?? r.note),
    actor: str(r.actor ?? r.agent ?? r.source),
    refs,
  }
}

/* ------------------------------ demo fallbacks ----------------------------- */

export const DEMO_CATALOG: Product[] = [
  {
    id: 'SKU-8841',
    name: 'Meridian Runner — Low Top',
    price: 6480,
    currency: 'INR',
    category: 'footwear',
    size: 'UK 9',
    color: 'Bone',
    needsReview: false,
    description: 'Knit upper trainer with a compression-moulded midsole.',
    raw: {},
  },
  {
    id: 'SKU-8842',
    name: 'Atlas Trail Boot',
    price: 11200,
    currency: 'INR',
    category: 'footwear',
    size: 'UK 10',
    color: 'Espresso',
    needsReview: true,
    description: 'Missing width attribute — flagged by the healer.',
    raw: {},
  },
  {
    id: 'SKU-8843',
    name: 'Weightless Oxford Shirt',
    price: 3950,
    currency: 'INR',
    category: 'apparel',
    size: 'M',
    color: 'Ivory',
    needsReview: false,
    description: 'Long staple cotton, unstructured collar.',
    raw: {},
  },
  {
    id: 'SKU-8844',
    name: 'Terrace Linen Overshirt',
    price: 5400,
    currency: 'INR',
    category: 'apparel',
    size: 'L',
    color: 'Sand',
    needsReview: true,
    description: 'Colour synonym set incomplete for agent queries.',
    raw: {},
  },
  {
    id: 'SKU-8845',
    name: 'Field Canvas Weekender',
    price: 8900,
    currency: 'INR',
    category: 'accessories',
    size: '38L',
    color: 'Olive',
    needsReview: false,
    description: 'Waxed canvas duffel with brass hardware.',
    raw: {},
  },
  {
    id: 'SKU-8846',
    name: 'Court Trainer — Mid',
    price: 7250,
    currency: 'INR',
    category: 'footwear',
    size: 'UK 8',
    color: 'Chalk',
    needsReview: false,
    description: 'Suede overlays, gum outsole.',
    raw: {},
  },
]

export const DEMO_FAILURES: FailureEntry[] = [
  {
    id: 'F-1042',
    query: 'white running shoes under 7000 size 9',
    status: 'resolved',
    reason: 'Colour "bone" had no synonym for "white". Synonym added; query now matches SKU-8841.',
    timestamp: '2026-08-22T09:14:00Z',
    filters: { color: 'white', max_price: 7000, size: '9' },
  },
  {
    id: 'F-1043',
    query: 'wide fit trail boots size 10',
    status: 'unresolved',
    reason: 'Width attribute absent on SKU-8842. Awaiting merchant confirmation.',
    timestamp: '2026-08-22T11:02:00Z',
    filters: { width: 'wide', size: '10' },
  },
  {
    id: 'F-1044',
    query: 'merino wool overcoat',
    status: 'no_match_unfixable',
    reason: 'No product in this catalog belongs to the outerwear category.',
    timestamp: '2026-08-22T14:41:00Z',
    filters: { material: 'merino wool', category: 'outerwear' },
  },
  {
    id: 'F-1045',
    query: 'beige linen shirt large',
    status: 'resolved',
    reason: 'Mapped "beige" to "sand" and normalised size token L. Matches SKU-8844.',
    timestamp: '2026-08-23T07:20:00Z',
    filters: { color: 'beige', size: 'large' },
  },
]

export const DEMO_AUDIT: AuditEntry[] = [
  {
    id: 'A-2201',
    timestamp: '2026-08-23T07:20:12Z',
    action: 'buyer_agent.query_parsed',
    reasoning: 'Extracted colour, fabric and size tokens from natural language request.',
    actor: 'buyer-agent',
    refs: ['F-1045'],
  },
  {
    id: 'A-2202',
    timestamp: '2026-08-23T07:20:13Z',
    action: 'catalog.match_failed',
    reasoning: 'Zero candidates. Colour token "beige" unresolved against catalog vocabulary.',
    actor: 'matcher',
    refs: ['F-1045'],
  },
  {
    id: 'A-2203',
    timestamp: '2026-08-23T07:21:44Z',
    action: 'healer.attribute_written',
    reasoning: 'Added colour synonym beige → sand after reviewing merchant colour chart.',
    actor: 'healer',
    refs: ['SKU-8844'],
  },
  {
    id: 'A-2204',
    timestamp: '2026-08-23T07:21:59Z',
    action: 'buyer_agent.order_created',
    reasoning: 'Re-ran the failed query post-heal. Match found, Razorpay order created.',
    actor: 'buyer-agent',
    refs: ['SKU-8844', 'order_QhT8vLm2Xd'],
  },
]

/* -------------------------------- requests -------------------------------- */

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    if (!res.ok) {
      throw new Error(`${path} responded ${res.status}`)
    }
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

export async function shop(query: string): Promise<ShopResult> {
  const body = asRecord(
    await request('/shop', { method: 'POST', body: JSON.stringify({ query }) }),
  )

  const productSource = body.product ?? body.match ?? body.item
  const order = asRecord(body.order ?? body.razorpay_order ?? body.razorpay)
  const orderId = str(body.order_id ?? order.id ?? order.order_id ?? body.razorpay_order_id)
  const explicitFailure =
    body.success === false || body.ok === false || body.status === 'failure' || !productSource

  if (explicitFailure) {
    return {
      ok: false,
      message:
        str(body.message ?? body.reason ?? body.detail) ??
        'No catalog entry satisfies every constraint in that request.',
      filters: asRecord(body.filters ?? body.parsed_filters ?? body.query_filters),
    }
  }

  const product = normalizeProduct(productSource)
  const amount = num(order.amount ?? body.amount)
  return {
    ok: true,
    product,
    orderId,
    amount: amount === null ? product.price : amount > 100000 ? amount / 100 : amount,
    currency: str(order.currency ?? body.currency) ?? product.currency,
    message: str(body.message),
  }
}

/**
 * Offline stand-in used only when the FastAPI service cannot be reached, so the
 * interface can still be demonstrated end to end. Marked as sample in the UI.
 */
export function simulateShop(query: string): ShopResult {
  const q = query.toLowerCase()
  const budget = num(q.match(/(\d{3,6})/)?.[1])
  const scored = DEMO_CATALOG.map((product) => {
    const hay = `${product.name} ${product.category} ${product.color} ${product.size}`.toLowerCase()
    const hits = q
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2 && !/^\d+$/.test(t))
      .filter((t) => hay.includes(t)).length
    const withinBudget = budget === null || (product.price ?? 0) <= budget
    return { product, score: hits + (withinBudget ? 0.5 : -2) }
  }).sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best || best.score < 1) {
    return {
      ok: false,
      message:
        'No catalog entry satisfies every constraint. The request has been written to the failure log for the healer to review.',
      filters: {
        query,
        max_price: budget,
        resolved_attributes: 0,
      },
    }
  }

  return {
    ok: true,
    product: best.product,
    orderId: `order_${Math.random().toString(36).slice(2, 12)}`,
    amount: best.product.price,
    currency: best.product.currency,
    message: 'Sample response — FastAPI service unreachable.',
  }
}

export function simulateHeal(): HealSummary {
  return {
    scanned: DEMO_CATALOG.length,
    fixed: 2,
    unresolvedBefore: 3,
    unresolvedAfter: 1,
    changes: [
      {
        id: 'SKU-8842',
        field: 'width',
        from: '∅',
        to: 'wide',
        product: 'Atlas Trail Boot',
      },
      {
        id: 'SKU-8844',
        field: 'color_synonyms',
        from: 'sand',
        to: 'sand, beige, oat',
        product: 'Terrace Linen Overshirt',
      },
    ],
    message: 'Sample response — FastAPI service unreachable.',
  }
}

export async function heal(): Promise<HealSummary> {
  const body = asRecord(await request('/heal', { method: 'POST' }))
  const changesSource = Array.isArray(body.changes)
    ? body.changes
    : Array.isArray(body.fixes)
      ? body.fixes
      : Array.isArray(body.updates)
        ? body.updates
        : []
  return {
    scanned: num(body.scanned ?? body.total ?? body.products_scanned) ?? 0,
    fixed: num(body.fixed ?? body.healed ?? body.resolved ?? changesSource.length) ?? 0,
    unresolvedBefore: num(body.unresolved_before ?? body.before ?? body.unresolved) ?? 0,
    unresolvedAfter: num(body.unresolved_after ?? body.after ?? body.remaining) ?? 0,
    changes: changesSource.map((c, i) => {
      const r = asRecord(c)
      return {
        id: str(r.id ?? r.product_id ?? r.failure_id) ?? `change-${i + 1}`,
        field: str(r.field ?? r.attribute ?? r.key) ?? 'attribute',
        from: str(r.from ?? r.old ?? r.previous) ?? '∅',
        to: str(r.to ?? r.new ?? r.value) ?? '—',
        product: str(r.product ?? r.product_name) ?? undefined,
      }
    }),
    message: str(body.message ?? body.summary),
  }
}

/* ---------------------------------- hooks --------------------------------- */

function useCollection<T>(
  path: string,
  normalize: (input: unknown, index: number) => T,
  demo: T[],
) {
  const { data, error, isLoading, mutate } = useSWR<T[]>(
    path,
    async (p: string) => asList(await request(p)).map(normalize),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  const live = Boolean(data) && !error
  return {
    data: live ? (data as T[]) : demo,
    live,
    isLoading,
    error: error as Error | undefined,
    refresh: mutate,
  }
}

export const useCatalog = () => useCollection('/catalog', normalizeProduct, DEMO_CATALOG)
export const useFailures = () => useCollection('/failures', normalizeFailure, DEMO_FAILURES)
export const useAudit = () => useCollection('/audit', normalizeAudit, DEMO_AUDIT)

export function formatMoney(value: number | null, currency = 'INR') {
  if (value === null) return '—'
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value}`
  }
}

export function formatStamp(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
