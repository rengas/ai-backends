import { z } from 'zod'
import { lmstudioConfig } from '../config/services'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateObject, generateText } from 'ai'

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
    const modelToUse = lmstudio(model || lmstudioConfig.chatModel);

    const result = await generateObject({
      model: modelToUse, 
      prompt: prompt,
      schema: schema,
      temperature: temperature,   
    });
    
    return result;
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


