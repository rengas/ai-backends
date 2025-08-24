import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import { plannerPrompt } from '../../utils/prompts'
import { handleError } from '../../utils/errorHandler'
import { 
  plannerRequestSchema, 
  plannerResponseSchema,
  createPlannerResponse 
} from '../../schemas/v1/planner'
import { processTextOutputRequest } from '../../services/ai'
import { apiVersion } from './versionConfig'
import { createFinalResponse } from './finalResponse'

const router = new OpenAPIHono()

/**
 * Handler for planner requests
 * Receives a task and generates a text-based plan to accomplish it
 * Supports both streaming and non-streaming responses
 */
async function handlePlannerRequest(c: Context) {
  try {
    const startTime = Date.now()
    const { payload, config } = await c.req.json()
    const provider = config.provider
    const model = config.model
    const isStreaming = config.stream || false
    
    // Extract parameters from payload
    const {
      task,
      context,
      maxSteps,
      detailLevel,
      includeTimeEstimates,
      includeRisks,
      domain
    } = payload
    
    // Create prompt for plan generation
    const prompt = plannerPrompt(
      task,
      context,
      maxSteps,
      detailLevel,
      includeTimeEstimates,
      includeRisks,
      domain
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
          // Get the text stream from the result
          const textStream = result.textStream
          
          if (!textStream) {
            throw new Error('Streaming not supported for this provider/model')
          }
          
          // Send metadata at the beginning
          await stream.writeSSE({
            data: JSON.stringify({
              metadata: {
                provider: provider,
                model: model,
                version: apiVersion
              }
            })
          })
          
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
                metadata: {
                  provider: provider,
                  model: model,
                  processingTime: Date.now() - startTime
                },
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
    const result = await processTextOutputRequest(
      prompt,
      config
    )
    
    // Calculate processing time
    const processingTime = Date.now() - startTime
    
    // Create response with plan text and metadata
    const finalResponse = createPlannerResponse(
      result.text, 
      provider, 
      model, 
      {
        input_tokens: result.usage?.promptTokens || 0,
        output_tokens: result.usage?.completionTokens || 0,
        total_tokens: result.usage?.totalTokens || 0,
      },
      processingTime
    )
    
    // Add API version to response
    const finalResponseWithVersion = createFinalResponse(finalResponse, apiVersion)
    
    return c.json(finalResponseWithVersion, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to generate plan')
  }
}

// Define OpenAPI route
router.openapi(
  createRoute({
    path: '/',
    method: 'post',
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: plannerRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Returns a structured plan to accomplish the given task.',
        content: {
          'application/json': {
            schema: plannerResponseSchema
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
      },
      400: {
        description: 'Bad Request - Invalid input',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      500: {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      }
    },
    summary: 'Generate structured plans for tasks',
    description: 'This endpoint receives a task description and generates a detailed, structured plan with steps, dependencies, time estimates, and success criteria.',
    tags: ['API']
  }),
  handlePlannerRequest as any
)

export default {
  handler: router,
  mountPath: 'project-planner'
}


