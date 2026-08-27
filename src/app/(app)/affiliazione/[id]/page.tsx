import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { affiliateDetail } from '@/lib/affiliate/admin'
import { referralLink } from '@/lib/affiliate/data'
import { OverrideControl, StatusControl, ReferralsTable, CommissionsTable } from './detail'

export const dynamic = 'force-dynamic'

const money = (c: number) => `€${((c || 0) / 100).toFixed(2)}`

export default async function AdminAffiliateDetail({ params }: { params: { id: string } }) {
  const d = await affiliateDetail(params.id)
  if (!d) notFound()
  const { aff, bank, referrals, comms, payouts } = d

  const earned = comms.filter((c: any) => c.status !== 'reversed').reduce((s: number, c: any) => s + c.amount_cents, 0)
  const available = comms.filter((c: any) => c.status === 'available').reduce((s: number, c: any) => s + c.amount_cents, 0)
  const paid = comms.filter((c: any) => c.status === 'paid').reduce((s: number, c: any) => s + c.amount_cents, 0)
  const conversions = referrals.filter((r: any) => r.status === 'converted').length

  return (
    <div className="space-y-6">
      <Link href="/affiliazione" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={15} /> Tutti gli affiliati
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">{aff.username}</h1>
          <p className="text-sm text-muted">{aff.full_name || '—'} · {aff.email}</p>
          <p className="mt-1 text-xs text-muted">
            Link: <code>{referralLink(aff.code)}</code>
            {aff.user_id && <> · <span className="rounded bg-brand-soft px-1.5 py-0.5 font-semibold text-brand">anche utente Foevo</span></>}
          </p>
        </div>
        <StatusControl id={aff.id} status={aff.status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <KPI label="Click" value={String(aff.clicks)} />
        <KPI label="Clienti" value={String(conversions)} />
        <KPI label="Guadagno" value={money(earned)} />
        <KPI label="Disponibile / Pagato" value={`${money(available)} / ${money(paid)}`} />
      </div>

      <div className="card p-5">
        <div className="font-semibold">Percentuale dedicata</div>
        <p className="mt-1 text-xs text-muted">Se impostata, vince sui default di piano. Lascia vuoto per usare i default.</p>
        <div className="mt-3"><OverrideControl id={aff.id} current={aff.commission_override_bps as number | null} /></div>
      </div>

      {bank && (
        <div className="card p-5 text-sm">
          <div className="font-semibold">Coordinate bancarie</div>
          <div className="mt-2 grid gap-1 text-muted sm:grid-cols-2">
            <div>Intestatario: <span className="text-ink">{bank.holder || '—'}</span></div>
            <div>IBAN: <span className="font-mono text-ink">{bank.iban || '—'}</span></div>
            <div>Banca: <span className="text-ink">{bank.bank_name || '—'}</span></div>
            <div>Paese: <span className="text-ink">{bank.country || '—'}</span></div>
          </div>
        </div>
      )}

      <div><h2 className="mb-2 font-display text-lg font-extrabold">Clienti portati</h2><ReferralsTable rows={referrals as any} /></div>
      <div><h2 className="mb-2 font-display text-lg font-extrabold">Commissioni</h2><CommissionsTable rows={comms as any} /></div>

      {payouts.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-lg font-extrabold">Richieste di pagamento</h2>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="p-3">Data</th><th className="p-3 text-right">Importo</th><th className="p-3">Stato</th><th className="p-3">Nota</th>
              </tr></thead>
              <tbody>
                {payouts.map((p: any) => (
                  <tr key={p.id} className="border-b border-line/60">
                    <td className="p-3">{new Date(p.requested_at).toLocaleDateString('it-IT')}</td>
                    <td className="p-3 text-right font-semibold">{money(p.amount_cents)}</td>
                    <td className="p-3">{p.status}</td>
                    <td className="p-3 text-muted">{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function KPI({ label, value }: { label: string; value: string }) {
  return <div className="card p-4"><div className="text-xs font-medium text-muted">{label}</div><div className="mt-1 font-display text-xl font-extrabold">{value}</div></div>
}
