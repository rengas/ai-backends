import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.2:latest';

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
 * Extract the first tweet from a response that might contain multiple tweets or examples
 */
function extractFirstTweet(response: string): string {
  let content = response.trim();
  
  console.log('🐦 [EXTRACTING TWEET]');
  console.log('📝 Input:', content);
  
  // Remove surrounding quotes if present (common in Ollama responses)
  if ((content.startsWith('"') && content.endsWith('"')) || 
      (content.startsWith("'") && content.endsWith("'"))) {
    content = content.slice(1, -1);
    console.log('🧹 Removed outer quotes:', content);
  }
  
  // If the response contains separators (---), take only the first part
  if (content.includes('---')) {
    content = content.split('---')[0].trim();
    console.log('✂️ Split on separator, took first part:', content);
  }
  
  // If the response contains multiple quoted sections, take the first one
  const quotedSections = content.match(/"([^"]+)"/g);
  if (quotedSections && quotedSections.length > 0) {
    content = quotedSections[0].replace(/"/g, '');
    console.log('📑 Extracted from quoted section:', content);
  }
  
  // Remove any remaining quotes that might be embedded
  content = content.replace(/^["']|["']$/g, '').trim();
  
  // If still too long or contains multiple lines that look like separate tweets, take first logical tweet
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 5) {
    // If too many lines, it's probably multiple tweets, take first few lines
    content = lines.slice(0, 4).join('\n');
    console.log('📏 Truncated to first 4 lines:', content);
  }
  
  // Final cleanup - ensure no stray quotes
  content = content.replace(/\\"/g, '"').trim(); // Unescape quotes
  
  console.log('✅ Final extracted tweet:', content);
  return content || response.trim(); // Fallback to original if extraction fails
}

/**
 * Create a smart fallback response based on the expected schema
 */
function createSmartFallbackResponse<T extends z.ZodType>(response: string, schema: T): any {
  const cleanResponse = response.trim();
  
  // Try to inspect the schema to understand what fields are expected
  try {
    const schemaShape = (schema as any)._def?.shape;
    if (schemaShape && typeof schemaShape === 'object') {
      const result: any = {};
      
      // Iterate through schema fields and try to populate them intelligently
      for (const [fieldName, fieldDef] of Object.entries(schemaShape)) {
        const fieldDefAny = fieldDef as any;
        
        // Handle different field types based on name and type
        if (fieldName === 'summary') {
          result.summary = cleanResponse;
                 } else if (fieldName === 'content') {
           // For content fields (like tweets), extract the first meaningful content
           result.content = extractFirstTweet(cleanResponse);
        } else if (fieldName === 'translation' || fieldName === 'translatedText') {
          result[fieldName] = cleanResponse;
        } else if (fieldName === 'sentiment') {
          result.sentiment = cleanResponse.toLowerCase().includes('positive') ? 'positive' : 
                            cleanResponse.toLowerCase().includes('negative') ? 'negative' : 'neutral';
        } else if (fieldName === 'confidence') {
          result.confidence = 0.8; // Default confidence
        } else if (fieldName === 'keywords') {
          // Try to extract keywords from the response
          const words = cleanResponse.split(/[,\s]+/).filter(word => word.length > 2);
          result.keywords = words.slice(0, 10);
        } else if (fieldName === 'emotions') {
          // Default emotions array
          result.emotions = [
            { emotion: "neutral", score: 0.7 }
          ];
        } else if (fieldDefAny?._def?.typeName === 'ZodString') {
          // For any string field, use the response
          result[fieldName] = cleanResponse;
        } else if (fieldDefAny?._def?.typeName === 'ZodNumber') {
          // For number fields, try to extract or default
          result[fieldName] = 0.8;
        } else if (fieldDefAny?._def?.typeName === 'ZodArray') {
          // For array fields, try to split the response
          if (cleanResponse.includes(',')) {
            result[fieldName] = cleanResponse.split(',').map(s => s.trim());
          } else {
            result[fieldName] = [cleanResponse];
          }
        } else {
          // Default: assign the response to unknown fields
          result[fieldName] = cleanResponse;
        }
      }
      
      return result;
    }
  } catch (error) {
    console.warn('Could not inspect schema for smart fallback:', error);
  }
  
  // Fallback to simple heuristics if schema inspection fails
  if (cleanResponse.toLowerCase().includes('summary') || cleanResponse.length > 50) {
    return { summary: cleanResponse };
  }
  
  if (cleanResponse.toLowerCase().includes('positive') || cleanResponse.toLowerCase().includes('negative')) {
    const sentiment = cleanResponse.toLowerCase().includes('positive') ? 'positive' : 
                     cleanResponse.toLowerCase().includes('negative') ? 'negative' : 'neutral';
    return { sentiment, confidence: 0.8 };
  }
  
  // For keywords, try to extract meaningful words
  if (cleanResponse.includes(',') || cleanResponse.split(' ').length <= 10) {
    const words = cleanResponse.split(/[,\s]+/).filter(word => word.length > 2);
    return { keywords: words.slice(0, 10) };
  }

     // Default fallback - use smart content extraction
   return { content: extractFirstTweet(cleanResponse) };
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

export { OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_CHAT_MODEL }; 