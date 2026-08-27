/**
 * Prezzi dei provider AI, USD per 1M token (input / output).
 * ⚠️ Verifica/aggiorna questi valori con i prezzi reali del tuo contratto:
 * i prezzi Claude sono quelli API Anthropic; quelli Qwen/DashScope sono stime
 * e vanno confermati nella tua console Model Studio.
 */
export interface Usage { input: number; output: number }
interface Price { in: number; out: number } // USD / 1M token

const PRICING: Record<string, Price> = {
  // Anthropic Claude (prezzi API ufficiali)
  'claude-opus-5': { in: 5, out: 25 },
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-opus-4-7': { in: 5, out: 25 },
  'claude-sonnet-5': { in: 2, out: 10 },
  'claude-haiku-4-5': { in: 1, out: 5 },
  // Alibaba Qwen-VL via DashScope (STIME — verifica nella tua console)
  'qwen-vl-max': { in: 0.8, out: 3.2 },
  'qwen-vl-plus': { in: 0.21, out: 0.63 },
}

// fallback per provider quando il modello esatto non è in tabella
const PROVIDER_FALLBACK: Record<string, Price> = {
  claude: { in: 5, out: 25 },
  qwen: { in: 0.8, out: 3.2 },
}

/** Costo stimato in USD di una singola analisi. */
export function estimateCost(provider: 'claude' | 'qwen', model: string, usage: Usage): number {
  const p = PRICING[model] || PROVIDER_FALLBACK[provider] || { in: 0, out: 0 }
  const cost = (usage.input / 1_000_000) * p.in + (usage.output / 1_000_000) * p.out
  return Math.round(cost * 1e6) / 1e6 // 6 decimali
}
