import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { generateResponse } from '../services/openai'
import { keywordsPrompt } from '../utils/prompts'
import { handleError, handleValidationError } from '../utils/errorHandler'
import { keywordsRequestSchema } from '../schemas/keywords'

const app = new OpenAPIHono()

const responseSchema = z.object({
  keywords: z.array(z.string()).describe('List of keywords extracted from the text')  
})

/**
 * Handler for keywords extraction endpoint
 */
async function handleKeywordsRequest(c: Context) {
  try {
    const { text, maxKeywords } = await c.req.json()

    if (!text) {
      return handleValidationError(c, 'Text')
    }

    // Generate the prompt
    const prompt = keywordsPrompt(text, maxKeywords)

    // Get response using our service
    const { data, usage } = await generateResponse(
      prompt,
      responseSchema
    )

    return c.json({ 
      keywords: data.keywords,
      usage
    }, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to extract keywords from text')
  }
} 

app.openapi(
  createRoute({
    path: '/keywords',
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

export default app 