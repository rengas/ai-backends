import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { generateResponse } from '../services/ai'
import { keywordsPrompt } from '../utils/prompts'
import { handleError, handleValidationError } from '../utils/errorHandler'
import { keywordsRequestSchema } from '../schemas/keywords'

const router = new OpenAPIHono()

const responseSchema = z.object({
  keywords: z.array(z.string()).describe('List of keywords extracted from the text')  
})

/**
 * Handler for keywords extraction endpoint
 */
async function handleKeywordsRequest(c: Context) {
  try {
    const { text, maxKeywords, service = 'auto', model } = await c.req.json()

    if (!text) {
      return handleValidationError(c, 'Text')
    }

    // Generate the prompt
    const prompt = keywordsPrompt(text, maxKeywords)

    // Get response using our service
    const { data, usage, service: usedService } = await generateResponse(
      prompt,
      responseSchema,
      service,
      model
    )

    console.log("KEYWORDS DATA", data)

    return c.json({ 
      keywords: data,
      service: usedService,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        total_tokens: usage.total_tokens,
      }
    }, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to extract keywords from text')
  }
} 

router.openapi(
  createRoute({
    path: '/',  // Changed from /keywords since we'll mount at /api/keywords
    method: 'post',
    request: {
      body: {
        content: {
          'application/json': {
            schema: keywordsRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Returns the extracted keywords.',
        content: {
          'application/json': {
            schema: responseSchema
          }
        }
      }
    }
  }), 
  handleKeywordsRequest as any
)  

export default {
  handler: router,
  mountPath: 'keywords'  // This will be mounted at /api/keywords
} 