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
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://foevo.app').replace(/\/$/, '')

/** Guscio email responsive, table-based, con header brandizzato, CTA e footer. */
function shell(opts: { title: string; preheader?: string; body: string }): string {
  const { title, preheader = '', body } = opts
  return `<!doctype html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ef;-webkit-font-smoothing:antialiased;font-family:${FONT};color:#1c1917">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#f4f2ef">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f2ef">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:480px;background:#ffffff;border:1px solid #ece8e3;border-radius:18px;overflow:hidden">
      <!-- header -->
      <tr><td style="padding:22px 30px;border-bottom:1px solid #f2eee9">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle">
            <div style="width:30px;height:30px;border-radius:9px;background-color:#ff5a3c;background-image:radial-gradient(circle at 50% 40%, #ff5a3c 0%, #ffb020 45%, #6d28d9 78%)"></div>
          </td>
          <td style="vertical-align:middle;padding-left:11px;font-size:18px;font-weight:800;letter-spacing:-.3px;color:#1c1917">Foveo</td>
        </tr></table>
      </td></tr>
      <!-- body -->
      <tr><td style="padding:30px 30px 28px">
        <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;font-weight:800;color:#1c1917">${title}</h1>
        ${body}
      </td></tr>
      <!-- footer -->
      <tr><td style="padding:0 30px 26px">
        <div style="border-top:1px solid #f2eee9;padding-top:18px;font-size:12px;line-height:1.6;color:#a8a29e">
          <strong style="color:#78716c">Foveo</strong> — Attention heatmaps &amp; AI conversion analysis<br>
          <a href="${appUrl()}" style="color:${CORAL};text-decoration:none">foevo.app</a>
        </div>
      </td></tr>
    </table>
    <div style="width:480px;max-width:480px;margin-top:14px;font-size:11px;line-height:1.5;color:#b8b2ab;text-align:center">
      Ricevi questa email perché hai un account Foveo.
    </div>
  </td></tr>
</table>
</body></html>`
}

/** Pulsante "bulletproof" (renderizza bene anche su Outlook). */
function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 2px">
    <tr><td align="center" bgcolor="${CORAL}" style="border-radius:12px">
      <a href="${href}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:15px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;border-radius:12px">${label} &nbsp;&rarr;</a>
    </td></tr>
  </table>`
}

const P = 'margin:0 0 16px;font-size:15px;line-height:1.6;color:#57534e'
const SMALL = 'margin:18px 0 0;font-size:12px;line-height:1.6;color:#a8a29e'

export function orderConfirmationEmail(d: { planName: string; amount: string; date: string }): { subject: string; html: string } {
  const row = (l: string, v: string, top = true) =>
    `<tr><td style="padding:13px 16px;${top ? 'border-top:1px solid #f2eee9;' : ''}font-size:13px;color:#78716c">${l}</td><td style="padding:13px 16px;${top ? 'border-top:1px solid #f2eee9;' : ''}font-size:13px;font-weight:700;color:#1c1917;text-align:right">${v}</td></tr>`
  const body = `
    <p style="${P}">Grazie! Il pagamento è andato a buon fine e il tuo piano è <strong style="color:#16a34a">attivo</strong>. Puoi iniziare subito.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ece8e3;border-radius:14px;overflow:hidden;margin:0 0 22px;background:#fdfcfb">
      ${row('Piano', d.planName, false)}
      ${row('Importo', d.amount)}
      ${row('Data', d.date)}
    </table>
    ${ctaButton(`${appUrl()}/dashboard`, 'Vai alla dashboard')}
    <p style="${SMALL}">Trovi lo storico pagamenti e le fatture nella sezione <a href="${appUrl()}/billing" style="color:${CORAL};text-decoration:none">Piano</a> del tuo account.</p>`
  return { subject: 'Il tuo piano Foveo è attivo 🎉', html: shell({ title: 'Grazie per l’acquisto', preheader: 'Pagamento confermato: il tuo piano Foveo è attivo.', body }) }
}

export function cancellationEmail(d: { until?: string | null }): { subject: string; html: string } {
  const body = `
    <p style="${P}">Abbiamo registrato la richiesta di annullamento del tuo abbonamento.${d.until ? ` Resterà <strong style="color:#1c1917">attivo fino al ${d.until}</strong>, poi non verrà più rinnovato.` : ' Non verrà più rinnovato.'}</p>
    <p style="${P}">Puoi continuare a usare Foveo fino alla scadenza. Se cambi idea, puoi riattivarlo quando vuoi dalla sezione Piano.</p>
    ${ctaButton(`${appUrl()}/billing`, 'Gestisci il piano')}`
  return { subject: 'Abbonamento annullato — Foveo', html: shell({ title: 'Abbonamento annullato', preheader: d.until ? `Attivo fino al ${d.until}.` : 'Non verrà più rinnovato.', body }) }
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
    <p style="${P}">Usa il pulsante qui sotto per accedere al tuo account Foveo. Il link scade a breve e può essere usato una sola volta.</p>
    ${ctaButton(link, 'Accedi a Foveo')}
    <p style="${SMALL}">Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:<br><span style="color:#78716c;word-break:break-all">${link}</span></p>
    <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#a8a29e">Se non hai richiesto tu l'accesso, ignora questa email.</p>`
  return { subject: 'Il tuo link di accesso a Foveo', html: shell({ title: 'Il tuo link di accesso', preheader: 'Accedi al tuo account Foveo con un click.', body }) }
}
