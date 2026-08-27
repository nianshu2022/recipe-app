import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AiProvider = 'deepseek' | 'openai' | 'custom'

export interface AiSettings {
  enabled: boolean
  provider: AiProvider
  apiKey: string
  baseUrl: string
  model: string
}

export const PROVIDER_PRESETS: Record<AiProvider, { name: string; baseUrl: string; model: string; tip: string }> = {
  deepseek: {
    name: 'DeepSeek (深度求索)',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    tip: '中文美食大厨能力极强，极低调用成本（推荐）',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    tip: '响应迅速，适合拥有 OpenAI 开发者账号的用户',
  },
  custom: {
    name: '自定义 OpenAI 兼容接口',
    baseUrl: '',
    model: '',
    tip: '支持通义千问、智谱、OneAPI、Ollama 等兼容格式',
  },
}

interface AiSettingsState extends AiSettings {
  setEnabled: (enabled: boolean) => void
  setProvider: (provider: AiProvider) => void
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  setModel: (model: string) => void
  applyPreset: (provider: AiProvider) => void
  testConnection: () => Promise<{ success: boolean; message: string }>
}

export const useAiSettingsStore = create<AiSettingsState>()(
  persist(
    (set, get) => ({
      enabled: false,
      provider: 'deepseek',
      apiKey: '',
      baseUrl: PROVIDER_PRESETS.deepseek.baseUrl,
      model: PROVIDER_PRESETS.deepseek.model,

      setEnabled: (enabled) => set({ enabled }),
      setProvider: (provider) => {
        const preset = PROVIDER_PRESETS[provider]
        if (provider === 'custom') {
          set({ provider })
        } else {
          set({
            provider,
            baseUrl: preset.baseUrl,
            model: preset.model,
          })
        }
      },
      setApiKey: (apiKey) => set({ apiKey: apiKey.trim() }),
      setBaseUrl: (baseUrl) => set({ baseUrl: baseUrl.trim() }),
      setModel: (model) => set({ model: model.trim() }),
      applyPreset: (provider) => {
        const preset = PROVIDER_PRESETS[provider]
        set({
          provider,
          baseUrl: preset.baseUrl,
          model: preset.model,
        })
      },

      testConnection: async () => {
        const { apiKey, baseUrl, model } = get()
        if (!apiKey) {
          return { success: false, message: '请先填写 API Key' }
        }
        if (!baseUrl) {
          return { success: false, message: '请填写接口基础地址 (Base URL)' }
        }
        if (!model) {
          return { success: false, message: '请填写模型名称 (Model)' }
        }

        const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
        const endpoint = normalizedBaseUrl.endsWith('/chat/completions')
          ? normalizedBaseUrl
          : `${normalizedBaseUrl}/chat/completions`

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'user',
                  content: '请回复四个字：连接成功',
                },
              ],
              max_tokens: 20,
            }),
          })

          if (!res.ok) {
            const errText = await res.text()
            return {
              success: false,
              message: `请求失败 (${res.status}): ${errText.slice(0, 100)}`,
            }
          }

          const data = await res.json()
          const reply = data?.choices?.[0]?.message?.content || '连接正常'
          return { success: true, message: `✅ 连接成功！模型响应: ${reply}` }
        } catch (e) {
          return {
            success: false,
            message: `网络连接异常: ${e instanceof Error ? e.message : '请检查跨域或网络'}`,
          }
        }
      },
    }),
    {
      name: 'recipe-ai-settings',
    }
  )
)
