import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { generateResponse } from '../services/ai'
import { summarizePrompt } from '../utils/prompts'
import { handleError, handleValidationError } from '../utils/errorHandler'
import { summarizeRequestSchema } from '../schemas/summarize'

const router = new OpenAPIHono()

const responseSchema = z.object({
  summary: z.string().describe('The summary of the text').min(1, 'Summary is required')
})

// Define the schema and handler for the summarize route
/**
 * Handler for text summarization endpoint
 */
async function handleSummarizeRequest(c: Context) {
  try {
    const { text, maxLength, service = 'auto', model } = await c.req.json()

    if (!text) {
      return handleValidationError(c, 'Text')
    }

    // Generate the prompt
    const prompt = summarizePrompt(text, maxLength)

    // Get response using our service
    const { data, usage, service: usedService } = await generateResponse(
      prompt,
      responseSchema,
      service,
      model
    )

    return c.json({ 
      summary: data,
      service: usedService,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        total_tokens: usage.total_tokens,
      }
    }, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to summarize text')
  }
} 

router.openapi(
  createRoute({
    path: '/',  // Changed from /summarize since we'll mount at /api/summarize
    method: 'post',
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
            schema: responseSchema
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
