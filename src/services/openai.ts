import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from "ai";

const OPENAI_MODEL = 'gpt-4.1-nano'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const openai1 = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function generateChatStructuredResponse(
  prompt: string,
  schema: z.ZodType,
  model?: string,
  temperature: number = 0
): Promise<any> {
  
  const modelToUse = openai.responses(model || OPENAI_MODEL);

  const result = await generateObject({
    model: modelToUse,
    schema: schema,
    prompt: prompt,
    temperature: temperature
  });

  return result;
}

export async function generateChatTextResponse(
  prompt: string,
  model?: string,
): Promise<any> {  

  console.log('model', model);
  
  const modelToUse = openai.responses(model || OPENAI_MODEL);

  const result = await generateText({
    model: modelToUse,
    prompt: prompt
  });

  return result;
}


export { openai1 as openai, OPENAI_MODEL } 

/**
 * Get available models from OpenAI
 * Note: OpenAI supports hundreds of models, this returns commonly used ones
 */
export async function getAvailableModels(): Promise<string[]> {
  // OpenAI supports hundreds of models
  // Returning some popular ones as examples
  return [
    'gpt-4.1-nano',
  ];
}
