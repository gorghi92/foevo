import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { renderInvoicePdf } from '@/lib/pdf'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const sc = createServiceClient()
  const { data: p } = await sc.from('payments').select('*').eq('id', params.id).maybeSingle()
  if (!p || p.user_id !== user.id) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })

  const amount = (Number(p.amount_cents) || 0) / 100
  const cur = String(p.currency || 'EUR')
  const date = new Date(p.created_at as string).toLocaleDateString('it-IT')
  const number = `FOEVO-${String(p.id).slice(0, 8).toUpperCase()}`

  const pdf = renderInvoicePdf({
    number,
    date,
    sellerLines: ['Foevo', '45 Innovation Drive, Suite 200', 'San Francisco, CA 94105, USA', 'EIN: 82-4291035', 'info@foevo.app'],
    buyerLines: [String(p.email || user.email || '-')],
    rows: [
      { label: 'Descrizione', value: String(p.description || 'Abbonamento Foevo') },
      { label: 'Piano', value: String(p.plan || '-') },
      { label: 'Metodo di pagamento', value: 'Whop' },
      { label: 'Stato', value: String(p.status || 'paid') },
    ],
    total: `${cur} ${amount.toFixed(2)} (IVA inclusa)`,
    note: 'Documento generato automaticamente da Foevo. IVA e imposte sono calcolate e riscosse da Whop in base al paese di acquisto.',
  })

  return new NextResponse(new Uint8Array(pdf), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${number}.pdf"` },
  })
}
