import { z } from "zod";
import * as openaiService from "./openai";
import * as ollamaService from "./ollama";
import { 
  openaiConfig, 
  ollamaConfig, 
  isServiceEnabled 
} from "../config/services";

// Re-export the TokenUsage interface for consistency
export type { TokenUsage } from "./openai";

// Service types
export type AIService = 'openai' | 'ollama' | 'auto';

// Service interface for consistency
export interface AIServiceResponse<T> {
  data: T;
  usage: openaiService.TokenUsage;
  service?: string; // Which service was actually used
}

export interface TweetResponse {
  tweet: string;
  characterCount: number;
  author: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  service?: string; // Which service was actually used
}

/**
 * Check if a service is available
 */
export async function checkServiceAvailability(service: AIService): Promise<boolean> {
  switch (service) {
    case 'openai':
      return isServiceEnabled('OpenAI');
    case 'ollama':
      if (!isServiceEnabled('Ollama')) return false;
      return await ollamaService.checkOllamaHealth();
    case 'auto':
      return await checkServiceAvailability('openai') || await checkServiceAvailability('ollama');
    default:
      return false;
  }
}

/**
 * Get the best available service
 */
export async function getBestAvailableService(): Promise<AIService | null> {
  // Ollama inference by default
  if (await checkServiceAvailability('ollama')) {
    return 'ollama';
  }

  if (await checkServiceAvailability('openai')) {
    return 'openai';
  }

  return null;
}

/**
 * Generate a response using the specified or best available AI service
 */
export async function generateResponse<T extends z.ZodType>(
  prompt: string,
  schema: T,
  preferredService: AIService = 'auto',
  model?: string
): Promise<AIServiceResponse<z.infer<T>>> {
  let serviceToUse: AIService | null = null;
  
  if (preferredService === 'auto') {
    serviceToUse = await getBestAvailableService();
  } else if (await checkServiceAvailability(preferredService)) {
    serviceToUse = preferredService;
  } else {
    // Fallback to best available
    serviceToUse = await getBestAvailableService();
  }
  
  if (!serviceToUse) {
    throw new Error('No AI services are available');
  }
  
  try {
    let result;
    
    switch (serviceToUse) {
         
      case 'ollama':
          result = await ollamaService.generateResponse(prompt, schema, model);
        return {
          ...result,
          service: 'ollama'
        };

      case 'openai':
        result = await openaiService.generateResponse(prompt, schema);
        return {
          ...result,
          service: 'openai'
        };     
        
      default:
        throw new Error(`Unsupported service: ${serviceToUse}`);
    }
  } catch (error) {
    // If preferred service fails and we're not in auto mode, try fallback
    if (preferredService !== 'auto') {
      console.warn(`Service ${serviceToUse} failed, trying fallback...`);
      const fallbackService = await getBestAvailableService();
      
      if (fallbackService && fallbackService !== serviceToUse) {
        return generateResponse(prompt, schema, fallbackService, model);
      }
    }
    
    throw error;
  }
}

/**
 * Get available models for a specific service
 */
export async function getAvailableModels(service: AIService): Promise<string[]> {
  if (!await checkServiceAvailability(service)) {
    return [];
  }
  
  switch (service) {
    case 'openai':
      // OpenAI models are configured, not dynamically fetched
      return [openaiConfig.model];
      
    case 'ollama':
      return await ollamaService.getAvailableModels();
      
    default:
      return [];
  }
}

/**
 * Get service status information
 */
export async function getServiceStatus() {
  const status = {
    openai: {
      enabled: isServiceEnabled('OpenAI'),
      available: await checkServiceAvailability('openai'),
      config: {
        model: openaiConfig.model,
        hasApiKey: !!openaiConfig.apiKey,
      }
    },
    ollama: {
      enabled: isServiceEnabled('Ollama'),
      available: await checkServiceAvailability('ollama'),
      config: {
        baseURL: ollamaConfig.baseURL,
        model: ollamaConfig.model,
        chatModel: ollamaConfig.chatModel,
      }
    }
  };
  
  const primaryService = await getBestAvailableService();
  
  return {
    services: status,
    primary: primaryService,
    anyAvailable: !!primaryService
  };
} 