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

export function magicLinkEmail(link: string): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 18px;font-size:14px;color:#57534e;line-height:1.5">Ciao! Usa il pulsante qui sotto per accedere al tuo account Foveo. Il link scade a breve e può essere usato una sola volta.</p>
    <a href="${link}" style="display:inline-block;background:${CORAL};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:12px">Accedi a Foveo</a>
    <p style="margin:18px 0 0;font-size:12px;color:#a8a29e;line-height:1.5">Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:<br><span style="color:#78716c;word-break:break-all">${link}</span></p>
    <p style="margin:16px 0 0;font-size:12px;color:#a8a29e">Se non hai richiesto tu l'accesso, ignora questa email.</p>`
  return { subject: 'Il tuo link di accesso a Foveo', html: shell('Il tuo link di accesso', body) }
}
