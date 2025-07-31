import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { summarizePrompt } from '../utils/prompts'
import { handleError, handleValidationError } from '../utils/errorHandler'
import { summarizeRequestSchema, summarizeResponseSchema } from '../schemas/summarize'
import { createSummarizeResponse } from '../schemas/summarize'
import { processTextOutputRequest } from '../services/ai'

const router = new OpenAPIHono()

/**
 * Handler for text summarization endpoint
 */
async function handleSummarizeRequest(c: Context) {
  try {
    const { payload, config } = await c.req.json()

    console.log('CONFIG', config);

    const provider = config.provider;
    const model = config.model;
    // const temperature = config.temperature;

    // Generate the prompt
    const prompt = summarizePrompt(payload.text, payload.maxLength)

    // Get response using our service
    const result = await processTextOutputRequest(
      prompt,
      config,
    )

    const finalResponse = createSummarizeResponse(result.text, provider, model, {
      input_tokens: result.usage.promptTokens,
      output_tokens: result.usage.completionTokens,
      total_tokens: result.usage.totalTokens,
    })
  

    return c.json(finalResponse, 200)

  } catch (error) {
    return handleError(c, error, 'Failed to summarize text')
  }
} 

router.openapi(
  createRoute({
    path: '/',  // Changed from /summarize since we'll mount at /api/summarize
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
            schema: summarizeRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Returns the summarized text.',
        content: {
          'application/json': {
            schema: summarizeResponseSchema
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
  handleSummarizeRequest as any
)  

export default {
  handler: router,
  mountPath: 'summarize'  // This will be mounted at /api/summarize
}
