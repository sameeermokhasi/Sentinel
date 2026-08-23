'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ProductVisual } from '@/components/product-visual'
import { Box, Image as ImageIcon } from 'lucide-react'
import type { Product } from '@/lib/sentinel-api'

const BY_ID: Record<string, string> = {
  'RAW-004': '/products/puma-speed-runner.jpg',
  'RAW-005': '/products/puma-speed-runner.jpg',
  'SKU-8841': '/products/puma-speed-runner.jpg',
  'SKU-8842': '/products/atlas-trail-boot.png',
  'SKU-8843': '/products/oxford-shirt.png',
  'SKU-8844': '/products/linen-overshirt.png',
  'SKU-8845': '/products/canvas-weekender.png',
  'SKU-8846': '/products/court-trainer.png',
}

const BY_KEYWORD: [RegExp, string][] = [
  [/\b(puma|speed runner|runner|running|sneaker|shoe)\b/i, '/products/puma-speed-runner.jpg'],
  [/\b(boot|hiking|trail)\b/i, '/products/atlas-trail-boot.png'],
  [/\b(shirt|oxford|tee|t-shirt|top)\b/i, '/products/oxford-shirt.png'],
  [/\b(overshirt|jacket|linen|coat|outerwear)\b/i, '/products/linen-overshirt.png'],
  [/\b(bag|duffel|weekender|tote|backpack|pouch)\b/i, '/products/canvas-weekender.png'],
]

export function imageForProduct(product: Pick<Product, 'id' | 'name' | 'category'>) {
  if (BY_ID[product.id]) return BY_ID[product.id]
  const haystack = `${product.name} ${product.category}`
  for (const [pattern, src] of BY_KEYWORD) {
    if (pattern.test(haystack)) return src
  }
  return '/products/puma-speed-runner.jpg'
}

export function ProductImage({
  product,
  className,
  priority = false,
}: {
  product: Pick<Product, 'id' | 'name' | 'category' | 'color'>
  className?: string
  sizes?: string
  priority?: boolean
}) {
  const [viewMode, setViewMode] = useState<'photo' | '3d'>('photo')
  const imgSrc = imageForProduct(product)

  return (
    <div className={`relative overflow-hidden bg-[#0d0d0f] flex items-center justify-center group ${className ?? ''}`}>
      {viewMode === 'photo' ? (
        <div className="relative h-full w-full min-h-[320px]">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            priority={priority}
            unoptimized
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <ProductVisual
          category={product.category}
          name={product.name}
          color={product.color ?? undefined}
          interactive={true}
          materialize={true}
          className="h-full w-full"
        />
      )}

      {/* View Mode Toggle Button */}
      <button
        type="button"
        onClick={() => setViewMode((m) => (m === 'photo' ? '3d' : 'photo'))}
        className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/80 px-3 py-1.5 text-xs font-mono text-foreground backdrop-blur-md transition-all duration-200 hover:border-primary hover:bg-background"
      >
        {viewMode === 'photo' ? (
          <>
            <Box className="size-3.5 text-primary" />
            <span>View 3D Model</span>
          </>
        ) : (
          <>
            <ImageIcon className="size-3.5 text-primary" />
            <span>View Photo</span>
          </>
        )}
      </button>
    </div>
  )
}
