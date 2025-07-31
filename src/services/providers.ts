import { z } from 'zod'

export const providersSupported = z.enum(['ollama', 'openai', 'anthropic'])