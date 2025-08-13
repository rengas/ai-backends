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
export function emailReplyPrompt(
  text: string,
  customInstruction?: string,
  senderName?: string,
  recipientName?: string
): string {
  const instructionLine = customInstruction
    ? `Additional guidance from requester: ${customInstruction}`
    : 'Write the reply in a professional and concise tone.';

  const addressInstruction = senderName ? `Address the reply to ${senderName} by name, but do not add a greeting line.` : '';
  const signoffInstruction = recipientName ? `Sign the reply as ${recipientName} without adding a signature block.` : '';

  return `You are an email assistant. Compose a thoughtful reply to the following email.

${instructionLine}
${addressInstruction ? `\n${addressInstruction}` : ''}
${signoffInstruction ? `\n${signoffInstruction}` : ''}

Rules:
- Understand the email thoroughly before replying.
- You are the recipient of the email and you reply using that perspective.
- Do not add a subject line to the reply.
- Always include "hi", "hello" or "dear" greetings unless explicitly asked not to.
- Be polite, clear, and actionable.
- If information is missing, propose reasonable next steps or clarifying questions. Otherwise, be direct and to the point.

<email_to_reply_to>
"""
${text}
</email_to_reply_to>`;
}

/**
 * System prompt for answering questions based on provided text
 */
export function askTextPrompt(text: string, question: string): string {
  return `Based on the following text, answer the question comprehensively and accurately.

Text:
"""
${text}
"""

Question: ${question}

Instructions:
- Answer the question based solely on the information provided in the text.
- If the text does not contain enough information to answer the question, say so clearly.
- Be concise but thorough in your response.
- Do not add information from outside the provided text.

Answer:`;
}

/**
 * System prompt for text highlighter
 */
export function highlighterPrompt(text: string, maxHighlights?: number): string {
  const maxLine = maxHighlights ? `Identify up to ${maxHighlights} of the most important segments in the text.` : `Identify the most important segments in the text.`;
  return `You are a text highlighter. ${maxLine}

Return your answer strictly as JSON with this exact structure:
{
  "highlights": [
    { "char_start_position": number, "char_end_position": number, "label": string, "description": string }
  ]
}

Rules:
- Use zero-based character indices based on the raw input string.
- "char_end_position" must be exclusive (i.e., the highlight covers characters in [char_start_position, char_end_position)).
- Ensure 0 <= char_start_position < char_end_position <= input length.
- Provide a short "label" (2–5 words) that identifies the type of information for each highlight. Example labels include "Problem Identification", "Order Information", "Root Cause Analysis", "Solution Implementation", and "Additional Support". Choose the best label based on context; create a concise label if none of the examples apply.
- Provide a concise human-readable description for why each span is important.
- Do not include any explanation outside the JSON.
 - IMPORTANT: When selecting spans, snap to whole words. Do not cut a word in the middle. If a span would split a word, expand to include the entire word. Also trim leading/trailing whitespace from spans.

Text:
"""
${text}
"""`;
}
