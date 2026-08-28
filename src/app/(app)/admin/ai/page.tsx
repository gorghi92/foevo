import { getSettingsFresh } from '@/lib/settings'
import { AiConfigForm } from './ai-form'

export const dynamic = 'force-dynamic'

export default async function AiConfigPage() {
  const s = await getSettingsFresh()
  const val = (k: string, def = '') => s[k] || process.env[k] || def
  const stat = (k: string): 'db' | 'env' | 'none' => (s[k] ? 'db' : process.env[k] ? 'env' : 'none')

  const pct = Number(val('ATTENTION_SEMANTIC_PCT', '44'))
  return (
    <AiConfigForm
      init={{
        claudeModel: val('ATTENTION_CLAUDE_MODEL', 'claude-opus-5'),
        qwenModel: val('ATTENTION_QWEN_MODEL', 'qwen-vl-max-latest'),
        effort: val('ATTENTION_CLAUDE_EFFORT', 'medium'),
        semanticPct: Number.isFinite(pct) ? Math.min(100, Math.max(0, Math.round(pct))) : 44,
      }}
      keyStatus={{
        ANTHROPIC_API_KEY: stat('ANTHROPIC_API_KEY'),
        DASHSCOPE_API_KEY: stat('DASHSCOPE_API_KEY'),
        DASHSCOPE_BASE_URL: stat('DASHSCOPE_BASE_URL'),
      }}
    />
  )
}
