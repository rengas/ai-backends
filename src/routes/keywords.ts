import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { processStructuredOutputRequest } from '../services/ai'   
import { keywordsPrompt } from '../utils/prompts'
import { handleError } from '../utils/errorHandler'
import { keywordsRequestSchema, keywordsResponseSchema, createKeywordsResponse } from '../schemas/keywords'

const router = new OpenAPIHono()

const responseSchema = z.object({
  keywords: z.array(z.string()).describe('List of keywords extracted from the text')  
})

/**
 * Handler for keywords extraction endpoint
 */
async function handleKeywordsRequest(c: Context) {
  try {
    const { payload, config } = await c.req.json()

    // Generate the prompt
    const prompt = keywordsPrompt(payload.text, payload.maxKeywords)
    const temperature = config.temperature || 0

    // Get response using our service
    const result = await processStructuredOutputRequest(
      prompt,
      responseSchema,
      config,
      temperature
    )

    console.log("KEYWORDS RESULT", result)
    const keywords = result.object.keywords;

    const finalResponse = createKeywordsResponse(
      keywords, 
      config.provider, 
      { 
        input_tokens: result.usage.promptTokens, 
        output_tokens: result.usage.completionTokens, 
        total_tokens: result.usage.totalTokens 
      }
    );

    return c.json(finalResponse, 200)
    
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
            schema: keywordsResponseSchema
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