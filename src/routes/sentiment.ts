import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { Context } from 'hono'
import { z } from 'zod'
import { sentimentPrompt } from '../utils/prompts'
import { handleError } from '../utils/errorHandler'
import { createSentimentResponse, sentimentRequestSchema, sentimentResponseSchema } from '../schemas/sentiment'
import { processStructuredOutputRequest } from '../services/ai'

const responseSchema = z.object({
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
    const { payload, config } = await c.req.json()

    // Generate the prompt
    const prompt = sentimentPrompt(payload.text)

    // Get response using our service
    const result = await processStructuredOutputRequest(
      prompt,
      responseSchema,
      config
    )

    const { sentiment, confidence, emotions } = result.object;
    const { usage } = result;

    const finalResponse = createSentimentResponse(
      sentiment,
      confidence,
      emotions,
      config.provider,
      config.model,  
      usage
    )

    return c.json(finalResponse, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to analyze sentiment')
  }
}

router.openapi(
  createRoute({
    path: '/',
    method: 'post',
    security: [
      {
        BearerAuth: []
      }
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: sentimentRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Returns sentiment analysis results.',
        content: {
          'application/json': {
            schema: sentimentResponseSchema
          }
        }
      },
      401: {
        description: 'Unauthorized - Bearer token required',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
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

