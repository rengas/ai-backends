import { z } from 'zod';

/**
 * Sentiment request schema
 */
export const SentimentRequestSchema = z.object({
  text: z.string().min(1, 'Text must not be empty').max(10000, 'Text must not exceed 10,000 characters'),
  categories: z.array(z.string()).optional(),
});

/**
 * Sentiment response schema
 */
export const SentimentResponseSchema = z.object({
  sentiment: z.string(),
  confidence: z.number().min(0).max(1),
  emotions: z.array(
    z.object({
      emotion: z.string(),
      score: z.number(),
    })
  ),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
});

export type SentimentReq = z.infer<typeof SentimentRequestSchema>;
export type SentimentRes = z.infer<typeof SentimentResponseSchema>;

