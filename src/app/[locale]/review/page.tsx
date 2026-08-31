import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reviewer guide',
  description: 'Step-by-step test instructions for the Chrome Web Store reviewer.',
  robots: { index: false, follow: false },
}

const INBOX = 'https://www.mailinator.com/v4/public/inboxes.jsp?to=foevo-review'
const ACCOUNT = 'foevo-review@mailinator.com'

const STEPS: { t: string; d: React.ReactNode }[] = [
  {
    t: 'Pin the extension',
    d: <>After installing, click the puzzle-piece icon in Chrome’s toolbar and pin <b>Foevo</b> so its
       icon is visible.</>,
  },
  {
    t: 'Open the sign-in screen',
    d: <>Click the Foevo icon to open the popup, then click the <b>gear (settings)</b> icon in the top-right
       of the popup.</>,
  },
  {
    t: 'Enter the test email',
    d: <>In the email field type <b>{ACCOUNT}</b> and click <b>“Invia codice”</b> (Send code). Sign-in uses
       a one-time email code — there is no password.</>,
  },
  {
    t: 'Read the code from the public inbox',
    d: <>The 6-digit code is delivered to a public inbox you can open without any login:{' '}
       <a href={INBOX} target="_blank" rel="noreferrer" className="font-semibold text-brand">open the inbox →</a>.
       Open the newest “Foevo” message and copy the code. It is valid for 10 minutes; if it expired, click
       “Invia codice” again for a fresh one.</>,
  },
  {
    t: 'Complete sign-in',
    d: <>Paste the 6 digits into the popup and click <b>“Accedi”</b> (Sign in). The test account has an
       active paid plan, so analysis is enabled.</>,
  },
  {
    t: 'Run an analysis',
    d: <>Open any normal <b>https</b> web page (a landing page or product page works best — not a{' '}
       <code>chrome://</code> page, PDF, or the Web Store). Click <b>“Analizza questa pagina”</b>
       (Analyze this page). After about a minute a report opens in a new tab with an attention heatmap
       and conversion analysis.</>,
  },
]

export default function ReviewPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">Chrome Web Store</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Reviewer test guide</h1>
      <p className="mt-3 text-muted">
        Foevo turns a page you choose into an attention heatmap plus a conversion analysis. Signing in uses
        an email code instead of a password, so these steps show how to read that code from a public inbox —
        no shared mailbox password needed.
      </p>

      <div className="card mt-6 p-5">
        <div className="text-sm">
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <span className="text-muted">Test account</span><b>{ACCOUNT}</b>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <span className="text-muted">Password</span><span>none — email code</span>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <span className="text-muted">Code inbox</span>
            <a href={INBOX} target="_blank" rel="noreferrer" className="font-semibold text-brand">mailinator.com (public)</a>
          </div>
        </div>
      </div>

      <ol className="mt-8 space-y-5">
        {STEPS.map((s, i) => (
          <li key={s.t} className="flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
              {i + 1}
            </span>
            <div>
              <div className="font-semibold">{s.t}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="card mt-8 p-5 text-sm leading-relaxed text-muted">
        <b className="text-ink">Permissions.</b> The extension captures a screenshot of the active tab only
        when you click “Analizza”, and talks only to <code>foevo.app</code> — its own service — to return the
        report. It does not modify pages, inject content, or read browsing history. Full details:{' '}
        <a href="/privacy" className="font-semibold text-brand">privacy policy</a>.
      </div>

      <p className="mt-8 text-xs text-muted">Foevo · foevo.app</p>
    </main>
  )
}
