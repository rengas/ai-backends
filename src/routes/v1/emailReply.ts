import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import { emailReplyPrompt } from '../../utils/prompts'
import { handleError } from '../../utils/errorHandler'
import { emailReplyRequestSchema, emailReplyResponseSchema, createEmailReplyResponse } from '../../schemas/v1/emailReply'
import { processTextOutputRequest } from '../../services/ai'
import { apiVersion } from './versionConfig'
import { createFinalResponse } from './finalResponse'

const router = new OpenAPIHono()

async function handleEmailReplyRequest(c: Context) {
  try {
    const { payload, config } = await c.req.json()
    const provider = config.provider
    const model = config.model
    const isStreaming = config.stream || false
    const prompt = emailReplyPrompt(
      payload.text,
      payload.customInstruction,
      payload.senderName,
      payload.recipientName
    )
    
    // Handle streaming response
    if (isStreaming) {
      const result = await processTextOutputRequest(prompt, config)
      
      // Set SSE headers
      c.header('Content-Type', 'text/event-stream')
      c.header('Cache-Control', 'no-cache')
      c.header('Connection', 'keep-alive')
      
      return streamSSE(c, async (stream) => {
        try {
          const textStream = result.textStream
          
          if (!textStream) {
            throw new Error('Streaming not supported for this provider/model')
          }
          
          // Stream chunks to the client
          for await (const chunk of textStream) {
            await stream.writeSSE({
              data: JSON.stringify({
                chunk: chunk,
                provider: provider,
                model: model,
                version: apiVersion
              })
            })
          }
          
          // Send final message with usage stats if available
          const usage = await result.usage
          if (usage) {
            await stream.writeSSE({
              data: JSON.stringify({
                done: true,
                usage: {
                  input_tokens: usage.promptTokens,
                  output_tokens: usage.completionTokens,
                  total_tokens: usage.totalTokens
                },
                provider: provider,
                model: model,
                version: apiVersion
              })
            })
          }
        } catch (error) {
          await stream.writeSSE({
            data: JSON.stringify({
              error: error instanceof Error ? error.message : 'Streaming error',
              done: true
            })
          })
        } finally {
          await stream.close()
        }
      })
    }
    
    // Handle non-streaming response (existing logic)
    const result = await processTextOutputRequest(prompt, config)
    const finalResponse = createEmailReplyResponse(result.text, provider, model, {
      input_tokens: result.usage.promptTokens,
      output_tokens: result.usage.completionTokens,
      total_tokens: result.usage.totalTokens,
    })
    const finalResponseWithVersion = createFinalResponse(finalResponse, apiVersion)
    return c.json(finalResponseWithVersion, 200)
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
    summary: 'Generate an email reply',
    description: 'This endpoint receives an email text and uses an LLM to generate a reply to the email.',
    tags: ['API']
  }),
  handleEmailReplyRequest as any
)

export default {
  handler: router,
  mountPath: 'email-reply',
}


