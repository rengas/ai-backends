import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { translatePrompt } from '../utils/prompts'
import { handleError } from '../utils/errorHandler'
import { translateRequestSchema, translateResponseSchema } from '../schemas/translate'
import { processTextOutputRequest } from '../services/ai'
import { createTranslateResponse } from '../schemas/translate'

const router = new OpenAPIHono()

/**
 * Handler for translation endpoint
 */
async function handleTranslateRequest(c: Context) {
  try {
    const { payload, config } = await c.req.json()

    console.log('CONFIG', config);

    const provider = config.provider;
    const model = config.model;
    // const temperature = config.temperature;

    const prompt = translatePrompt(payload.text, payload.targetLanguage)

    const result = await processTextOutputRequest(
      prompt,
      config,
    )

    const finalResponse = createTranslateResponse(result.text, provider, model, {
      input_tokens: result.usage.promptTokens,
      output_tokens: result.usage.completionTokens,
      total_tokens: result.usage.totalTokens,
    })
  
    return c.json(finalResponse, 200)

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
            schema: translateResponseSchema
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
