/**
 * System prompt template for summarization
 */
export function summarizePrompt(text: string, maxLength?: number): string {
  return `Summarize the following text${maxLength ? ` in ${maxLength} words or less` : ''}: ${text}`;
}

/**
 * System prompt template for keyword extraction
 */
export function keywordsPrompt(text: string, maxKeywords?: number): string {
  return `Extract the most important${maxKeywords ? ` ${maxKeywords}` : ''} keywords from the following text. Return them as a list of strings, with no explanations or extra text.

Text: ${text}`;
}

/**
 * System prompt for email reply generation
 */
export function emailReplyPrompt(emailContent: string, tone?: string): string {
  return `Generate a professional email reply to the following email${tone ? ` with a ${tone} tone` : ''}.
  
Email: ${emailContent}`;
}

/**
 * System prompt for tweet creation
 */
export function tweetPrompt(topic: string, style?: string): string {
  return `Create a tweet about the following topic${style ? ` in a ${style} style` : ''}.
  
Topic: ${topic}`;
}

/**
 * System prompt for image description
 */
export function imageDescriptionPrompt(imageUrl: string): string {
  return `Describe the following image in detail:
  
Image URL: ${imageUrl}`;
} 