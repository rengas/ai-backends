import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { generateResponse } from '../services/ai'
import { tweetPrompt } from '../utils/prompts'
import { handleError, handleValidationError } from '../utils/errorHandler'
import { tweetRequestSchema, tweetResponseSchema } from '../schemas/tweet'

const router = new OpenAPIHono()

const tweetSchema = z.object({
  content: z.string().describe('The tweet content')
})

/**
 * Handler for tweet creation endpoint
 */
async function handleTweetRequest(c: Context) {
  try {
    const { topic, service = 'auto', model } = await c.req.json()

    if (!topic) {
      return handleValidationError(c, 'Topic')
    }

    // Generate the prompt
    const prompt = tweetPrompt(topic)

    // Get response using our service
    const { data, usage, service: usedService } = await generateResponse(
      prompt,
      tweetSchema,
      service,
      model
    )

    return c.json({ 
      tweet: data,
      service: usedService,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        total_tokens: usage.total_tokens,
      }
    }, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to generate tweet')
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
            schema: tweetRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Returns the generated tweet.',
        content: {
          'application/json': {
            schema: tweetResponseSchema
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
    },
    tags: ['Tweet'], // Group in Swagger UI
  }), 
  handleTweetRequest as any
)  

export default {
  handler: router,
  mountPath: 'tweet'  // This will be mounted at /api/tweet
} 