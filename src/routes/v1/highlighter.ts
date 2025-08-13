import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Context } from 'hono'
import { processStructuredOutputRequest } from '../../services/ai'
import { highlighterPrompt } from '../../utils/prompts'
import { handleError } from '../../utils/errorHandler'
import { apiVersion } from './versionConfig'
import { createFinalResponse } from './finalResponse'
import { 
	highlighterRequestSchema, 
	highlighterResponseSchema, 
	createHighlighterResponse,
	highlightSpanSchema
} from '../../schemas/v1/highlighter'

const router = new OpenAPIHono()

const responseSchema = z.object({
	highlights: z.array(highlightSpanSchema)
})

async function handleHighlighterRequest(c: Context) {
	try {
		const { payload, config } = await c.req.json()
		const prompt = highlighterPrompt(payload.text, payload.maxHighlights)
		const temperature = payload.temperature ?? config.temperature ?? 0
		const result = await processStructuredOutputRequest(
			prompt,
			responseSchema,
			{ ...config, temperature },
			temperature
		)
		const highlights = result.object.highlights
		const finalResponse = createHighlighterResponse(
			highlights,
			config.provider,
			config.model,
			{
				input_tokens: result.usage.promptTokens,
				output_tokens: result.usage.completionTokens,
				total_tokens: result.usage.totalTokens
			}
		)
		const finalResponseWithVersion = createFinalResponse(finalResponse, apiVersion)
		return c.json(finalResponseWithVersion, 200)
	} catch (error) {
		return handleError(c, error, 'Failed to generate highlights')
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
						schema: highlighterRequestSchema
					}
				}
			}
		},
		responses: {
			200: {
				description: 'Returns highlight spans with labels and descriptions for key parts of the text.',
				content: {
					'application/json': {
						schema: highlighterResponseSchema
					}
				}
			}
		}
	}),
	handleHighlighterRequest as any
)

export default {
	handler: router,
	mountPath: 'highlighter'
}
