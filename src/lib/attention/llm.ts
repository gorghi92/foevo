/**
 * LLM providers for attention analysis. Raw HTTP (matches the codebase's Groq
 * pattern) so a single code path serves two providers:
 *  - premium tier → Anthropic Claude (Messages API, vision)
 *  - base tier    → Qwen-VL via DashScope (OpenAI-compatible, vision)
 */
import { systemPrompt, premiumPrompt, basePrompt, extractJson, normalizeResult, type AttentionResult, type PageElement } from './types'
import { estimateCost, type Usage } from './pricing'

export type Tier = 'base' | 'premium'
export interface AnalyzeCtx { url: string; title: string; goal: string | null; note: string | null }
export interface LlmOutput { result: AttentionResult; provider: 'claude' | 'qwen'; model: string; usage: Usage; costUsd: number }

const CLAUDE_MODEL = process.env.ATTENTION_CLAUDE_MODEL || 'claude-opus-5'
const QWEN_MODEL = process.env.ATTENTION_QWEN_MODEL || 'qwen-vl-max-latest'
// Modello base sempre disponibile: fallback se il primario (più recente) non risponde.
const QWEN_FALLBACK = 'qwen-vl-max'
const DASHSCOPE_BASE = (process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1').replace(/\/+$/, '')

function splitDataUrl(dataUrl: string): { media: string; b64: string } {
  const m = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i)
  if (!m) return { media: 'image/jpeg', b64: dataUrl.replace(/^data:[^,]*,/, '') }
  return { media: m[1].toLowerCase(), b64: m[2] }
}

async function callClaude(dataUrl: string, system: string, user: string): Promise<{ text: string; usage: Usage }> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Provider AI non configurato')
  const { media, b64 } = splitDataUrl(dataUrl)
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      system,
      // Effort medium: buon salto di qualità sul giudizio semantico (CTA, copy,
      // gerarchia) restando entro il timeout della funzione. Su Opus 5 il
      // thinking è adattivo. 'high' era troppo lento (FUNCTION_INVOCATION_TIMEOUT).
      output_config: { effort: 'medium' },
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

async function callQwenModel(key: string, model: string, dataUrl: string, system: string, user: string): Promise<{ text: string; usage: Usage }> {
  const resp = await fetch(`${DASHSCOPE_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${key}` },
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

async function callQwen(dataUrl: string, system: string, user: string): Promise<{ text: string; usage: Usage }> {
  const key = process.env.DASHSCOPE_API_KEY
  if (!key) throw new Error('Provider AI non configurato')
  try {
    return await callQwenModel(key, QWEN_MODEL, dataUrl, system, user)
  } catch (e) {
    // Se il modello primario (più recente) non è disponibile, ripiega sul base stabile.
    if (QWEN_MODEL === QWEN_FALLBACK) throw e
    console.warn(`[foevo] modello base "${QWEN_MODEL}" non disponibile, fallback a "${QWEN_FALLBACK}"`, e)
    return await callQwenModel(key, QWEN_FALLBACK, dataUrl, system, user)
  }
}

export async function analyze(tier: Tier, dataUrl: string, ctx: AnalyzeCtx, elements?: PageElement[]): Promise<LlmOutput> {
  const system = systemPrompt()
  const fallbackGoal = ctx.goal || 'conversione'
  if (tier === 'premium') {
    const { text, usage } = await callClaude(dataUrl, system, premiumPrompt(ctx, elements))
    return { result: normalizeResult(extractJson(text), fallbackGoal, elements), provider: 'claude', model: CLAUDE_MODEL, usage, costUsd: estimateCost('claude', CLAUDE_MODEL, usage) }
  }
  const { text, usage } = await callQwen(dataUrl, system, basePrompt(ctx, elements))
  return { result: normalizeResult(extractJson(text), fallbackGoal, elements), provider: 'qwen', model: QWEN_MODEL, usage, costUsd: estimateCost('qwen', QWEN_MODEL, usage) }
}

export function providerAvailable(tier: Tier): boolean {
  return tier === 'premium' ? !!process.env.ANTHROPIC_API_KEY : !!process.env.DASHSCOPE_API_KEY
}
