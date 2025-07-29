import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// Define our usage type to match the interface
export interface TokenUsage {
  input_tokens: number;
  input_tokens_details: {
    cached_tokens: number;
  };
  output_tokens: number;
  output_tokens_details: {
    reasoning_tokens: number;
  };
  total_tokens: number;
}

/**
 * Generate a response using Anthropic with structured output
 */
export async function generateResponse<T extends z.ZodType>(
  prompt: string,
  schema: T,
): Promise<{ 
  data: z.infer<T>; 
  usage: TokenUsage;
}> {
  // Create a system prompt that instructs Claude to return JSON
  const systemPrompt = `You must respond with valid JSON that matches this schema. Do not include any text outside the JSON response.`;
  
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      { role: "user", content: prompt }
    ],
  });

  // Extract the text content from the response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic');
  }

  let parsedData: z.infer<T>;
  try {
    // Try to parse the response as JSON
    const jsonResponse = JSON.parse(content.text);
    // Validate against the schema
    parsedData = schema.parse(jsonResponse);
  } catch (error) {
    // If parsing fails, try to extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        parsedData = schema.parse(jsonResponse);
      } catch (innerError) {
        throw new Error(`Failed to parse Anthropic response: ${error}`);
      }
    } else {
      throw new Error(`Failed to parse Anthropic response: ${error}`);
    }
  }
  
  // Convert the usage data to our expected format
  const usage: TokenUsage = {
    input_tokens: response.usage.input_tokens,
    input_tokens_details: {
      cached_tokens: response.usage.cache_creation_input_tokens || 0
    },
    output_tokens: response.usage.output_tokens,
    output_tokens_details: {
      reasoning_tokens: 0 // Anthropic doesn't provide reasoning tokens
    },
    total_tokens: response.usage.input_tokens + response.usage.output_tokens
  };
  
  return {
    data: parsedData,
    usage
  };
}

export { anthropic, ANTHROPIC_MODEL };