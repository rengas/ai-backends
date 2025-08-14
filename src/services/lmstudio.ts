import { z } from 'zod'
import { lmstudioConfig } from '../config/services'

// Build base URL ensuring single trailing /v1
const normalizedBase = (lmstudioConfig.baseURL || 'http://localhost:1234').replace(/\/$/, '')
const LMSTUDIO_BASE_URL = `${normalizedBase}`

/**
 * Make a request to LMStudio API
 */
async function lmstudioRequest(endpoint: string, payload: any): Promise<any> {
  const url = `${LMSTUDIO_BASE_URL}/v1${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),    
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LMStudio API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

export async function generateChatStructuredResponse(
    prompt: string,
    schema: z.ZodType,
    model?: string,
    temperature: number = 0
  ): Promise<any> {  
    
    const payload = {
      model: model || lmstudioConfig.chatModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature,
      response_format: { type: 'json_object' }
    };

    const response = await lmstudioRequest('/chat/completions', payload);
    
    try {
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      // Validate against schema
      const validated = schema.parse(parsed);
      
      return {
        object: validated,
        finishReason: response.choices[0].finish_reason,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse or validate LMStudio response: ${error}`);
    }
  }

export async function generateChatTextResponse(
  prompt: string,
  model?: string,
  temperature: number = 0
): Promise<any> {
  
  const payload = {
    model: model || lmstudioConfig.chatModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: temperature,
  };

  const response = await lmstudioRequest('/chat/completions', payload);
  
  // Return format matching AI SDK's generateText response
  return {
    text: response.choices[0].message.content,
    finishReason: response.choices[0].finish_reason,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    warnings: []
  };
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


