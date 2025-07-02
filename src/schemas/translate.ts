import { z } from 'zod'

export const translateRequestSchema = z.object({
  text: z.string().describe('Text to translate'),
  targetLanguage: z.string().describe('Target language code, e.g. "fr", "es", "zh"')
})
