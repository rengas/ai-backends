import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { Context } from 'hono'
import { describeImage } from '../services/ollama'
import { handleError } from '../utils/errorHandler'
import { describeImageRequestSchema, describeImageResponseSchema, describeImageErrorSchema } from '../schemas/describeImage'

const router = new OpenAPIHono()

/**
 * Handler for image description endpoint
 */
async function handleDescribeImageRequest(c: Context) {
  try {
    const { model, stream = false, images, temperature } = await c.req.json()
    
    // Get response using Ollama vision service
    const response = await describeImage(images, model, stream, temperature)

    return c.json(response, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to describe image')
  }
}

router.openapi(
  createRoute({
    path: '/',
    method: 'post',
    security: [
      {
        BearerAuth: []
      }
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: describeImageRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Returns the image description.',
        content: {
          'application/json': {
            schema: describeImageResponseSchema
          }
        }
      },
      400: {
        description: 'Bad Request - Invalid input, missing images, unsupported service, or unsupported model',
        content: {
          'application/json': {
            schema: describeImageErrorSchema
          }
        }
      },
      401: {
        description: 'Unauthorized - Bearer token required',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }),
  handleDescribeImageRequest as any
)

export default {
  handler: router,
  mountPath: 'describe-image'
}