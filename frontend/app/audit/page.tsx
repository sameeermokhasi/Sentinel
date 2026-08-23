import type { Metadata } from 'next'
import { AuditTrail } from '@/components/audit-trail'
import { PageShell } from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Audit Trail — Sentinel',
  description: 'Replay end-to-end multi-agent decisions and audit logs.',
}

export default function AuditPage() {
  return (
    <PageShell>
      <AuditTrail />
    </PageShell>
  )
}
