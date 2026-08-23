import type { Metadata } from 'next'
import { AgentConsole } from '@/components/agent-console'
import { PageShell } from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Buyer agent — Sentinel',
  description:
    'Shop the Sentinel catalog in plain language. Requests are parsed into structured filters, matched against live product data, and turned into an order.',
}

export default function ShopPage() {
  return (
    <PageShell>
      <AgentConsole />
    </PageShell>
  )
}
