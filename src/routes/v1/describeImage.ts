import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { Context } from 'hono'
import { generateImageResponse } from '../../services/ai'
import { handleError, handleValidationError } from '../../utils/errorHandler'
import { describeImageRequestSchema, describeImageResponseSchema, describeImageErrorSchema } from '../../schemas/v1/describeImage'

const router = new OpenAPIHono()

async function handleDescribeImageRequest(c: Context) {
  try {
    const { images, service, model, stream = false, temperature = 0.3 } = await c.req.json()
    if (!images || !Array.isArray(images) || images.length === 0) {
      return handleValidationError(c, 'Images are required and must be a non-empty array')
    }
    const response = await generateImageResponse(images, service, model, stream, temperature)
    return c.json(response, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to describe image')
  }
}

router.openapi(
  createRoute({
    path: '/',
    method: 'post',
    security: [ { BearerAuth: [] } ],
    request: {
      body: {
        content: { 'application/json': { schema: describeImageRequestSchema } }
      }
    },
    responses: {
      200: { description: 'Returns the image description.', content: { 'application/json': { schema: describeImageResponseSchema } } },
      400: { description: 'Bad Request - Invalid input, missing images, unsupported service, or unsupported model', content: { 'application/json': { schema: describeImageErrorSchema } } },
      401: { description: 'Unauthorized - Bearer token required', content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } } }
    }
  }),
  handleDescribeImageRequest as any
)

export default {
  handler: router,
  mountPath: 'describe-image'
}


