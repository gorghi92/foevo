import { getSettings } from './settings'

/** Invio email via Resend. Ritorna false se non configurato o in errore. */
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const s = await getSettings()
  const key = s.RESEND_API_KEY || process.env.RESEND_API_KEY || ''
  const from = s.MAIL_FROM || process.env.MAIL_FROM || 'Foveo <noreply@foevo.app>'
  if (!key) return false
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    })
    return r.ok
  } catch {
    return false
  }
}

export async function emailConfigured(): Promise<boolean> {
  const s = await getSettings()
  return !!(s.RESEND_API_KEY || process.env.RESEND_API_KEY)
}

const CORAL = '#e5502e'

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#faf9f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f7;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#fff;border:1px solid #e9e5e1;border-radius:16px;overflow:hidden">
        <tr><td style="padding:26px 28px 0">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:30px"><div style="width:26px;height:26px;border-radius:8px;background:radial-gradient(circle at 50% 42%, #ff5a3c 0%, #ffb020 42%, #6d28d9 66%)"></div></td>
            <td style="padding-left:10px;font-size:17px;font-weight:800;letter-spacing:-.2px">Foveo</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:20px 28px 28px">
          <h1 style="margin:0 0 10px;font-size:20px;font-weight:800">${title}</h1>
          ${bodyHtml}
        </td></tr>
      </table>
      <div style="max-width:460px;margin-top:16px;font-size:12px;color:#78716c;text-align:center">Foveo · Attention heatmaps &amp; AI conversion analysis</div>
    </td></tr>
  </table></body></html>`
}

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://foevo.app').replace(/\/$/, '')

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${CORAL};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:12px">${label}</a>`
}

export function orderConfirmationEmail(d: { planName: string; amount: string; date: string }): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:14px;color:#57534e;line-height:1.5">Grazie! Il tuo pagamento è andato a buon fine e il tuo piano è attivo.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e9e5e1;border-radius:12px;margin:0 0 18px">
      <tr><td style="padding:12px 14px;font-size:13px;color:#78716c">Piano</td><td style="padding:12px 14px;font-size:13px;font-weight:700;text-align:right">${d.planName}</td></tr>
      <tr><td style="padding:12px 14px;border-top:1px solid #f0ece8;font-size:13px;color:#78716c">Importo</td><td style="padding:12px 14px;border-top:1px solid #f0ece8;font-size:13px;font-weight:700;text-align:right">${d.amount}</td></tr>
      <tr><td style="padding:12px 14px;border-top:1px solid #f0ece8;font-size:13px;color:#78716c">Data</td><td style="padding:12px 14px;border-top:1px solid #f0ece8;font-size:13px;font-weight:700;text-align:right">${d.date}</td></tr>
    </table>
    ${ctaButton(`${appUrl()}/dashboard`, 'Vai alla dashboard')}
    <p style="margin:18px 0 0;font-size:12px;color:#a8a29e">Trovi lo storico pagamenti e le fatture nella sezione Piano del tuo account.</p>`
  return { subject: 'Conferma acquisto — Foveo', html: shell('Grazie per l’acquisto', body) }
}

export function cancellationEmail(d: { until?: string | null }): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:14px;color:#57534e;line-height:1.5">Abbiamo registrato la richiesta di annullamento del tuo abbonamento.${d.until ? ` Resterà <b>attivo fino al ${d.until}</b>, poi non verrà più rinnovato.` : ' Non verrà più rinnovato.'}</p>
    <p style="margin:0 0 18px;font-size:14px;color:#57534e;line-height:1.5">Puoi continuare a usare Foveo fino alla scadenza. Se cambi idea, puoi riattivarlo quando vuoi.</p>
    ${ctaButton(`${appUrl()}/billing`, 'Gestisci il piano')}`
  return { subject: 'Abbonamento annullato — Foveo', html: shell('Abbonamento annullato', body) }
}

/**
 * Invia la conferma d'acquisto UNA SOLA VOLTA per pagamento (dedup atomico sul
 * flag receipt_sent). `sc` è il service client Supabase.
 */
export async function sendReceiptOnce(
  sc: { from: (t: string) => any },
  d: { whopPaymentId?: string | null; to: string; planName: string; amount: string; date: string },
): Promise<void> {
  if (!d.whopPaymentId || !d.to) return
  const { data } = await sc.from('payments')
    .update({ receipt_sent: true })
    .eq('whop_payment_id', d.whopPaymentId).eq('receipt_sent', false)
    .select('id')
  if (!data || data.length === 0) return // già inviata o pagamento non presente
  const { subject, html } = orderConfirmationEmail({ planName: d.planName, amount: d.amount, date: d.date })
  await sendEmail({ to: d.to, subject, html })
}

export function magicLinkEmail(link: string): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 18px;font-size:14px;color:#57534e;line-height:1.5">Ciao! Usa il pulsante qui sotto per accedere al tuo account Foveo. Il link scade a breve e può essere usato una sola volta.</p>
    <a href="${link}" style="display:inline-block;background:${CORAL};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:12px">Accedi a Foveo</a>
    <p style="margin:18px 0 0;font-size:12px;color:#a8a29e;line-height:1.5">Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:<br><span style="color:#78716c;word-break:break-all">${link}</span></p>
    <p style="margin:16px 0 0;font-size:12px;color:#a8a29e">Se non hai richiesto tu l'accesso, ignora questa email.</p>`
  return { subject: 'Il tuo link di accesso a Foveo', html: shell('Il tuo link di accesso', body) }
}
