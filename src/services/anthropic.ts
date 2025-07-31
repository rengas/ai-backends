import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { generateObject, generateText } from "ai";
import { anthropic } from '@ai-sdk/anthropic';

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const anthropic1 = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export async function generateChatStructuredResponse(
  prompt: string,
  schema: z.ZodType,
  model?: string,
  temperature: number = 0
): Promise<any> {
  
  const modelToUse = anthropic(model || ANTHROPIC_MODEL);

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
  
  const modelToUse = anthropic(model || ANTHROPIC_MODEL);

  const result = await generateText({
    model: modelToUse,
    prompt: prompt
  });

  console.log('ANTHROPIC RESULT', result);

  return result;
}

export { anthropic1 as anthropic, ANTHROPIC_MODEL };