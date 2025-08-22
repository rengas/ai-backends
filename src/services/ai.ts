import { z } from "zod";
import * as openaiService from "./openai";
import * as ollamaService from "./ollama";
import * as anthropicService from "./anthropic";
import * as openrouterService from "./openrouter";
import * as lmstudioService from "./lmstudio";
import * as aigatewayService from "./aigateway";
import { 
  openaiConfig, 
  ollamaConfig, 
  anthropicConfig,
  openrouterConfig,
  lmstudioConfig,
  aigatewayConfig,
  isServiceEnabled 
} from "../config/services";
import { llmRequestSchema } from "../schemas/v1/llm";

enum Provider {
  openai = 'openai',
  anthropic = 'anthropic',
  ollama = 'ollama',
  openrouter = 'openrouter',
  lmstudio = 'lmstudio',
  aigateway = 'aigateway',
}

// Service types
export type AIService = 'openai' | 'anthropic' | 'ollama' | 'openrouter' | 'lmstudio' | 'aigateway';

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
      return isServiceEnabled('Ollama');
    case Provider.openrouter:
      return isServiceEnabled('OpenRouter');
    case Provider.lmstudio:
      return isServiceEnabled('LMStudio');
    case Provider.aigateway:
      return isServiceEnabled('AIGateway');
    default:
      return false;
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
      return openaiService.getAvailableModels();

    case Provider.anthropic:      
      return anthropicService.getAvailableModels();
      
    case Provider.ollama:
      return await ollamaService.getAvailableModels();

    case Provider.openrouter:
      return await openrouterService.getAvailableModels();
    case Provider.lmstudio:
      return await lmstudioService.getAvailableModels();
    case Provider.aigateway:
      return await aigatewayService.getAvailableModels();
      
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
    },
    openrouter: {
      enabled: isServiceEnabled('OpenRouter'),
      available: await checkServiceAvailability(Provider.openrouter),
      config: {
        model: openrouterConfig.model,
        hasApiKey: !!openrouterConfig.apiKey,
        baseURL: openrouterConfig.baseURL,
      }
    },
    lmstudio: {
      enabled: isServiceEnabled('LMStudio'),
      available: await checkServiceAvailability(Provider.lmstudio),
      config: {
        baseURL: lmstudioConfig.baseURL,
        model: lmstudioConfig.model,
        chatModel: lmstudioConfig.chatModel,
      }
    },
    aigateway: {
      enabled: isServiceEnabled('AIGateway'),
      available: await checkServiceAvailability(Provider.aigateway),
      config: {
        baseURL: aigatewayConfig.baseURL,
        model: aigatewayConfig.model,
        chatModel: aigatewayConfig.chatModel,
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
    case Provider.openrouter:
      return await openrouterService.generateChatStructuredResponse(prompt, schema, model, temperature);
    case Provider.lmstudio:
      return await lmstudioService.generateChatStructuredResponse(prompt, schema, model, temperature);
    case Provider.aigateway:
      return await aigatewayService.generateChatStructuredResponse(prompt, schema, model, temperature);
    default:
      throw new Error(`Unsupported service: ${provider}`);
  }
}   

export async function processTextOutputRequest(
  prompt: string,
  config: z.infer<typeof llmRequestSchema>,  
): Promise<any> {
  const provider = config.provider;
  const model = config.model;
  const stream = config.stream || false;

  console.log('MODEL TO USE', model, 'STREAMING:', stream);

  // If streaming is enabled, use streaming functions
  if (stream) {
    return processTextOutputStreamRequest(prompt, config);
  }

  switch (provider) {
    case Provider.ollama:
      return await ollamaService.generateChatTextResponse(prompt, model); 
    case Provider.openai:
      return await openaiService.generateChatTextResponse(prompt, model);
    case Provider.anthropic:
      return await anthropicService.generateChatTextResponse(prompt, model);
    case Provider.openrouter:
      return await openrouterService.generateChatTextResponse(prompt, model);
    case Provider.lmstudio:
      return await lmstudioService.generateChatTextResponse(prompt, model);
    case Provider.aigateway:
      return await aigatewayService.generateChatTextResponse(prompt, model);
    default:
      throw new Error(`Unsupported service: ${provider}`);
  }
}

export async function processTextOutputStreamRequest(
  prompt: string,
  config: z.infer<typeof llmRequestSchema>,  
): Promise<any> {
  const provider = config.provider;
  const model = config.model;

  console.log('STREAMING MODEL TO USE', model);

  switch (provider) {
    case Provider.ollama:
      return await ollamaService.generateChatTextStreamResponse(prompt, model);
    case Provider.openai:
      return await openaiService.generateChatTextStreamResponse(prompt, model);
    case Provider.anthropic:
      return await anthropicService.generateChatTextStreamResponse(prompt, model);
    case Provider.openrouter:
      return await openrouterService.generateChatTextStreamResponse(prompt, model);
    case Provider.lmstudio:
      return await lmstudioService.generateChatTextStreamResponse(prompt, model);
    case Provider.aigateway:
      return await aigatewayService.generateChatTextStreamResponse(prompt, model);
    default:
      throw new Error(`Unsupported service: ${provider}`);
  }
}   
