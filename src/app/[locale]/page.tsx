import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight, Check, X, Eye, Brain, Crosshair, Target, Type, Ban,
  Palette, Share2, Chrome, MousePointerClick, Gauge, ShieldCheck, Zap,
} from 'lucide-react'
import { AttentionDemo } from '@/components/landing/attention-demo'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'
import { getDictionary, localePath, isLocale, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

type Params = { params: { locale: string } }

const asLocale = (v: string): Locale => (isLocale(v) ? v : DEFAULT_LOCALE)

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const d = getDictionary(asLocale(params.locale))
  return { title: d.home.meta.title, description: d.home.meta.description }
}

// Le icone non possono stare nei dizionari (sono componenti): restano qui,
// abbinate per posizione alle voci tradotte.
const ENGINE_ICONS = [Eye, Brain, Crosshair]
const BENEFIT_ICONS = [Target, Ban, Type, Palette, Gauge, Share2]
const STEP_ICONS = [Chrome, MousePointerClick, Gauge]

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="heat-dot h-8 w-8 rounded-xl" aria-hidden />
      <span className="font-display text-lg font-extrabold tracking-tight">Foevo</span>
    </div>
  )
}

function Section({ id, className = '', children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  )
}

function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`mb-3 flex items-center gap-2.5 ${center ? 'justify-center' : ''}`}>
      <span className="heat-rule h-[3px] w-7 rounded-full" aria-hidden />
      <span className="label text-brand">{children}</span>
    </div>
  )
}

export default function Landing({ params }: Params) {
  const locale = asLocale(params.locale)
  const d = getDictionary(locale)
  const h = d.home
  const p = (path: string) => localePath(locale, path)

  return (
    <div className="min-h-screen bg-bg">
      {/* ---------------- NAV ---------------- */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Wordmark />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            <Link href="#come" className="hover:text-ink">{h.nav.how}</Link>
            <Link href="#report" className="hover:text-ink">{h.nav.inPractice}</Link>
            <Link href="#prezzi" className="hover:text-ink">{h.nav.pricing}</Link>
            <Link href="#faq" className="hover:text-ink">{h.nav.faq}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={locale} className="hidden sm:inline-flex" />
            <Link href="/login" className="hidden text-sm font-semibold text-muted hover:text-ink sm:block">{d.common.login}</Link>
            <Link href="#prezzi" className="btn btn-primary">{d.common.startNow}</Link>
          </div>
        </div>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        {/* alone multi-colore con lo spettro del logo */}
        <div className="heat-aurora animate-heat-drift pointer-events-none absolute inset-x-0 -top-40 h-[820px]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-line" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/80 px-3.5 py-1.5 text-xs font-semibold text-muted backdrop-blur">
              <Zap size={13} className="text-brand" /> {h.hero.badge}
            </span>

            <h1 className="mt-6 text-[2.7rem] font-extrabold leading-[1.02] tracking-tight md:text-[4.1rem]">
              {h.hero.titleA}{' '}
              <span className="heat-text">{h.hero.titleB}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
              {h.hero.sub}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="#prezzi" className="btn btn-primary px-7 py-4 text-base shadow-lg shadow-brand/20">
                {h.hero.ctaPrimary} <ArrowRight size={17} />
              </Link>
              <Link href="#come" className="btn btn-ghost px-6 py-4 text-base">{h.hero.ctaSecondary}</Link>
            </div>

            <p className="mt-4 text-sm text-muted">{h.hero.note}</p>
          </div>

          {/* demo prodotto, protagonista */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div
              className="pointer-events-none absolute -inset-x-10 -inset-y-8 rounded-[2.5rem] blur-3xl"
              style={{
                background:
                  'radial-gradient(45% 60% at 20% 30%, rgb(var(--dot)/.18), transparent 70%), radial-gradient(50% 60% at 80% 25%, rgb(var(--warm)/.24), transparent 70%), radial-gradient(60% 70% at 50% 90%, rgb(var(--hot)/.22), transparent 70%)',
              }}
              aria-hidden
            />
            <div className="heat-frame relative rounded-2xl">
              <AttentionDemo />
            </div>
            <p className="mt-4 text-center text-xs text-muted">
              <Rich text={h.hero.demoNote} />
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- STRISCIA FATTI ---------------- */}
      <section className="border-y border-line bg-panel">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-7 px-6 py-9 md:grid-cols-4">
          {h.facts.map((s) => (
            <div key={s.k}>
              <div className="heat-text font-display text-2xl font-extrabold">{s.k}</div>
              <div className="mt-1 text-sm leading-snug text-muted">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- PROBLEMA ---------------- */}
      <Section className="py-20 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{h.problem.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-extrabold leading-tight md:text-[2.6rem]">
              <Rich text={h.problem.title} />
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              <Rich text={h.problem.body} />
            </p>
          </div>
          <ul className="space-y-3 self-center">
            {h.problem.symptoms.map((s) => (
              <li key={s} className="card flex items-start gap-3 p-4">
                <X size={17} className="mt-0.5 shrink-0 text-hot" />
                <span className="text-[15px] leading-relaxed text-ink">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------------- MECCANISMO ---------------- */}
      <section id="come" className="relative overflow-hidden border-y border-line bg-panel py-20 md:py-24">
        <div
          className="pointer-events-none absolute -right-32 top-0 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgb(var(--dot)/.10), transparent 70%)' }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <Eyebrow>{h.engine.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-extrabold leading-tight md:text-[2.6rem]">
              <span className="heat-text">{h.engine.title}</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{h.engine.body}</p>
          </div>

          <div className="mt-11 grid gap-5 md:grid-cols-3">
            {h.engine.items.map((m, i) => {
              const Icon = ENGINE_ICONS[i] ?? Eye
              return (
                <div key={m.title} className="card p-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex rounded-xl bg-brand-soft p-2.5 text-brand"><Icon size={20} /></span>
                    <span className="heat-text font-display text-lg font-extrabold opacity-40">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{m.body}</p>
                </div>
              )
            })}
          </div>

          {/* onestà: cosa non è */}
          <div className="heat-frame mt-6 rounded-2xl">
            <div className="card border-transparent bg-brand-soft/50 p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <h3 className="font-bold">{h.engine.notIsTitle}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                    <Rich text={h.engine.notIsBody} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- BENEFICI ---------------- */}
      <Section className="py-20 md:py-24">
        <div className="max-w-2xl">
          <Eyebrow>{h.benefits.eyebrow}</Eyebrow>
          <h2 className="text-3xl font-extrabold leading-tight md:text-[2.6rem]">{h.benefits.title}</h2>
        </div>
        <div className="mt-11 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {h.benefits.items.map((b, i) => {
            const Icon = BENEFIT_ICONS[i] ?? Target
            return (
              <div key={b.t} className="card p-6 transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md">
                <span className="inline-flex rounded-xl bg-brand-soft p-2.5 text-brand"><Icon size={20} /></span>
                <h3 className="mt-4 text-[17px] font-bold leading-snug">{b.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.b}</p>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ---------------- IN PRATICA ---------------- */}
      <section id="report" className="border-y border-line bg-panel py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <Eyebrow>{h.steps.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-extrabold leading-tight md:text-[2.6rem]">{h.steps.title}</h2>
          </div>

          <div className="mt-11 grid gap-5 md:grid-cols-3">
            {h.steps.items.map((s, i) => {
              const Icon = STEP_ICONS[i] ?? Chrome
              return (
                <div key={s.t} className="card p-6">
                  <div className="flex items-center gap-3">
                    <span className="heat-dot flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-extrabold text-white">
                      {i + 1}
                    </span>
                    <Icon size={18} className="text-brand" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.b}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
            {h.steps.checks.map((c) => (
              <span key={c} className="flex items-center gap-1.5"><Check size={15} className="text-brand" /> {c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- PER CHI ---------------- */}
      <Section className="py-20 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow>{h.audience.eyebrow}</Eyebrow>
            <h2 className="text-2xl font-extrabold leading-tight md:text-[2rem]">{h.audience.forTitle}</h2>
            <ul className="mt-6 space-y-3">
              {h.audience.forItems.map((x) => (
                <li key={x} className="flex items-start gap-3 text-[15px] leading-relaxed">
                  <Check size={18} className="mt-0.5 shrink-0 text-brand" /> <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card bg-bg p-7">
            <h2 className="text-2xl font-extrabold leading-tight">{h.audience.notTitle}</h2>
            <ul className="mt-6 space-y-3">
              {h.audience.notItems.map((x) => (
                <li key={x} className="flex items-start gap-3 text-[15px] leading-relaxed text-muted">
                  <X size={18} className="mt-0.5 shrink-0 text-muted" /> <span>{x}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">{h.audience.note}</p>
          </div>
        </div>
      </Section>

      {/* ---------------- PREZZI ---------------- */}
      <section id="prezzi" className="relative overflow-hidden border-y border-line bg-panel py-20 md:py-24">
        <div
          className="pointer-events-none absolute -left-40 bottom-0 h-[460px] w-[460px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgb(var(--warm)/.14), transparent 70%)' }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow center>{h.pricing.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-extrabold leading-tight md:text-[2.6rem]">{h.pricing.title}</h2>
            <p className="mt-4 text-lg text-muted">{h.pricing.sub}</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            {h.pricing.plans.map((plan) => {
              // Evidenza e destinazione vengono dallo slug, non dalla posizione:
              // così aggiungere o riordinare un piano non sposta il badge.
              const featured = plan.slug === 'premium'
              const href = `/signup?plan=${plan.slug}`
              const card = (
                <PlanCard
                  plan={plan}
                  featured={featured}
                  href={href}
                  perMonth={h.pricing.perMonth}
                  badge={h.pricing.featuredBadge}
                />
              )
              return featured ? (
                <div key={plan.name} className="heat-frame rounded-2xl md:-mt-3 md:mb-3">{card}</div>
              ) : (
                <div key={plan.name}>{card}</div>
              )
            })}
          </div>

          {/* rimozione del rischio */}
          <div className="card mx-auto mt-8 flex max-w-3xl items-start gap-4 p-6">
            <ShieldCheck size={22} className="mt-0.5 shrink-0 text-brand" />
            <div>
              <h3 className="font-bold">{h.pricing.noLockTitle}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                <Rich text={h.pricing.noLockBody} />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <Section id="faq" className="py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <Eyebrow center>{h.faq.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-extrabold md:text-[2.6rem]">{h.faq.title}</h2>
          </div>
          <div className="mt-10 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
            {h.faq.items.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 font-semibold hover:bg-bg">
                  <span>{f.q}</span>
                  <span className="mt-0.5 shrink-0 text-xl leading-none text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------------- CTA FINALE ---------------- */}
      <Section className="pb-20 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-panel p-10 text-center md:p-16">
          <div className="heat-aurora animate-heat-drift pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl font-extrabold leading-tight md:text-[2.8rem]">
              {h.finalCta.titleA}{' '}
              <span className="heat-text">{h.finalCta.titleB}</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{h.finalCta.sub}</p>
            <div className="mt-9 flex justify-center">
              <Link href="#prezzi" className="btn btn-primary px-8 py-4 text-base shadow-lg shadow-brand/20">
                {h.finalCta.cta} <ArrowRight size={18} />
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">{h.finalCta.note}</p>
          </div>
        </div>
      </Section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t border-line">
        <div className="heat-rule h-[3px] w-full opacity-70" aria-hidden />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-9 text-sm text-muted">
          <div>
            <Wordmark />
            <p className="mt-2 text-xs">{h.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="#come" className="hover:text-ink">{h.nav.how}</Link>
            <Link href="#prezzi" className="hover:text-ink">{h.nav.pricing}</Link>
            <Link href="#faq" className="hover:text-ink">{h.nav.faq}</Link>
            <Link href={p('/affiliati/diventa')} className="hover:text-ink">{h.footer.affiliates}</Link>
            <Link href={p('/supporto')} className="hover:text-ink">{h.footer.support}</Link>
            <Link href={p('/privacy')} className="hover:text-ink">{h.footer.privacy}</Link>
            <Link href="/login" className="hover:text-ink">{d.common.login}</Link>
            <LanguageSwitcher current={locale} />
          </div>
        </div>

        {/* origine del nome */}
        <div className="mx-auto max-w-6xl px-6 pb-9">
          <p className="max-w-2xl border-t border-line pt-5 text-xs leading-relaxed text-muted">
            <Rich text={h.footer.nameStory} />
          </p>
        </div>
      </footer>
    </div>
  )
}

function PlanCard({
  plan, featured, href, perMonth, badge,
}: {
  plan: { slug: string; name: string; per: string; price: string; note: string; cta: string; feats: string[] }
  featured: boolean
  href: string
  perMonth: string
  badge: string
}) {
  return (
    <div className={`card relative flex h-full flex-col p-7 ${featured ? 'border-transparent' : ''}`}>
      {featured && (
        <span className="heat-dot absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white">
          {badge}
        </span>
      )}
      <h3 className="text-xl font-bold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted md:min-h-[2.75rem]">{plan.per}</p>
      <p className="mt-5">
        <span className="font-display text-4xl font-extrabold">€{plan.price}</span>
        <span className="text-muted"> {perMonth}</span>
      </p>
      <p className="mt-1 text-xs text-muted">{plan.note}</p>
      <ul className="mt-6 space-y-2.5">
        {plan.feats.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm leading-relaxed">
            <Check size={16} className="mt-0.5 shrink-0 text-brand" /> {f}
          </li>
        ))}
      </ul>
      <Link href={href} className={`btn mt-7 w-full py-3 ${featured ? 'btn-primary' : 'btn-ghost'}`}>
        {plan.cta}
      </Link>
    </div>
  )
}
