'use client'

import { useMemo, useState } from 'react'
import { ProductImage } from '@/components/product-image'
import { PageHeading } from '@/components/page-shell'
import { Reveal } from '@/components/reveal'
import { formatMoney, useCatalog, type Product } from '@/lib/sentinel-api'

function CatalogCard({ product, index }: { product: Product; index: number }) {
  return (
    <Reveal
      as="li"
      delay={(index % 3) * 80}
      className="group relative flex flex-col border-b border-r border-border bg-card"
    >
      <div className="relative aspect-4/3 overflow-hidden">
        <ProductImage
          product={product}
          priority={index < 3}
          className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        {product.needsReview && (
          <span className="eyebrow absolute top-4 left-4 border border-primary/45 bg-background/80 px-2 py-1 font-mono text-primary backdrop-blur-sm">
            Needs review
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col border-t border-border p-6">
        <span className="eyebrow font-mono text-muted-foreground/60">{product.id}</span>
        <h3 className="mt-3 font-display text-base leading-snug font-medium tracking-[-0.01em] text-pretty">
          {product.name}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground capitalize">
          {[product.category, product.color, product.size].filter(Boolean).join(' · ')}
        </p>
        {product.description && (
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground/80">
            {product.description}
          </p>
        )}
        <p className="mt-6 font-display text-sm tabular-nums">
          {formatMoney(product.price, product.currency)}
        </p>
      </div>
    </Reveal>
  )
}

export function CatalogGrid() {
  const { data, live } = useCatalog()
  const [category, setCategory] = useState('all')

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(data.map((p) => p.category)))],
    [data],
  )
  const rows = category === 'all' ? data : data.filter((p) => p.category === category)
  const flagged = data.filter((p) => p.needsReview).length

  return (
    <>
      <PageHeading track="03" label="Live catalog" title="Every entry, as an agent sees it.">
        {data.length} entries · {flagged} flagged for review.{' '}
        {live ? 'Served from /catalog.' : 'Sample data — /catalog unreachable.'}
      </PageHeading>

      <div className="mt-10 flex flex-wrap gap-2">
        {categories.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={`eyebrow border px-3 py-2 font-mono capitalize transition-colors duration-200 ${
              category === key
                ? 'border-primary/60 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid border-t border-l border-border sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((product, i) => (
          <CatalogCard key={product.id} product={product} index={i} />
        ))}
      </ul>
    </>
  )
}
