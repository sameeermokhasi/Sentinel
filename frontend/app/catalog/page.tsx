import type { Metadata } from 'next'
import { CatalogGrid } from '@/components/catalog-grid'
import { PageShell } from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Live Catalog — Sentinel',
  description: 'Browse the 1,000-item Sentinel e-commerce catalog with live 3D WebGL visuals.',
}

export default function CatalogPage() {
  return (
    <PageShell>
      <CatalogGrid />
    </PageShell>
  )
}
