import { swaggerUI } from "@hono/swagger-ui"
import { OpenAPIHono } from "@hono/zod-openapi"

function configureApiDocs(app: OpenAPIHono) {
    // The OpenAPI documentation will be available at /doc
    app.doc('/api/docs', {
        openapi: '3.1.0',
        info: {
            title: 'AI Backend',
            version: 'v1.0.0',
            description: 'Making common AI use cases easily accessible and customizable. Skip the heavy lifting of understanding OpenAI or other providers with our open source stack.'
        },
    })

    // The Swagger UI will be available at /ui
    app.get('/api/playground', swaggerUI({ url: '/api/docs' }))
}

export default configureApiDocs
