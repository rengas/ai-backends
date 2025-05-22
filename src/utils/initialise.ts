import { OpenAPIHono } from '@hono/zod-openapi'
import { bearerAuth } from 'hono/bearer-auth'
import { secureHeaders } from 'hono/secure-headers'

function initialise(): OpenAPIHono {

    const openaApiHono = new OpenAPIHono()

    let token: string | undefined = undefined;
    try {
        token = configureToken();
    } catch (error) {
        console.error('DEFAULT_ACCESS_TOKEN is not set')
        process.exit(1);
    }

    configureApiSecurity(openaApiHono, token);

    return openaApiHono
}

function configureToken(): string {
    const token: string | undefined = process.env.DEFAULT_ACCESS_TOKEN;
    if (!token) {
        throw new Error('DEFAULT_ACCESS_TOKEN is not set')
    }
    return token;
}

function configureApiSecurity(app: OpenAPIHono, token: string) {

    const devMode = process.env.NODE_ENV === 'development'
    console.log('process.env.NODE_ENV', process.env.NODE_ENV)
    console.log('devMode', devMode)

    //if (!devMode) {
        app.use(secureHeaders())

        app.use('/*', async (c, next) => {
            const path = c.req.path;
            // Allow public access to /doc and /ui
            if (path === '/' || path === '/api/doc' || path === '/api/ui') {
                await next();
                return;
            }
            return bearerAuth({ token })(c, next);
        })

        // API Key Middleware
        // We should also document this security scheme
        app.openAPIRegistry.registerComponent(
            'securitySchemes',
            'ApiKeyAuth',
            {
                type: 'apiKey',
                name: 'x-api-key',
                in: 'header',
            }
        );
    //}

}        

export default initialise