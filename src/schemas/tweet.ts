import { z } from 'zod'

/**
 * Body sent by the client for tweet creation.
 */
export const tweetRequestSchema = z.object({
  topic: z.string().min(1, 'Topic must not be empty').describe('The topic or subject for the tweet'),
  service: z.enum(['auto', 'ollama', 'openai' ]).optional().describe('AI service to use (defaults to auto)'),
  model: z.string().optional().describe('Specific model to use (optional)'),
})

/**
 * Successful response returned to the client for tweet creation.
 */
export const tweetResponseSchema = z.object({
  tweet: z.string().describe('The generated tweet content'),
  characterCount: z.number().describe('Number of characters in the tweet'),
  author: z.string().describe('The author signature of the tweet'),
  service: z.string().optional().describe('The AI service that was actually used'),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    total_tokens: z.number(),
  }).optional(),
})

export type TweetReq = z.infer<typeof tweetRequestSchema>
export type TweetRes = z.infer<typeof tweetResponseSchema> 