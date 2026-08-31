import type { Metadata } from 'next'
import { Sora, Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { AnalyticsTracker } from '@/components/analytics/tracker'

const display = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display' })
const sans = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: { default: 'Foevo — Attention heatmaps & AI conversion analysis', template: '%s · Foevo' },
  description:
    'Scansiona una landing o scheda prodotto e ottieni una heatmap di attenzione + analisi AI orientata alla conversione.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}<AnalyticsTracker /></body>
    </html>
  )
}
