/**
 * LLM providers for attention analysis. Raw HTTP (matches the codebase's Groq
 * pattern) so a single code path serves two providers:
 *  - premium tier → Anthropic Claude (Messages API, vision)
 *  - base tier    → Qwen-VL via DashScope (OpenAI-compatible, vision)
 *
 * Modelli, effort e chiavi sono configurabili dal pannello superadmin (salvati
 * in app_settings); le variabili d'ambiente restano come fallback.
 */
import { systemPrompt, premiumPrompt, basePrompt, extractJson, normalizeResult, type AttentionResult, type PageElement } from './types'
import { estimateCost, type Usage } from './pricing'
import { getSettings } from '@/lib/settings'

export type Tier = 'base' | 'premium'
export interface AnalyzeCtx { url: string; title: string; goal: string | null; note: string | null }
export interface LlmOutput { result: AttentionResult; provider: 'claude' | 'qwen'; model: string; usage: Usage; costUsd: number }

export const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const
export type Effort = (typeof EFFORTS)[number]
const normEffort = (e: string): Effort => (EFFORTS as readonly string[]).includes(e) ? (e as Effort) : 'medium'

// Modello base sempre disponibile: fallback se il primario (più recente) non risponde.
const QWEN_FALLBACK = 'qwen-vl-max'

export interface AiConfig {
  claudeModel: string; qwenModel: string
  claudeEffort: Effort
  anthropicKey: string; dashscopeKey: string; dashscopeBase: string
}

/** Config AI: prima il DB (pannello superadmin), poi l'env come fallback. */
export async function getAiConfig(): Promise<AiConfig> {
  const s = await getSettings()
  const pick = (k: string) => s[k] || process.env[k] || ''
  return {
    claudeModel: pick('ATTENTION_CLAUDE_MODEL') || 'claude-opus-5',
    qwenModel: pick('ATTENTION_QWEN_MODEL') || 'qwen-vl-max-latest',
    claudeEffort: normEffort(pick('ATTENTION_CLAUDE_EFFORT') || 'medium'),
    anthropicKey: pick('ANTHROPIC_API_KEY'),
    dashscopeKey: pick('DASHSCOPE_API_KEY'),
    dashscopeBase: (pick('DASHSCOPE_BASE_URL') || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1').replace(/\/+$/, ''),
  }
}

function splitDataUrl(dataUrl: string): { media: string; b64: string } {
  const m = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i)
  if (!m) return { media: 'image/jpeg', b64: dataUrl.replace(/^data:[^,]*,/, '') }
  return { media: m[1].toLowerCase(), b64: m[2] }
}

async function callClaude(cfg: AiConfig, dataUrl: string, system: string, user: string): Promise<{ text: string; usage: Usage }> {
  if (!cfg.anthropicKey) throw new Error('Provider AI non configurato')
  const { media, b64 } = splitDataUrl(dataUrl)
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': cfg.anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: cfg.claudeModel,
      max_tokens: 8000,
      system,
      // L'effort è configurabile: più alto = giudizio semantico migliore ma più
      // lento (attenzione al timeout della funzione). Su Opus 5 il thinking è adattivo.
      output_config: { effort: cfg.claudeEffort },
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: media, data: b64 } },
        { type: 'text', text: user },
      ] }],
    }),
  })
  if (!resp.ok) throw new Error(`Errore AI (${resp.status}): ${(await resp.text()).slice(0, 200)}`)
  const data: any = await resp.json()
  if (data?.stop_reason === 'refusal') throw new Error('Il servizio AI ha rifiutato la richiesta')
  const text = (data?.content || []).filter((b: any) => b?.type === 'text').map((b: any) => b.text).join('\n')
  if (!text) throw new Error('Risposta AI vuota')
  const usage: Usage = { input: Number(data?.usage?.input_tokens) || 0, output: Number(data?.usage?.output_tokens) || 0 }
  return { text, usage }
}

async function callQwenModel(cfg: AiConfig, model: string, dataUrl: string, system: string, user: string): Promise<{ text: string; usage: Usage }> {
  const resp = await fetch(`${cfg.dashscopeBase}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${cfg.dashscopeKey}` },
    body: JSON.stringify({
      model,
      max_tokens: 2400,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: user },
        ] },
      ],
    }),
  })
  if (!resp.ok) throw new Error(`Errore AI (${resp.status}): ${(await resp.text()).slice(0, 200)}`)
  const data: any = await resp.json()
  const text = data?.choices?.[0]?.message?.content
  const flat = Array.isArray(text) ? text.map((p: any) => p?.text || '').join('') : String(text || '')
  if (!flat) throw new Error('Risposta AI vuota')
  const usage: Usage = { input: Number(data?.usage?.prompt_tokens) || 0, output: Number(data?.usage?.completion_tokens) || 0 }
  return { text: flat, usage }
}

async function callQwen(cfg: AiConfig, dataUrl: string, system: string, user: string): Promise<{ text: string; usage: Usage; model: string }> {
  if (!cfg.dashscopeKey) throw new Error('Provider AI non configurato')
  try {
    const r = await callQwenModel(cfg, cfg.qwenModel, dataUrl, system, user)
    return { ...r, model: cfg.qwenModel }
  } catch (e) {
    // Se il modello primario (più recente) non è disponibile, ripiega sul base stabile.
    if (cfg.qwenModel === QWEN_FALLBACK) throw e
    console.warn(`[foevo] modello base "${cfg.qwenModel}" non disponibile, fallback a "${QWEN_FALLBACK}"`, e)
    const r = await callQwenModel(cfg, QWEN_FALLBACK, dataUrl, system, user)
    return { ...r, model: QWEN_FALLBACK }
  }
}

export async function analyze(tier: Tier, dataUrl: string, ctx: AnalyzeCtx, elements?: PageElement[]): Promise<LlmOutput> {
  const cfg = await getAiConfig()
  const system = systemPrompt()
  const fallbackGoal = ctx.goal || 'conversione'
  if (tier === 'premium') {
    const { text, usage } = await callClaude(cfg, dataUrl, system, premiumPrompt(ctx, elements))
    return { result: normalizeResult(extractJson(text), fallbackGoal, elements), provider: 'claude', model: cfg.claudeModel, usage, costUsd: estimateCost('claude', cfg.claudeModel, usage) }
  }
  const { text, usage, model } = await callQwen(cfg, dataUrl, system, basePrompt(ctx, elements))
  return { result: normalizeResult(extractJson(text), fallbackGoal, elements), provider: 'qwen', model, usage, costUsd: estimateCost('qwen', model, usage) }
}

export async function providerAvailable(tier: Tier): Promise<boolean> {
  const cfg = await getAiConfig()
  return tier === 'premium' ? !!cfg.anthropicKey : !!cfg.dashscopeKey
}
