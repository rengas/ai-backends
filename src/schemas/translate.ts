import { z } from 'zod'

export const translateRequestSchema = z.object({
  text: z.string().describe('Text to translate'),
  targetLanguage: z.string().describe('Target language code, e.g. "fr", "es", "zh"'),
  service: z.enum(['openai', 'ollama', 'auto']).optional().describe('AI service to use (defaults to auto)'),
  model: z.string().optional().describe('Specific model to use (optional)'),
})
