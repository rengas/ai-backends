import { z } from 'zod'
import { lmstudioConfig } from '../config/services'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai'
import { zodToJsonSchema } from 'zod-to-json-schema'

// Build base URL ensuring single trailing /v1
const normalizedBase = (lmstudioConfig.baseURL || 'http://localhost:1234').replace(/\/$/, '')
const LMSTUDIO_BASE_URL = `${normalizedBase}`

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: `${LMSTUDIO_BASE_URL}/v1`,
})

export async function generateChatStructuredResponse(
    prompt: string,
    schema: z.ZodType,
    model?: string,
    temperature: number = 0
  ): Promise<any> {
    const modelId = model || lmstudioConfig.chatModel

    // Convert Zod schema to JSON Schema for LM Studio's OpenAI-compatible endpoint
    const jsonSchema = zodToJsonSchema(schema)

    const body = {
      model: modelId,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: typeof temperature === 'number' ? temperature : 0,
      max_tokens: -1,
      stream: false,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'structured_output',
          strict: true,
          schema: jsonSchema,
        },
      },
    }

    const response = await fetch(`${LMSTUDIO_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`LM Studio request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    const choice = Array.isArray(data?.choices) ? data.choices[0] : undefined
    const contentRaw = choice?.message?.content

    if (typeof contentRaw !== 'string') {
      throw new Error('LM Studio returned non-string content for structured response')
    }

    let parsedObject: unknown
    try {
      parsedObject = JSON.parse(contentRaw)
    } catch (err) {
      throw new Error(`Failed to parse assistant JSON content: ${String(err)}`)
    }

    const validation = schema.safeParse(parsedObject)
    if (!validation.success) {
      throw new Error(`Response failed schema validation: ${validation.error.message}`)
    }

    return {
      object: validation.data,
      finishReason: choice?.finish_reason ?? choice?.finishReason ?? null,
      usage: {
        promptTokens: data?.usage?.prompt_tokens ?? 0,
        completionTokens: data?.usage?.completion_tokens ?? 0,
        totalTokens: data?.usage?.total_tokens ?? 0,
      },
      id: data?.id,
      model: data?.model ?? modelId,
    }
  }

export async function generateChatTextResponse(
  prompt: string,
  model?: string,
  temperature: number = 0
): Promise<any> {
  
  const modelToUse = lmstudio(model || lmstudioConfig.chatModel);

  const result = await generateText({
    model: modelToUse,
    prompt: prompt,
    temperature: temperature,
    toolChoice: 'none',
  });
  
  return result;
}

export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${LMSTUDIO_BASE_URL}/v1/models`)
    if (!response.ok) return []
    const data = await response.json()
    if (Array.isArray(data?.data)) {
      return data.data.map((m: any) => m.id).filter((id: any) => typeof id === 'string')
    }
    return []
  } catch (error) {
    return []
  }
}

export { LMSTUDIO_BASE_URL }


