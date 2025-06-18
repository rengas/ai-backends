import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { Context } from 'hono'
import { z } from 'zod'
import { generateResponse } from '../services/openai'
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
    const body = await c.req.json()
    
    // Validate text field
    if (!body.text) {
      return handleValidationError(c, 'Text')
    }
    
    if (typeof body.text !== 'string') {
      return handleValidationError(c, 'Text', 'Text must be a string')
    }
    
    if (body.text.trim().length === 0) {
      return handleValidationError(c, 'Text', 'Text must not be empty')
    }
    
    if (body.text.length > 10000) {
      return handleValidationError(c, 'Text', 'Text must not exceed 10,000 characters')
    }

    const { text, categories } = body

    // Generate the prompt
    const prompt = sentimentPrompt(text, categories)

    try {
      // Get response using our service
      const { data, usage } = await generateResponse(
        prompt,
        openAIResponseSchema
      )

      return c.json({ 
        sentiment: data.sentiment,
        confidence: data.confidence,
        emotions: data.emotions,
        usage: {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.total_tokens
        }
      }, 200)
    } catch (err) {
      return handleError(c, err, 'Failed to analyze sentiment')
    }
  } catch (error) {
    return handleError(c, error, 'Failed to process request')
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

