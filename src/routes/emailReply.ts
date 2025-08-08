import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { emailReplyPrompt } from '../utils/prompts'
import { handleError } from '../utils/errorHandler'
import { emailReplyRequestSchema, emailReplyResponseSchema, createEmailReplyResponse } from '../schemas/emailReply'
import { processTextOutputRequest } from '../services/ai'

const router = new OpenAPIHono()

/**
 * Handler for email reply generation endpoint
 */
async function handleEmailReplyRequest(c: Context) {
  try {
    const { payload, config } = await c.req.json()

    const provider = config.provider
    const model = config.model

    const prompt = emailReplyPrompt(payload.text, payload.tone, payload.hint)

    const result = await processTextOutputRequest(prompt, config)

    const finalResponse = createEmailReplyResponse(result.text, provider, model, {
      input_tokens: result.usage.promptTokens,
      output_tokens: result.usage.completionTokens,
      total_tokens: result.usage.totalTokens,
    })

    return c.json(finalResponse, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to generate email reply')
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
            schema: emailReplyRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Returns an email reply to the provided email text.',
        content: {
          'application/json': {
            schema: emailReplyResponseSchema,
          },
        },
      },
    },
  }),
  handleEmailReplyRequest as any
)

export default {
  handler: router,
  mountPath: 'emailReply', // Mounted at /api/emailReply
}


