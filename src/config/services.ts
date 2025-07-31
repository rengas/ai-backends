// Service configuration for AI backends

export interface ServiceConfig {
  name: string;
  enabled: boolean;
  priority: number; // Lower number = higher priority
}

export interface OpenAIConfig extends ServiceConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
}

export interface OllamaConfig extends ServiceConfig {
  baseURL: string;
  model: string;
  chatModel: string;
  timeout?: number;
}

export interface AnthropicConfig extends ServiceConfig {
  apiKey: string;
  model: string;
}

// OpenAI Configuration
export const openaiConfig: OpenAIConfig = {
  name: 'OpenAI',
  enabled: !!process.env.OPENAI_API_KEY,
  priority: 1,
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4.1-nano',
  baseURL: process.env.OPENAI_BASE_URL,
};

// Ollama Configuration
export const ollamaConfig: OllamaConfig = {
  name: 'Ollama',
  enabled: process.env.OLLAMA_ENABLED === 'true' || process.env.OLLAMA_BASE_URL !== undefined,
  priority: 3,
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.2:latest',
  chatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.2:latest',
  timeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000'),
};

// Anthropic Configuration
export const anthropicConfig: AnthropicConfig = {
  name: 'Anthropic',
  enabled: !!process.env.ANTHROPIC_API_KEY,
  priority: 2,
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
};

// Available services
export const availableServices = [openaiConfig, anthropicConfig, ollamaConfig];

// Get the primary service (highest priority enabled service)
export function getPrimaryService(): ServiceConfig | null {
  const enabledServices = availableServices
    .filter(service => service.enabled)
    .sort((a, b) => a.priority - b.priority);
  
  return enabledServices[0] || null;
}

// Get service by name
export function getServiceConfig(name: string): ServiceConfig | null {
  return availableServices.find(service => 
    service.name.toLowerCase() === name.toLowerCase()
  ) || null;
}

// Check if a service is available and enabled
export function isServiceEnabled(name: string): boolean {
  const service = getServiceConfig(name);
  return service ? service.enabled : false;
} 