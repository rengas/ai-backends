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
export function handleValidationError(c: Context, field: string) {
  return c.json({ error: `${field} is required` }, 400)
} 