import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const router = new OpenAPIHono();

const responseSchema = z.object({
  status: z.string().openapi({ example: "ok" }),
  message: z.string().openapi({ example: "Service is healthy" })
}).openapi("HealthcheckResponse");

const healthCheckRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      description: "Returns the health status of the service.",
      content: {
        "application/json": {
          schema: responseSchema,
        },
      },
    },
  },
  tags: ["Health"], // Optional: to group it in Swagger UI
});

router.openapi(healthCheckRoute, (c) => {
  return c.json({
    status: "ok",
    message: "Service is healthy"
  }, 200);
});

export default {
  handler: router,
  mountPath: 'hello' // This will be mounted at /api/hello
}; 