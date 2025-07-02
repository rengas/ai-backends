import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { generateResponse } from '../services/openai'
import { translatePrompt } from '../utils/prompts'
import { handleError, handleValidationError } from '../utils/errorHandler'
import { translateRequestSchema } from '../schemas/translate'

const router = new OpenAPIHono()

const responseSchema = z.object({
  translatedText: z.string().describe('Translated text in the target language')
})

/**
 * Handler for translation endpoint
 */
async function handleTranslateRequest(c: Context) {
  try {
    const { text, targetLanguage } = await c.req.json()

    if (!text) {
      return handleValidationError(c, 'Text')
    }
    if (!targetLanguage) {
      return handleValidationError(c, 'Target language')
    }

    const prompt = translatePrompt(text, targetLanguage)

    const { data, usage } = await generateResponse(
      prompt,
      responseSchema
    )

    return c.json({
      translatedText: data.translatedText,
      usage
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
