import Link from 'next/link'

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/affiliati" className="flex items-center gap-2.5">
            <span className="heat-dot h-7 w-7 rounded-lg" aria-hidden />
            <span className="font-display text-base font-extrabold tracking-tight">Foevo <span className="text-muted">· Affiliati</span></span>
          </Link>
          <Link href="/" className="text-sm text-muted transition hover:text-ink">Torna al sito →</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}
