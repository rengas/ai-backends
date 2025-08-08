import { z } from 'zod'
import { llmRequestSchema } from './llm'

/**
 * Body sent by the client.
 */
export const payloadSchema = z.object({
  text: z.string().min(1, 'Email text must not be empty').describe('The email content to reply to'),
  tone: z
    .enum(['professional', 'friendly', 'concise', 'apologetic', 'persuasive'])
    .optional()
    .describe('Optional tone/style for the reply'),
  hint: z.string().optional().describe('Optional hint/instructions from the API caller to guide the reply'),
})

export const emailReplyRequestSchema = z.object({
  payload: payloadSchema,
  config: llmRequestSchema,
})

/**
 * Successful response returned to the client.
 */
export const emailReplyResponseSchema = z.object({
  reply: z.string(),
  provider: z.string().optional().describe('The AI service that was actually used'),
  model: z.string().optional().describe('The model that was actually used'),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    total_tokens: z.number(),
  }),
})

export function createEmailReplyResponse(
  reply: string,
  provider?: string,
  model?: string,
  usage = { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
) {
  return { reply, provider, model, usage }
}

export type EmailReplyReq = z.infer<typeof emailReplyRequestSchema>
export type EmailReplyRes = z.infer<typeof emailReplyResponseSchema>


