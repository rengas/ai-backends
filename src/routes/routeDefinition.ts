function createRouteDefinition<T>(path: string, method: string, responseDescription: string, request: T) {
    
    const possibleResponses = {
        '200': {
            description: responseDescription,
            content: {
                'application/json': {
                    schema: request,
                },
            },
        },
    }
    return {
        path,
        method,
        request,
        possibleResponses
    }
}

export { createRouteDefinition }