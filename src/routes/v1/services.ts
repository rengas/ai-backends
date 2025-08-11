import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { getServiceStatus, getAvailableModels, checkServiceAvailability } from '../../services/ai'
import { handleError } from '../../utils/errorHandler'

const router = new OpenAPIHono()

const serviceStatusSchema = z.object({
  services: z.object({
    openai: z.object({
      enabled: z.boolean(),
      available: z.boolean(),
      config: z.object({
        model: z.string(),
        hasApiKey: z.boolean(),
      })
    }),
    ollama: z.object({
      enabled: z.boolean(),
      available: z.boolean(),
      config: z.object({
        baseURL: z.string(),
        model: z.string(),
        chatModel: z.string(),
      })
    })
  }),
  primary: z.string().nullable(),
  anyAvailable: z.boolean()
})

const modelsSchema = z.object({
  service: z.string(),
  models: z.array(z.string()),
  available: z.boolean()
})

async function handleServiceStatus(c: Context) {
  try {
    const status = await getServiceStatus()
    return c.json(status, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to get service status')
  }
}

async function handleGetModels(c: Context) {
  try {
    const service = c.req.query('service') || 'auto'
    if (service === 'auto') {
      const results = await Promise.allSettled([
        getAvailableModels('openai'),
        getAvailableModels('ollama'),
        getAvailableModels('openrouter'),
        getAvailableModels('anthropic')
      ])
      const response = {
        openai: {
          service: 'openai',
          models: results[0].status === 'fulfilled' ? results[0].value : [],
          available: await checkServiceAvailability('openai')
        },
        ollama: {
          service: 'ollama',
          models: results[1].status === 'fulfilled' ? results[1].value : [],
          available: await checkServiceAvailability('ollama')
        },
        anthropic: {
          service: 'anthropic',
          models: [],
          available: await checkServiceAvailability('anthropic')
        }
      }
      return c.json(response, 200)
    } else {
      const models = await getAvailableModels(service as any)
      const available = await checkServiceAvailability(service as any)
      return c.json({
        service,
        models,
        available
      }, 200)
    }
  } catch (error) {
    return handleError(c, error, 'Failed to get available models')
  }
}

async function handleServiceHealth(c: Context) {
  try {
    const service = c.req.param('service')
    if (!service || !['openai', 'ollama', 'anthropic'].includes(service)) {
      return c.json({ error: 'Invalid service. Must be openai or ollama' }, 400)
    }
    const available = await checkServiceAvailability(service as any)
    return c.json({
      service,
      available,
      timestamp: new Date().toISOString()
    }, 200)
  } catch (error) {
    return handleError(c, error, 'Failed to check service health')
  }
}

router.openapi(
  createRoute({
    path: '/status',
    method: 'get',
    responses: {
      200: {
        description: 'Returns status of all AI services',
        content: { 'application/json': { schema: serviceStatusSchema } }
      }
    }
  }),
  handleServiceStatus as any
)

router.openapi(
  createRoute({
    path: '/models',
    method: 'get',
    request: {
      query: z.object({
        service: z.string().optional().openapi({
          description: 'Service to get models for (openai, ollama, or auto for all)',
          example: 'auto'
        })
      })
    },
    responses: {
      200: {
        description: 'Returns available models for the specified service(s)',
        content: {
          'application/json': {
            schema: z.union([
              modelsSchema,
              z.object({
                openai: modelsSchema,
                ollama: modelsSchema
              })
            ])
          }
        }
      }
    }
  }),
  handleGetModels as any
)

router.openapi(
  createRoute({
    path: '/health/{service}',
    method: 'get',
    request: {
      params: z.object({
        service: z.string().openapi({
          description: 'Service to check health for',
          example: 'ollama'
        })
      })
    },
    responses: {
      200: {
        description: 'Returns health status of the specified service',
        content: {
          'application/json': {
            schema: z.object({
              service: z.string(),
              available: z.boolean(),
              timestamp: z.string()
            })
          }
        }
      }
    }
  }),
  handleServiceHealth as any
)

export default {
  handler: router,
  mountPath: 'services'
}


