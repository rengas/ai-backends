import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { generateResponse } from '../services/openai'
import { summarizePrompt } from '../utils/prompts'
import { handleError, handleValidationError } from '../utils/errorHandler'
import { summarizeRequestSchema } from '../schemas/summarize'

const app = new OpenAPIHono()

const responseSchema = z.object({
  summary: z.string().describe('The summary of the text')  
})

// Define the schema and handler for the summarize route
/**
 * Handler for text summarization endpoint
 */
async function handleSummarizeRequest(c: Context) {
  try {
    const { text, maxLength } = await c.req.json()

    if (!text) {
      return handleValidationError(c, 'Text')
    }

    // Generate the prompt
    const prompt = summarizePrompt(text, maxLength)

    // Get response using our service
    const { data, usage } = await generateResponse(
      prompt,
      responseSchema
    )

    return c.json({ 
      summary: data.summary,
      usage
    }, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to summarize text')
  }
} 

app.openapi(
  createRoute({
    path: '/summarize',
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

export default app
