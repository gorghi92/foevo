import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { renderInvoicePdf } from '@/lib/pdf'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const sc = createServiceClient()
  const [{ data: p }, { data: prof }] = await Promise.all([
    sc.from('payments').select('*').eq('id', params.id).maybeSingle(),
    sc.from('profiles').select('full_name, email, billing_name, billing_vat, billing_cf, billing_address, billing_city, billing_zip, billing_country').eq('id', user.id).maybeSingle(),
  ])
  if (!p || p.user_id !== user.id) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })

  const amount = (Number(p.amount_cents) || 0) / 100
  const cur = String(p.currency || 'EUR')
  const date = new Date(p.created_at as string).toLocaleDateString('it-IT')
  const number = `FOEVO-${String(p.id).slice(0, 8).toUpperCase()}`

  // "Fatturato a": dati di fatturazione del cliente se presenti, altrimenti nome/email.
  const buyer: string[] = []
  const nm = prof?.billing_name || prof?.full_name
  if (nm) buyer.push(String(nm))
  if (prof?.billing_vat) buyer.push(`P.IVA ${prof.billing_vat}`)
  if (prof?.billing_cf) buyer.push(`CF ${prof.billing_cf}`)
  if (prof?.billing_address) buyer.push(String(prof.billing_address))
  const cityLine = [prof?.billing_zip, prof?.billing_city, prof?.billing_country].filter(Boolean).join(' ')
  if (cityLine) buyer.push(cityLine)
  buyer.push(String(p.email || prof?.email || user.email || '-'))

  const pdf = renderInvoicePdf({
    number,
    date,
    seller: ['Foevo', '45 Innovation Drive, Suite 200', 'San Francisco, CA 94105, USA', 'EIN: 82-4291035', 'info@foevo.app'],
    buyer,
    items: [
      { desc: String(p.description || 'Abbonamento Foevo'), amount: `${cur} ${amount.toFixed(2)}` },
    ],
    total: `${cur} ${amount.toFixed(2)}`,
    paidWith: 'Whop',
    note: 'Documento generato automaticamente da Foevo. Importo IVA inclusa: IVA e imposte sono calcolate e riscosse da Whop in base al paese di acquisto.',
  })

  return new NextResponse(new Uint8Array(pdf), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${number}.pdf"` },
  })
}
