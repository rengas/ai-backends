import { Context } from 'hono'

/**
 * Handle API errors consistently
 */
export function handleError(c: Context, error: unknown, message = 'Internal server error') {
  console.error(`Error: ${message}`, error)
  return c.json({ error: message }, 500)
}

/**
 * Handle validation errors for required fields
 */
export function handleValidationError(c: Context, field: string, customMessage?: string) {
  const message = customMessage || `${field} is required`
  return c.json({ error: message }, 400)
}
