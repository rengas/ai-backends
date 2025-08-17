
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type {ProviderConfig} from "./providers/types";
import {bearerAuth} from "hono/bearer-auth";
import configureRoutes from "./utils/apiRoutes";
import configureApiDocs from "./utils/apiDocs";
import {checkOllamaAvailability} from "./providers/ollama";
import {checkLLMStudioAvailability} from "./providers/llmstudio";


function configureApiSecurity(app: OpenAPIHono, tokenConfig: string) {
    const devMode = process.env.NODE_ENV === 'development'
    console.log('process.env.NODE_ENV', process.env.NODE_ENV)
    console.log('devMode', devMode)

    if (!devMode) {
        app.use(secureHeaders())

        app.use('/*', async (c, next) => {
            const path = c.req.path;
            // Allow public access to specific paths
            if (
                path === '/' ||
                path === '/api/doc' ||
                path === '/api/ui' ||
                path === '/api/redoc' ||
                path === '/api/hello' ||
                // Public demo and tools pages
                path === '/api/demos' ||
                path === '/api/highlighter-demo' ||
                path === '/api/summarize-demo' ||
                path === '/api/sentiment-demo' ||
                path === '/api/keywords-demo' ||
                path === '/api/email-reply-demo' ||
                path === '/api/translate-demo' ||
                path === '/api/models' ||
                path === '/api/jsoneditor'
            ) {
                await next();
                return;
            }

            try {
                const config = JSON.parse(tokenConfig) as ProviderConfig;
                // Skip bearer auth for local LLM providers
                if (config.type === 'ollama' || config.type === 'llmstudio') {
                    await next();
                    return;
                }
            } catch (e) {
                // If tokenConfig is not JSON, treat it as a regular token
            }

            return bearerAuth({ token: tokenConfig })(c, next);
        })

        app.openAPIRegistry.registerComponent(
            'securitySchemes',
            'BearerAuth',
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        );
    }
}

function configureCors() {
    const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
    const defaultOrigins = [
        'http://localhost',
        'http://127.0.0.1',
        'https://localhost',
        'https://127.0.0.1',
    ];

    const allowedOrigins = envOrigins
        ? envOrigins.split(',').map((o) => o.trim()).filter((o) => o.length > 0)
        : defaultOrigins;

    return (origin: string | undefined): string | null => {
        if (!origin) {
            return null;
        }

        for (const o of allowedOrigins) {
            if (o === '*') {
                return origin;
            }

            const escaped = o.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
            const regex = new RegExp('^' + escaped + '$');
            if (regex.test(origin)) {
                return origin;
            }
        }

        return null;
    };
}

export async function configureToken(): Promise<string> {
    const token: string | undefined = process.env.DEFAULT_ACCESS_TOKEN;

    if (!token) {
        const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const llmStudioBaseUrl = process.env.LLMSTUDIO_BASE_URL || 'http://localhost:1234';

        // Try connecting to Ollama first
        try {
            const ollamaConfig = await checkOllamaAvailability(ollamaBaseUrl);
            return JSON.stringify(ollamaConfig);
        } catch (ollamaError) {
            console.log('Ollama not available, trying LLMStudio...');

            // Try connecting to LLMStudio
            try {
                const llmStudioConfig = await checkLLMStudioAvailability(llmStudioBaseUrl);
                return JSON.stringify(llmStudioConfig);
            } catch (llmStudioError) {
                throw new Error(
                    'No LLM provider available. Please either:\n' +
                    '1. Set DEFAULT_ACCESS_TOKEN, or\n' +
                    '2. Ensure either Ollama or LLMStudio is running with at least one model available.'
                );
            }
        }
    }

    return token;
}

export async function configureAuth(app: OpenAPIHono): Promise<void> {
    try {
        // Get the authentication token
        const token = await configureToken();

        if (!token) {
            throw new Error('Failed to configure authentication token');
        }

        // Configure API security with the token
        configureApiSecurity(app, token);

        console.log('Authentication and security configuration initialized successfully');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        throw new Error(`Failed to initialize authentication: ${errorMessage}`);
    }
}

const app = new OpenAPIHono();
// Configure CORS first
app.use('/*', cors({
    origin: configureCors(),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 3600,
    credentials: true,
}));

// Initialize authentication and security
const initialize = async () => {
    await configureAuth(app)
    await configureRoutes(app)
    await configureApiDocs(app)
    return app;
};

export default initialize;