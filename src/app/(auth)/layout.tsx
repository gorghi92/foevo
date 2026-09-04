import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="heat-dot h-8 w-8 rounded-xl" aria-hidden />
        <span className="font-display text-lg font-extrabold tracking-tight">Foevo</span>
      </Link>
      <div className="card w-full max-w-sm p-7">{children}</div>
    </div>
  )
}
