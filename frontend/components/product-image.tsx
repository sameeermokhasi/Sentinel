'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Product } from '@/lib/sentinel-api'

/** Known demo SKUs get their exact photograph. */
const BY_ID: Record<string, string> = {
  'SKU-8841': '/products/meridian-runner.png',
  'SKU-8842': '/products/atlas-trail-boot.png',
  'SKU-8843': '/products/oxford-shirt.png',
  'SKU-8844': '/products/linen-overshirt.png',
  'SKU-8845': '/products/canvas-weekender.png',
  'SKU-8846': '/products/court-trainer.png',
}

/** Anything arriving from the live API is matched on words, then category. */
const BY_KEYWORD: [RegExp, string][] = [
  [/\b(boot|hiking|trail)\b/i, '/products/atlas-trail-boot.png'],
  [/\b(runner|running|sneaker|trainer|shoe|shoes|footwear)\b/i, '/products/meridian-runner.png'],
  [/\b(shirt|oxford|tee|t-shirt|top)\b/i, '/products/oxford-shirt.png'],
  [/\b(overshirt|jacket|linen|coat|outerwear)\b/i, '/products/linen-overshirt.png'],
  [/\b(bag|duffel|weekender|tote|backpack|pouch)\b/i, '/products/canvas-weekender.png'],
]

const BY_CATEGORY: Record<string, string> = {
  footwear: '/products/generic-footwear.png',
  shoes: '/products/generic-footwear.png',
  apparel: '/products/generic-apparel.png',
  clothing: '/products/generic-apparel.png',
  accessories: '/products/generic-object.png',
}

export function imageForProduct(product: Pick<Product, 'id' | 'name' | 'category'>) {
  if (BY_ID[product.id]) return BY_ID[product.id]
  const haystack = `${product.name} ${product.category}`
  for (const [pattern, src] of BY_KEYWORD) {
    if (pattern.test(haystack)) return src
  }
  return BY_CATEGORY[product.category] ?? '/products/generic-object.png'
}

export function ProductImage({
  product,
  className,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  priority = false,
}: {
  product: Pick<Product, 'id' | 'name' | 'category'>
  className?: string
  sizes?: string
  priority?: boolean
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden bg-secondary ${className ?? ''}`}>
      <Image
        src={imageForProduct(product) || '/placeholder.svg'}
        alt={product.name}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-[opacity,transform] duration-700 ease-out ${
          loaded ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
        }`}
      />
    </div>
  )
}
