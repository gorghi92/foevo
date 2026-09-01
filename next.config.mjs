const isProd = process.env.NODE_ENV === 'production'

/**
 * Host da cui il sito può caricare immagini remote.
 *
 * Prima c'era un `**` che accettava qualunque dominio https: con
 * `/_next/image` aperto a tutti, chiunque poteva usare il nostro dominio come
 * proxy per scaricare immagini altrui, a nostro consumo di banda. Qui restano
 * solo i due archivi che usiamo davvero (Supabase Storage e R2), più
 * l'eventuale dominio personalizzato di R2 se configurato.
 */
const imageHosts = [
  { protocol: 'https', hostname: '**.supabase.co' },
  { protocol: 'https', hostname: '**.r2.dev' },
]
try {
  const base = process.env.R2_PUBLIC_BASE
  if (base) {
    const host = new URL(base).hostname
    if (host && !imageHosts.some((p) => p.hostname === host)) {
      imageHosts.push({ protocol: 'https', hostname: host })
    }
  }
} catch { /* variabile assente o non è un URL: restano i due host noti */ }

/**
 * Content Security Policy.
 *
 * `'unsafe-inline'` sugli script serve perché Next incorpora il payload di
 * idratazione in tag inline anche nelle pagine statiche, dove un nonce sarebbe
 * generato a build time e quindi inutile. Resta comunque bloccato il caso che
 * conta di più: nessuno script da domini che non siano i nostri e Whop.
 *
 * `frame-ancestors 'self'` invece di `'none'` perché la heatmap carica le
 * nostre pagine dentro un iframe per misurarle.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://js.whop.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.whop.com https://api.whop.com",
  "frame-src 'self' https://*.whop.com",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Un anno abbondante di sola HTTPS, sottodomini inclusi.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nessuna di queste funzioni serve al prodotto: spente per tutti.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()' },
  // `allow-popups` perché il checkout Whop può aprire una finestra propria.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Non serve annunciare quale framework e quale versione stiamo servendo.
  poweredByHeader: false,
  images: { remotePatterns: imageHosts },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}
export default nextConfig
