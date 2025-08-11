export function createFinalResponse(response: Record<string, any>, apiVersion: string) {
  return {
    ...response,
    apiVersion: apiVersion
  };
}