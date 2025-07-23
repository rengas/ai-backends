import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { Context } from 'hono'
import { z } from 'zod'
import { generateResponse } from '../services/ai'
import { sentimentPrompt } from '../utils/prompts'
import { handleError, handleValidationError } from '../utils/errorHandler'
import { SentimentRequestSchema, SentimentResponseSchema } from '../schemas/sentiment'

const openAIResponseSchema = z.object({ 
  sentiment: z.string(), 
  confidence: z.number().min(0).max(1), 
  emotions: z.array(z.object({ 
    emotion: z.string(), 
    score: z.number().min(0).max(1) 
  })) 
})

const router = new OpenAPIHono()

/**
 * Handler for sentiment analysis endpoint
 */
async function handleSentimentRequest(c: Context) {
  try {
    const { text, categories, service = 'auto', model } = await c.req.json()
    
    if (!text) {
      return handleValidationError(c, 'Text')
    }

    // Generate the prompt
    const prompt = sentimentPrompt(text, categories)

    // Get response using our service
    const { data, usage, service: usedService } = await generateResponse(
      prompt,
      openAIResponseSchema,
      service,
      model
    )

    return c.json({ 
      sentiment: data,
      confidence: data.confidence,
      emotions: data.emotions,
      service: usedService,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        total_tokens: usage.total_tokens
      }
    }, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to analyze sentiment')
  }
}

router.openapi(
  createRoute({
    path: '/',
    method: 'post',
    request: {
      body: {
        content: {
          'application/json': {
            schema: SentimentRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Returns sentiment analysis results.',
        content: {
          'application/json': {
            schema: SentimentResponseSchema
          }
        }
      }
    }
  }), 
  handleSentimentRequest as any
)

export default {
  handler: router,
  mountPath: 'sentiment'
}

