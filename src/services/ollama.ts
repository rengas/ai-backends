import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { describeImagePrompt } from "../utils/prompts";

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.2:latest';
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision:11b';

// Define our usage type to match OpenAI interface
export interface TokenUsage {
  input_tokens: number;
  input_tokens_details: {
    cached_tokens: number;
  };
  output_tokens: number;
  output_tokens_details: {
    reasoning_tokens: number;
  };
  total_tokens: number;
}

// Ollama API types
interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Make a request to Ollama API
 */
async function ollamaRequest(endpoint: string, payload: any): Promise<any> {
  const url = `${OLLAMA_BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  console.log('🤖 [OLLAMA REQUEST]');
  console.log('📍 URL:', url);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),    
  });

  const duration = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ [OLLAMA ERROR]');
    console.log('🕐 Duration:', `${duration}ms`);
    console.log('📊 Status:', `${response.status} ${response.statusText}`);
    console.log('📄 Error Response:', errorText);
    throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const responseData = await response.json();
  
  console.log('✅ [OLLAMA RESPONSE]');
  console.log('🕐 Duration:', `${duration}ms`);
  console.log('📊 Status:', response.status);
  console.log('📄 Raw Response:', JSON.stringify(responseData, null, 2));
  
  // Log key metrics if available
  if (responseData.prompt_eval_count || responseData.eval_count) {
    console.log('📈 Token Usage:');
    console.log('  • Input tokens:', responseData.prompt_eval_count || 0);
    console.log('  • Output tokens:', responseData.eval_count || 0);
    console.log('  • Total tokens:', (responseData.prompt_eval_count || 0) + (responseData.eval_count || 0));
  }

  return responseData;
}

/**
 * Convert Ollama usage stats to our TokenUsage format
 */
function convertUsage(ollamaResponse: OllamaResponse | OllamaChatResponse): TokenUsage {
  const inputTokens = ollamaResponse.prompt_eval_count || 0;
  const outputTokens = ollamaResponse.eval_count || 0;
  
  return {
    input_tokens: inputTokens,
    input_tokens_details: {
      cached_tokens: 0, // Ollama doesn't provide this info
    },
    output_tokens: outputTokens,
    output_tokens_details: {
      reasoning_tokens: 0, // Ollama doesn't provide this info
    },
    total_tokens: inputTokens + outputTokens,
  };
}

/**
 * Parse JSON response with error handling
 */
function parseStructuredResponse<T extends z.ZodType>(response: string): z.infer<T> {

  console.log("parseStructuredResponse XXX", response)
  const cleanResponse = response.trim();
  
  console.log('🔍 [PARSING RESPONSE]');
  console.log('📝 Raw response to parse:', cleanResponse);

  
  return cleanResponse;
}

/**
 * Generate a response using Ollama with structured output
 */
export async function generateResponse<T extends z.ZodType>(
  prompt: string,  
  schema: T,
  model?: string
): Promise<{ 
  data: z.infer<T>; 
  usage: TokenUsage;
}> {
  const modelToUse = model || OLLAMA_MODEL;
  
  // Create a prompt that encourages JSON output
  const structuredPrompt = `${prompt}`;

  // Convert Zod schema to JSON Schema format for Ollama
  const jsonSchema = zodToJsonSchema(schema, "schema");

  const payload = {
    model: modelToUse,
    prompt: structuredPrompt,
    stream: false,
    options: {
      temperature: 0.3, // Lower temperature for more consistent JSON output
    },
    format: jsonSchema // Use converted JSON Schema format
  };

  const response: OllamaResponse = await ollamaRequest('/api/generate', payload);
  // Parse the structured response
  const data = parseStructuredResponse(response.response);
  const usage = convertUsage(response);

  return {
    data,
    usage
  };
}


/**
 * Get available models from Ollama
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }
    const data = await response.json();
    return data.models?.map((model: any) => model.name) || [];
  } catch (error) {
    console.warn('Failed to fetch available models:', error);
    return [];
  }
}

/**
 * Get available vision models from Ollama
 */
export async function getAvailableVisionModels(): Promise<string[]> {
  try {
   const supportedModels = await getAvailableModels()
   return supportedModels.filter(model => model.includes('vision'))
  } catch (error) {
    console.warn('Failed to get supported models:', error)
    return []
  }
}

/**
 * Validate if a model is supported for vision tasks
 */
export async function isVisionModelSupported(service: string, model: string): Promise<boolean> {
  
  const ollamaVisionModels = ['llama3.2-vision:11b']
  if (service === 'ollama') {
    return ollamaVisionModels.includes(model)
  }

  return false
}

/**
 * Check if Ollama is running and accessible
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Describe an image using Ollama vision model
 */
export async function describeImage(
  images: string[],
  model?: string,
  stream: boolean = false,
  temperature: number = 0.3
): Promise<{
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done_reason: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}> {
  const modelToUse = model || OLLAMA_VISION_MODEL;

  const messages = [
    {
      role: 'user',
      content: describeImagePrompt(),
      images: images
    }
  ]
  
  const payload = {
    model: modelToUse,
    messages: messages,
    stream: stream,
    options: {
      temperature: temperature,
    }
  };

  const response: OllamaChatResponse = await ollamaRequest('/api/chat', payload);
  
  return {
    model: response.model,
    created_at: response.created_at,
    message: response.message,
    done_reason: response.done ? 'stop' : 'length',
    done: response.done,
    total_duration: response.total_duration,
    load_duration: response.load_duration,
    prompt_eval_count: response.prompt_eval_count,
    prompt_eval_duration: response.prompt_eval_duration,
    eval_count: response.eval_count,
    eval_duration: response.eval_duration
  };
}

export { OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_CHAT_MODEL, OLLAMA_VISION_MODEL }; 