/**
 * System prompt template for summarization
 */
export function summarizePrompt(text: string, maxLength?: number): string {
  return `Summarize the following text${maxLength ? ` in ${maxLength} words or less. Just return the summary, no other text or explanation.` : ''}: ${text}`;
}

/**
 * System prompt template for keyword extraction
 */
export function keywordsPrompt(text: string, maxKeywords?: number): string {
  return `Extract the most important${maxKeywords ? ` ${maxKeywords}` : ''} keywords from the following text.

Text: ${text}`;
}

/**
 * System prompt for translation
 */
export function translatePrompt(text: string, targetLanguage: string): string {
  return `Translate the following text to ${targetLanguage}. Text: ${text} Just return the translated text, no other text or explanation.`;
}

/**
 * System prompt for image description
 */
export function imageDescriptionPrompt(imageUrl: string): string {
  return `Describe the following image in detail:
  
Image URL: ${imageUrl}`;
}

/**
 * System prompt for image description
 */
export function describeImagePrompt(): string {
  return `Describe the following image`
}


/**
 * System prompt for sentiment analysis
 */
export function sentimentPrompt(text: string, categories?: string[]): string {
  const defaultCategories = ['positive', 'negative', 'neutral'];
  const sentimentCategories = categories && categories.length > 0 ? categories : defaultCategories;
  
  return `Analyze the sentiment of the following text and return your response in JSON format.

Your response must include:
1. "sentiment": The overall sentiment classification
2. "confidence": A confidence score between 0 and 1 (where 1 is most confident)
3. "emotions": An array of emotion objects, each with "emotion" (string) and "score" (number 0-1)

DO NOT CALL ANY TOOLS OR FUNCTIONS

Text to analyze: ${text}`;
}

/**
 * System prompt for email reply generation
 */
export function emailReplyPrompt(text: string, tone?: string, hint?: string): string {
  const toneInstruction = tone
    ? `Write the reply in a ${tone} tone.`
    : 'Write the reply in a professional and concise tone.';

  const hintInstruction = hint ? `Additional guidance from requester: ${hint}` : '';

  return `You are an email assistant. Compose a thoughtful reply to the following email.

${toneInstruction}
${hintInstruction ? `\n${hintInstruction}` : ''}

Rules:
- You are the recipient of the email and you reply using that perspective.
- Do not add a subject line to the reply.
- Do not include greetings like "Hi" or signatures; return only the main body of the reply.
- Be polite, clear, and actionable.
- If information is missing, propose reasonable next steps or clarifying questions.

Email to reply to:
"""
${text}
"""`;
}
