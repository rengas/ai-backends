import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const OPENAI_MODEL = 'gpt-4.1'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Define our usage type
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
 * Generate a response using OpenAI with structured output
 */
export async function generateResponse<T extends z.ZodType>(
  prompt: string,
  schema: T,
): Promise<{ 
  data: z.infer<T>; 
  usage: TokenUsage;
}> {
  const response = await openai.responses.parse({
    model: OPENAI_MODEL,
    input: [
      { role: "user", content: prompt }
    ],
    text: {
      format: zodTextFormat(schema, "result"),
    },
  });
  
  // Convert the usage data to our expected format
  const usage: TokenUsage = {
    input_tokens: 0,
    input_tokens_details: {
      cached_tokens: 0
    },
    output_tokens: 0,
    output_tokens_details: {
      reasoning_tokens: 0
    },
    total_tokens: 0
  }
  
  // Try to populate with real data if available
  if (response.usage) {
    // The new OpenAI SDK has different property names
    usage.total_tokens = response.usage.total_tokens || 0;
    // Estimate input/output tokens since specific breakdowns might not be available
    usage.input_tokens = Math.floor(usage.total_tokens * 0.7); // Estimate
    usage.output_tokens = usage.total_tokens - usage.input_tokens;
  }
  
  return {
    data: response.output_parsed,
    usage
  }
}

export { openai, OPENAI_MODEL } 
