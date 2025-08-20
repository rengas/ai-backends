import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import { summarizePrompt } from '../../utils/prompts'
import { handleError, handleValidationError } from '../../utils/errorHandler'
import { summarizeRequestSchema, summarizeResponseSchema } from '../../schemas/v1/summarize'
import { createSummarizeResponse } from '../../schemas/v1/summarize'
import { processTextOutputRequest } from '../../services/ai'
import { apiVersion } from './versionConfig'
import { createFinalResponse } from './finalResponse'

const router = new OpenAPIHono()

async function handleSummarizeRequest(c: Context) {
  try {
    const { payload, config } = await c.req.json()
    const provider = config.provider
    const model = config.model
    const isStreaming = config.stream || false
    const prompt = summarizePrompt(payload.text, payload.maxLength)
    
    // Handle streaming response
    if (isStreaming) {
      const result = await processTextOutputRequest(prompt, config)
      
      // Set SSE headers
      c.header('Content-Type', 'text/event-stream')
      c.header('Cache-Control', 'no-cache')
      c.header('Connection', 'keep-alive')
      c.header('Access-Control-Allow-Origin', '*')
      c.header('Access-Control-Allow-Headers', 'Cache-Control')
      
      return streamSSE(c, async (stream) => {
        try {
          // Get the text stream from the result
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
          console.error('Streaming error:', error)
          try {
            await stream.writeSSE({
              data: JSON.stringify({
                error: error instanceof Error ? error.message : 'Streaming error',
                done: true
              })
            })
          } catch (writeError) {
            console.error('Error writing error message to stream:', writeError)
          }
        } finally {
          try {
            await stream.close()
          } catch (closeError) {
            console.error('Error closing stream:', closeError)
          }
        }
      })
    }
    
    // Handle non-streaming response (existing logic)
    const result = await processTextOutputRequest(prompt, config)
    const finalResponse = createSummarizeResponse(result.text, provider, model, {
      input_tokens: result.usage.promptTokens,
      output_tokens: result.usage.completionTokens,
      total_tokens: result.usage.totalTokens,
    })

    const finalResponseWithVersion = createFinalResponse(finalResponse, apiVersion)

    return c.json(finalResponseWithVersion, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to summarize text')
  }
}

router.openapi(
  createRoute({
    path: '/',
    method: 'post',
    security: [ { BearerAuth: [] } ],
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
            schema: summarizeResponseSchema
          }
        }
      },
      401: {
        description: 'Unauthorized - Bearer token required',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      }
    },
    summary: 'Summarize text',
    description: 'This endpoint receives a text and uses an LLM to summarize the text.',
    tags: ['API']
  }),
  handleSummarizeRequest as any
)

export default {
  handler: router,
  mountPath: 'summarize'
}


