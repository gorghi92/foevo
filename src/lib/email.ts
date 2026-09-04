import { getSettings } from './settings'
import { DEFAULT_LOCALE, type Locale } from './i18n/config'

/** Invio email via Resend. Ritorna false se non configurato o in errore. */
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const s = await getSettings()
  const key = s.RESEND_API_KEY || process.env.RESEND_API_KEY || ''
  const from = s.MAIL_FROM || process.env.MAIL_FROM || 'Foevo <noreply@foevo.app>'
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

/**
 * Testi delle email transazionali. L'italiano definisce la struttura, l'inglese
 * la deve rispettare: se manca una chiave il typecheck fallisce.
 *
 * `{segnaposto}` viene sostituito da `fill()`.
 */
const COPY_IT = {
  footerTagline: 'Attention heatmaps &amp; AI conversion analysis',
  footerWhy: 'Ricevi questa email perché hai un account Foevo.',

  receipt: {
    subject: 'Il tuo piano Foevo è attivo 🎉',
    title: 'Grazie per l’acquisto',
    preheader: 'Pagamento confermato: il tuo piano Foevo è attivo.',
    intro: 'Grazie! Il pagamento è andato a buon fine e il tuo piano è <strong style="color:#16a34a">attivo</strong>. Puoi iniziare subito.',
    rowPlan: 'Piano',
    rowAmount: 'Importo',
    rowDate: 'Data',
    cta: 'Vai alla dashboard',
    footnote: 'Trovi lo storico pagamenti e le fatture nella sezione <a href="{billingUrl}" style="color:{coral};text-decoration:none">Piano</a> del tuo account.',
  },

  cancellation: {
    subject: 'Abbonamento annullato — Foevo',
    title: 'Abbonamento annullato',
    intro: 'Abbiamo registrato la richiesta di annullamento del tuo abbonamento.',
    untilSuffix: ' Resterà <strong style="color:#1c1917">attivo fino al {until}</strong>, poi non verrà più rinnovato.',
    noRenewSuffix: ' Non verrà più rinnovato.',
    body: 'Puoi continuare a usare Foevo fino alla scadenza. Se cambi idea, puoi riattivarlo quando vuoi dalla sezione Piano.',
    cta: 'Gestisci il piano',
    preheaderUntil: 'Attivo fino al {until}.',
    preheaderNoRenew: 'Non verrà più rinnovato.',
  },

  extensionOtp: {
    subject: '{code} è il tuo codice Foevo',
    title: 'Il tuo codice di accesso',
    preheader: 'Codice {code} — scade tra 10 minuti.',
    intro: 'Ecco il codice per collegare l’estensione Foevo al tuo account. Scade tra <b style="color:#1c1917">10 minuti</b>.',
    footnote: 'Inseriscilo nella finestra dell’estensione per completare l’accesso. Il codice funziona una sola volta.',
    ignore: 'Se non hai richiesto tu l’accesso, ignora questa email: senza il codice nessuno può entrare.',
  },

  emailChange: {
    subject: '{code} — conferma la nuova email Foevo',
    title: 'Conferma la nuova email',
    preheader: 'Codice {code} per confermare {email}.',
    intro: 'Hai chiesto di usare <b style="color:#1c1917">{email}</b> come nuova email di accesso a Foevo. Conferma con questo codice, valido <b style="color:#1c1917">10 minuti</b>.',
    footnote: 'Il cambio diventa effettivo solo dopo aver inserito il codice nella pagina Profilo.',
    ignore: 'Se non hai richiesto tu questa modifica, ignora l&rsquo;email: senza il codice l&rsquo;indirizzo non viene cambiato.',
  },

  magicLink: {
    subject: 'Il tuo link di accesso a Foevo',
    title: 'Il tuo link di accesso',
    preheader: 'Accedi al tuo account Foevo con un click.',
    intro: 'Usa il pulsante qui sotto per accedere al tuo account Foevo. Il link scade a breve e può essere usato una sola volta.',
    cta: 'Accedi a Foevo',
    footnote: 'Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:',
    ignore: 'Se non hai richiesto tu l’accesso, ignora questa email.',
  },

  refund: {
    badgeCritical: 'Da gestire subito',
    badgeWarning: 'Da verificare',
    badgeInfo: 'Per conoscenza',
    intro: 'È stato registrato un <strong style="color:#1c1917">rimborso o una contestazione</strong> su un pagamento. Non abbiamo stornato nulla in automatico: decidi tu dal pannello.',
    rowPayment: 'Pagamento',
    rowCustomer: 'Cliente',
    rowRefunded: 'Importo rimborsato',
    rowAffiliate: 'Affiliato',
    rowCommission: 'Commissione collegata',
    noCommission: 'Nessuna commissione affiliato collegata a questo pagamento.',
    cta: 'Apri il pannello affiliati',
    preheader: 'Rimborso/contestazione su un pagamento — nessuno storno automatico.',
  },
}

const COPY_EN: typeof COPY_IT = {
  footerTagline: 'Attention heatmaps &amp; AI conversion analysis',
  footerWhy: 'You are receiving this email because you have a Foevo account.',

  receipt: {
    subject: 'Your Foevo plan is active 🎉',
    title: 'Thanks for your purchase',
    preheader: 'Payment confirmed: your Foevo plan is active.',
    intro: 'Thank you! The payment went through and your plan is <strong style="color:#16a34a">active</strong>. You can start right away.',
    rowPlan: 'Plan',
    rowAmount: 'Amount',
    rowDate: 'Date',
    cta: 'Go to the dashboard',
    footnote: 'Your payment history and invoices are in the <a href="{billingUrl}" style="color:{coral};text-decoration:none">Plan</a> section of your account.',
  },

  cancellation: {
    subject: 'Subscription cancelled — Foevo',
    title: 'Subscription cancelled',
    intro: 'We have recorded your request to cancel your subscription.',
    untilSuffix: ' It stays <strong style="color:#1c1917">active until {until}</strong>, and will not renew after that.',
    noRenewSuffix: ' It will not renew.',
    body: 'You can keep using Foevo until it expires. If you change your mind, you can restart it any time from the Plan section.',
    cta: 'Manage your plan',
    preheaderUntil: 'Active until {until}.',
    preheaderNoRenew: 'It will not renew.',
  },

  extensionOtp: {
    subject: '{code} is your Foevo code',
    title: 'Your sign-in code',
    preheader: 'Code {code} — expires in 10 minutes.',
    intro: 'Here is the code to connect the Foevo extension to your account. It expires in <b style="color:#1c1917">10 minutes</b>.',
    footnote: 'Enter it in the extension window to finish signing in. The code works only once.',
    ignore: 'If you did not request this sign-in, ignore this email: without the code nobody can get in.',
  },

  emailChange: {
    subject: '{code} — confirm your new Foevo email',
    title: 'Confirm your new email',
    preheader: 'Code {code} to confirm {email}.',
    intro: 'You asked to use <b style="color:#1c1917">{email}</b> as your new Foevo sign-in email. Confirm with this code, valid for <b style="color:#1c1917">10 minutes</b>.',
    footnote: 'The change only takes effect once you enter the code on the Profile page.',
    ignore: 'If you did not request this change, ignore this email: without the code the address is not changed.',
  },

  magicLink: {
    subject: 'Your Foevo sign-in link',
    title: 'Your sign-in link',
    preheader: 'Sign in to your Foevo account with one click.',
    intro: 'Use the button below to sign in to your Foevo account. The link expires shortly and can only be used once.',
    cta: 'Sign in to Foevo',
    footnote: 'If the button does not work, copy and paste this address into your browser:',
    ignore: 'If you did not request this sign-in, ignore this email.',
  },

  refund: {
    badgeCritical: 'Handle immediately',
    badgeWarning: 'Needs checking',
    badgeInfo: 'For your information',
    intro: 'A <strong style="color:#1c1917">refund or dispute</strong> was recorded on a payment. Nothing was reversed automatically: decide from the panel.',
    rowPayment: 'Payment',
    rowCustomer: 'Customer',
    rowRefunded: 'Amount refunded',
    rowAffiliate: 'Affiliate',
    rowCommission: 'Linked commission',
    noCommission: 'No affiliate commission is linked to this payment.',
    cta: 'Open the affiliate panel',
    preheader: 'Refund/dispute on a payment — nothing reversed automatically.',
  },
}

const COPY: Record<Locale, typeof COPY_IT> = { it: COPY_IT, en: COPY_EN }

/** Testi email nella lingua richiesta (fallback all'italiano). */
function copy(locale: Locale = DEFAULT_LOCALE) {
  return COPY[locale] ?? COPY[DEFAULT_LOCALE]
}

/** Sostituisce i segnaposto `{nome}` nel testo. */
const fill = (text: string, vars: Record<string, string> = {}) =>
  text.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match)

/** Guscio email responsive, table-based, con header brandizzato, CTA e footer. */
function shell(opts: { title: string; preheader?: string; body: string; locale?: Locale }): string {
  const { title, preheader = '', body, locale = DEFAULT_LOCALE } = opts
  const c = copy(locale)
  return `<!doctype html>
<html lang="${locale}" xmlns="http://www.w3.org/1999/xhtml">
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
          <td style="vertical-align:middle;padding-left:11px;font-size:18px;font-weight:800;letter-spacing:-.3px;color:#1c1917">Foevo</td>
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
          <strong style="color:#78716c">Foevo</strong> — ${c.footerTagline}<br>
          <a href="${appUrl()}" style="color:${CORAL};text-decoration:none">foevo.app</a>
        </div>
      </td></tr>
    </table>
    <div style="width:480px;max-width:480px;margin-top:14px;font-size:11px;line-height:1.5;color:#b8b2ab;text-align:center">
      ${c.footerWhy}
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

export function orderConfirmationEmail(d: { planName: string; amount: string; date: string; locale?: Locale }): { subject: string; html: string } {
  const c = copy(d.locale).receipt
  const row = (l: string, v: string, top = true) =>
    `<tr><td style="padding:13px 16px;${top ? 'border-top:1px solid #f2eee9;' : ''}font-size:13px;color:#78716c">${l}</td><td style="padding:13px 16px;${top ? 'border-top:1px solid #f2eee9;' : ''}font-size:13px;font-weight:700;color:#1c1917;text-align:right">${v}</td></tr>`
  const body = `
    <p style="${P}">${c.intro}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ece8e3;border-radius:14px;overflow:hidden;margin:0 0 22px;background:#fdfcfb">
      ${row(c.rowPlan, d.planName, false)}
      ${row(c.rowAmount, d.amount)}
      ${row(c.rowDate, d.date)}
    </table>
    ${ctaButton(`${appUrl()}/dashboard`, c.cta)}
    <p style="${SMALL}">${fill(c.footnote, { billingUrl: `${appUrl()}/billing`, coral: CORAL })}</p>`
  return { subject: c.subject, html: shell({ title: c.title, preheader: c.preheader, body, locale: d.locale }) }
}

export function cancellationEmail(d: { until?: string | null; locale?: Locale }): { subject: string; html: string } {
  const c = copy(d.locale).cancellation
  const suffix = d.until ? fill(c.untilSuffix, { until: d.until }) : c.noRenewSuffix
  const body = `
    <p style="${P}">${c.intro}${suffix}</p>
    <p style="${P}">${c.body}</p>
    ${ctaButton(`${appUrl()}/billing`, c.cta)}`
  const preheader = d.until ? fill(c.preheaderUntil, { until: d.until }) : c.preheaderNoRenew
  return { subject: c.subject, html: shell({ title: c.title, preheader, body, locale: d.locale }) }
}

/**
 * Invia la conferma d'acquisto UNA SOLA VOLTA per pagamento (dedup atomico sul
 * flag receipt_sent). `sc` è il service client Supabase.
 */
export async function sendReceiptOnce(
  sc: { from: (t: string) => any },
  d: { whopPaymentId?: string | null; to: string; planName: string; amount: string; date: string; locale?: Locale },
): Promise<void> {
  if (!d.whopPaymentId || !d.to) return
  const { data } = await sc.from('payments')
    .update({ receipt_sent: true })
    .eq('whop_payment_id', d.whopPaymentId).eq('receipt_sent', false)
    .select('id')
  if (!data || data.length === 0) return // già inviata o pagamento non presente
  const { subject, html } = orderConfirmationEmail({ planName: d.planName, amount: d.amount, date: d.date, locale: d.locale })
  await sendEmail({ to: d.to, subject, html })
}

export function extensionOtpEmail(code: string, locale?: Locale): { subject: string; html: string } {
  const c = copy(locale).extensionOtp
  const body = `
    <p style="${P}">${c.intro}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ece8e3;border-radius:14px;background:#fdfcfb;margin:0 0 20px">
      <tr><td align="center" style="padding:22px 16px">
        <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:32px;font-weight:800;letter-spacing:10px;text-indent:10px;color:${CORAL}">${code}</div>
      </td></tr>
    </table>
    <p style="${SMALL}">${c.footnote}</p>
    <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#a8a29e">${c.ignore}</p>`
  return { subject: fill(c.subject, { code }), html: shell({ title: c.title, preheader: fill(c.preheader, { code }), body, locale }) }
}

export function emailChangeOtpEmail(code: string, newEmail: string, locale?: Locale): { subject: string; html: string } {
  const c = copy(locale).emailChange
  const body = `
    <p style="${P}">${fill(c.intro, { email: newEmail })}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ece8e3;border-radius:14px;background:#fdfcfb;margin:0 0 20px">
      <tr><td align="center" style="padding:22px 16px">
        <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:32px;font-weight:800;letter-spacing:10px;text-indent:10px;color:${CORAL}">${code}</div>
      </td></tr>
    </table>
    <p style="${SMALL}">${c.footnote}</p>
    <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#a8a29e">${c.ignore}</p>`
  return {
    subject: fill(c.subject, { code }),
    html: shell({ title: c.title, preheader: fill(c.preheader, { code, email: newEmail }), body, locale }),
  }
}

export function refundAlertEmail(d: {
  title: string
  paymentId: string
  email?: string | null
  amount?: string | null
  commissionAmount?: string | null
  commissionState?: string | null
  affiliate?: string | null
  severity: 'info' | 'warning' | 'critical'
  locale?: Locale
}): { subject: string; html: string } {
  const c = copy(d.locale).refund
  const tint = d.severity === 'critical' ? '#dc2626' : d.severity === 'warning' ? '#d97706' : '#0891b2'
  const badge = d.severity === 'critical' ? c.badgeCritical : d.severity === 'warning' ? c.badgeWarning : c.badgeInfo
  const row = (l: string, v: string, top = true) =>
    `<tr><td style="padding:12px 16px;${top ? 'border-top:1px solid #f2eee9;' : ''}font-size:13px;color:#78716c;vertical-align:top">${l}</td><td style="padding:12px 16px;${top ? 'border-top:1px solid #f2eee9;' : ''}font-size:13px;font-weight:700;color:#1c1917;text-align:right;vertical-align:top">${v}</td></tr>`
  const rows = [
    row(c.rowPayment, d.paymentId, false),
    d.email ? row(c.rowCustomer, d.email) : '',
    d.amount ? row(c.rowRefunded, d.amount) : '',
    d.affiliate ? row(c.rowAffiliate, d.affiliate) : '',
    d.commissionAmount ? row(c.rowCommission, d.commissionAmount) : '',
  ].filter(Boolean).join('')
  const stateNote = d.commissionState
    ? `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${tint};font-weight:600">${d.commissionState}</p>`
    : `<p style="${P}">${c.noCommission}</p>`
  const body = `
    <div style="display:inline-block;padding:5px 12px;border-radius:999px;background:${tint}1a;color:${tint};font-size:12px;font-weight:700;margin:0 0 14px">${badge}</div>
    <p style="${P}">${c.intro}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ece8e3;border-radius:14px;overflow:hidden;margin:0 0 20px;background:#fdfcfb">
      ${rows}
    </table>
    ${stateNote}
    ${ctaButton(`${appUrl()}/affiliazione/pagamenti`, c.cta)}`
  return {
    subject: `Foevo · ${d.title}`,
    html: shell({ title: d.title, preheader: c.preheader, body, locale: d.locale }),
  }
}

export function magicLinkEmail(link: string, locale?: Locale): { subject: string; html: string } {
  const c = copy(locale).magicLink
  const body = `
    <p style="${P}">${c.intro}</p>
    ${ctaButton(link, c.cta)}
    <p style="${SMALL}">${c.footnote}<br><span style="color:#78716c;word-break:break-all">${link}</span></p>
    <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#a8a29e">${c.ignore}</p>`
  return { subject: c.subject, html: shell({ title: c.title, preheader: c.preheader, body, locale }) }
}
