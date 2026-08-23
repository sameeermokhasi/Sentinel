import type { Metadata } from 'next'
import { FailureLog } from '@/components/failure-log'
import { PageShell } from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Failure Logs — Sentinel',
  description: 'Inspect captured buyer search failures and resolution statuses.',
}

export default function FailuresPage() {
  return (
    <PageShell>
      <FailureLog />
    </PageShell>
  )
}
