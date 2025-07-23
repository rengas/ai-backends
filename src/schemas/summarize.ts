import { z } from 'zod'

/**
 * Body sent by the client.
 */
export const summarizeRequestSchema = z.object({
  text: z.string().min(1, 'Text must not be empty'),
  maxLength: z.number().int().positive().optional(),
  service: z.enum(['openai', 'ollama', 'auto']).optional().describe('AI service to use (defaults to auto)'),
  model: z.string().optional().describe('Specific model to use (optional)'),
})

/**
 * Successful response returned to the client.
 */
export const summarizeResponseSchema = z.object({
  summary: z.string(),
  service: z.string().optional().describe('The AI service that was actually used'),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    total_tokens: z.number(),
  }),
})

export type SummarizeReq = z.infer<typeof summarizeRequestSchema>
export type SummarizeRes = z.infer<typeof summarizeResponseSchema>