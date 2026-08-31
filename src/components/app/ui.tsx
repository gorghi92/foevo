import type { LucideIcon } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

/** Intestazione di pagina coerente in tutta l'area utente. */
export function PageHeader({
  title, subtitle, actions, eyebrow,
}: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2.5">
            <span className="heat-rule h-[3px] w-6 rounded-full" aria-hidden />
            <span className="label text-brand">{eyebrow}</span>
          </div>
        )}
        <h1 className="font-display text-[1.7rem] font-extrabold leading-tight tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <div className="mt-1.5 text-sm text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

/** Consumo del mese: barra con colore che scalda avvicinandosi al limite. */
export function UsageMeter({
  t, used, quota, unlimited, compact = false,
}: { t: Dictionary['app']['shell']['usage']; used: number; quota: number; unlimited?: boolean; compact?: boolean }) {
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, quota)) * 100))
  const bar = unlimited
    ? 'rgb(var(--brand))'
    : pct >= 90 ? 'rgb(var(--hot))' : pct >= 70 ? 'rgb(var(--warm))' : 'rgb(var(--brand))'
  return (
    <div className={compact ? '' : 'card p-4'}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-muted">{t.title}</span>
        <span className="text-xs font-bold text-ink">{used}{unlimited ? '' : ` / ${quota}`}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: unlimited ? '100%' : `${Math.max(3, pct)}%`, background: bar, opacity: unlimited ? 0.35 : 1 }}
        />
      </div>
      {!unlimited && pct >= 80 && (
        <p className="mt-2 text-[11px] leading-snug text-muted">
          <Rich text={t.nearLimit} />
        </p>
      )}
    </div>
  )
}

/** Stato vuoto con icona, testo e azione. */
export function EmptyState({
  icon: Icon, title, body, action,
}: { icon: LucideIcon; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-16 text-center">
      <span className="heat-dot grid h-14 w-14 place-items-center rounded-2xl text-white opacity-90">
        <Icon size={24} />
      </span>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/** Punteggio 0-100 come anello, con colore per fascia. */
export function ScoreRing({ value, size = 44, label }: { value: number | null; size?: number; label?: string }) {
  const v = value ?? 0
  const col = value == null ? 'rgb(var(--muted))' : v >= 70 ? '#16a34a' : v >= 45 ? 'rgb(var(--warm))' : 'rgb(var(--hot))'
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} title={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={4} />
        {value != null && (
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={4} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ - (circ * v) / 100}
          />
        )}
      </svg>
      <span className="absolute font-display text-[13px] font-extrabold" style={{ color: col }}>
        {value ?? '—'}
      </span>
    </div>
  )
}
