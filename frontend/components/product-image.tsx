'use client'

import { ProductVisual } from '@/components/product-visual'
import type { Product } from '@/lib/sentinel-api'

export function ProductImage({
  product,
  className,
}: {
  product: Pick<Product, 'id' | 'name' | 'category' | 'color'>
  className?: string
  sizes?: string
  priority?: boolean
}) {
  return (
    <div className={`relative overflow-hidden bg-[#121214] flex items-center justify-center ${className ?? ''}`}>
      <ProductVisual
        category={product.category}
        name={product.name}
        color={product.color ?? undefined}
        interactive={true}
        materialize={true}
        className="h-full w-full"
      />
    </div>
  )
}
