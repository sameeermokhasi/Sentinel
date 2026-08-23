import type { Metadata } from 'next'
import { HealSection } from '@/components/heal-section'
import { PageShell } from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Catalog Healer — Sentinel',
  description: 'Autonomous AI healer repairing catalog defects and detecting anomalies.',
}

export default function HealerPage() {
  return (
    <PageShell>
      <HealSection />
    </PageShell>
  )
}
