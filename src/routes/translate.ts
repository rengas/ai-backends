import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { generateResponse } from '../services/ai'
import { translatePrompt } from '../utils/prompts'
import { handleError, handleValidationError } from '../utils/errorHandler'
import { translateRequestSchema } from '../schemas/translate'

const router = new OpenAPIHono()

const responseSchema = z.object({
  translatedText: z.string().describe('Translated text in the target language'),
  service: z.string().optional().describe('The AI service that was actually used'),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    total_tokens: z.number(),
  }).optional()
})

/**
 * Handler for translation endpoint
 */
async function handleTranslateRequest(c: Context) {
  try {
    const { text, targetLanguage, service = 'auto', model } = await c.req.json()

    if (!text) {
      return handleValidationError(c, 'Text')
    }
    if (!targetLanguage) {
      return handleValidationError(c, 'Target language')
    }

    const prompt = translatePrompt(text, targetLanguage)

    // Use a simpler response schema for structured output
    const simpleResponseSchema = z.object({
      translatedText: z.string().describe('Translated text in the target language')
    })

    const { data, usage, service: usedService } = await generateResponse(
      prompt,
      simpleResponseSchema,
      service,
      model
    )

    return c.json({
      translatedText: data,
      service: usedService,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        total_tokens: usage.total_tokens,
      }
    }, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to translate text')
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
            schema: translateRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Returns the translated text.',
        content: {
          'application/json': {
            schema: responseSchema
          }
        }
      }
    }
  }),
  handleTranslateRequest as any
)

export default {
  handler: router,
  mountPath: 'translate' // Mounted at /api/translate
}
