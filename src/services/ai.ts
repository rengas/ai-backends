import { z } from "zod";
import * as openaiService from "./openai";
import * as ollamaService from "./ollama";
import * as anthropicService from "./anthropic";
import { 
  openaiConfig, 
  ollamaConfig, 
  anthropicConfig,
  isServiceEnabled 
} from "../config/services";
import { llmRequestSchema } from "../schemas/llm";
import { keywordsResponseSchema } from "../schemas/keywords";

enum Provider {
  openai = 'openai',
  anthropic = 'anthropic',
  ollama = 'ollama',
  auto = 'auto'
}

// Re-export the TokenUsage interface for consistency
export type { TokenUsage } from "./openai";

// Service types
export type AIService = 'openai' | 'anthropic' | 'ollama';

// Service interface for consistency
export interface AIServiceResponse<T> {
  data: T;
  usage: openaiService.TokenUsage;
  service?: string; // Which service was actually used
}

export interface ImageDescriptionResponse {
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
    case Provider.openai:
      return isServiceEnabled('OpenAI');
    case Provider.anthropic:
      return isServiceEnabled('Anthropic');
    case Provider.ollama:
      if (!isServiceEnabled('Ollama')) return false;
      return await ollamaService.checkOllamaHealth();   
    default:
      return false;
  }
}

/**
 * Generate a response using the specified or best available AI service
 */
export async function generateResponse<T extends z.ZodType>(
  prompt: string,
  schema: T,
  config: z.infer<typeof llmRequestSchema>,
  temperature: number = 0
): Promise<AIServiceResponse<z.infer<T>>> {
  let serviceToUse: AIService | null = null;

  const provider = config.provider;
  const model = config.model;
  
  const isServiceAvailable = await checkServiceAvailability(provider);
  
  if (!isServiceAvailable) {
    throw new Error(`Service ${provider} is not available`);
  }
  
  try {
    let result;
    
    switch (provider) {         
      case Provider.ollama:
          result = await ollamaService.generateResponse(prompt, schema, model, temperature);
        return {
          ...result,
          service: Provider.ollama
        };

      case Provider.openai:
        result = await openaiService.generateResponse(prompt, schema);
        return {
          ...result,
          service: Provider.openai
        };

      case Provider.anthropic:
        result = await anthropicService.generateResponse(prompt, schema);
        return {
          ...result,
          service: Provider.anthropic
        };        
      default:
        throw new Error(`Unsupported service: ${serviceToUse}`);
    }
  } catch (error) {    
    throw new Error(`Cannot connect to service ${provider}: ${error}`);
  }
}

/**
 * Generate an image description using AI services with vision capabilities
 */
export async function generateImageResponse(
  images: string[],
  service: AIService = Provider.ollama,
  model?: string,    
  stream: boolean = false,
  temperature: number = 0.3
): Promise<ImageDescriptionResponse> {
  
  try {
    let result;
    
    switch (service) {
      case 'ollama':
        result = await ollamaService.describeImage(images, model, stream, temperature);
        return {
          ...result,
          usage: {
            input_tokens: result.prompt_eval_count || 0,
            output_tokens: result.eval_count || 0,
            total_tokens: (result.prompt_eval_count || 0) + (result.eval_count || 0),
          },
          service: service
        };
        
      default:
        throw new Error(`Vision capabilities not supported for service: ${service}`);
    }
  } catch (error) {
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
    case Provider.openai:
      // OpenAI models are configured, not dynamically fetched
      return [openaiConfig.model];

    case Provider.anthropic:
      // Anthropic models are configured, not dynamically fetched
      return [anthropicConfig.model];
      
    case Provider.ollama:
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
      available: await checkServiceAvailability(Provider.openai),
      config: {
        model: openaiConfig.model,
        hasApiKey: !!openaiConfig.apiKey,
      }
    },
    anthropic: {
      enabled: isServiceEnabled('Anthropic'),
      available: await checkServiceAvailability(Provider.anthropic),
      config: {
        model: anthropicConfig.model,
        hasApiKey: !!anthropicConfig.apiKey,
      }
    },
    ollama: {
      enabled: isServiceEnabled('Ollama'),
      available: await checkServiceAvailability(Provider.ollama),
      config: {
        baseURL: ollamaConfig.baseURL,
        model: ollamaConfig.model,
        chatModel: ollamaConfig.chatModel,
      }
    }
  };
  
  
  return {
    services: status,  
  };
} 

export async function processStructuredOutputRequest(
  prompt: string,
  schema: z.ZodType,
  config: z.infer<typeof llmRequestSchema>,
  temperature: number = 0
): Promise<any> {
  const provider = config.provider;
  const model = config.model;

  switch (provider) {
    case Provider.ollama:
      return await ollamaService.generateChatStructuredResponse(prompt, schema, model, temperature);
    case Provider.openai:
      return await openaiService.generateChatStructuredResponse(prompt, schema, model, temperature);
    case Provider.anthropic:
      return await anthropicService.generateChatStructuredResponse(prompt, schema, model, temperature);
    default:
      throw new Error(`Unsupported service: ${provider}`);
  }
}   

export async function processTextOutputRequest(
  prompt: string,
  config: z.infer<typeof llmRequestSchema>,
  temperature: number = 0
): Promise<any> {
  const provider = config.provider;
  const model = config.model;

  console.log('MODEL TO USE', model);

  switch (provider) {
    case Provider.ollama:
      return await ollamaService.generateChatTextResponse(prompt, model); 
    case Provider.openai:
      return await openaiService.generateChatTextResponse(prompt, model);
    case Provider.anthropic:
      return await anthropicService.generateChatTextResponse(prompt, model);
    default:
      throw new Error(`Unsupported service: ${provider}`);
  }
}   