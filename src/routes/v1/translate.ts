import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { translatePrompt } from '../../utils/prompts'
import { handleError } from '../../utils/errorHandler'
import { translateRequestSchema, translateResponseSchema } from '../../schemas/v1/translate'
import { processTextOutputRequest } from '../../services/ai'
import { createTranslateResponse } from '../../schemas/v1/translate'
import { apiVersion } from './versionConfig'
import { createFinalResponse } from './finalResponse'

const router = new OpenAPIHono()

async function handleTranslateRequest(c: Context) {
  try {
    const { payload, config } = await c.req.json()
    const provider = config.provider
    const model = config.model
    const prompt = translatePrompt(payload.text, payload.targetLanguage)
    const result = await processTextOutputRequest(prompt, config)
    const finalResponse = createTranslateResponse(result.text, provider, model, {
      input_tokens: result.usage.promptTokens,
      output_tokens: result.usage.completionTokens,
      total_tokens: result.usage.totalTokens,
    })
    const finalResponseWithVersion = createFinalResponse(finalResponse, apiVersion)
    return c.json(finalResponseWithVersion, 200)
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
    },
    summary: 'Translate text',
    description: 'This endpoint receives a text and uses an LLM to translate the text to the target language.',
    tags: ['API']
  }),
  handleTranslateRequest as any
)

export default {
  handler: router,
  mountPath: 'translate'
}


