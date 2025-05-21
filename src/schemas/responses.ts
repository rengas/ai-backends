import { z } from '@hono/zod-openapi'

// Common usage schema
const usageSchema = z.object({
  input_tokens: z.number(),
  input_tokens_details: z.object({
    cached_tokens: z.number()
  }),
  output_tokens: z.number(),
  output_tokens_details: z.object({
    reasoning_tokens: z.number()
  }),
  total_tokens: z.number()
})

export const errorResponseSchema = z.object({
  error: z.string(),
  error_code: z.string()
})

export const summaryResponseSchema = z.object({
  summary: z.string(),
  usage: usageSchema
})