# askText Endpoint Example

The `askText` endpoint allows you to ask questions based on provided text context. The LLM will answer the question using only the information from the provided text.

## Endpoint Details

- **URL**: `/api/v1/askText`
- **Method**: `POST`
- **Authentication**: Bearer token required

## Request Format

```json
{
  "payload": {
    "text": "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower. Constructed from 1887 to 1889 as the centerpiece of the 1889 World's Fair, it was initially criticized by some of France's leading artists and intellectuals for its design. The tower is 330 meters tall and was the tallest man-made structure in the world until 1930.",
    "question": "When was the Eiffel Tower built and how tall is it?"
  },
  "config": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  }
}
```

## Response Format

```json
{
  "answer": "The Eiffel Tower was constructed from 1887 to 1889 and is 330 meters tall.",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 20,
    "total_tokens": 170
  },
  "version": "v1"
}
```

## cURL Example

```bash
# Replace YOUR_API_KEY with your actual Bearer token
curl -X POST http://localhost:3000/api/v1/askText \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "text": "Python is a high-level programming language created by Guido van Rossum and first released in 1991. It emphasizes code readability with its use of significant indentation. Python is dynamically typed and garbage-collected. It supports multiple programming paradigms, including procedural, object-oriented, and functional programming.",
      "question": "Who created Python and when was it released?"
    },
    "config": {
      "provider": "openai",
      "model": "gpt-4o-mini"
    }
  }'
```

## JavaScript/TypeScript Example

```javascript
async function askQuestion(text, question) {
  const response = await fetch('http://localhost:3000/api/v1/askText', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload: {
        text: text,
        question: question
      },
      config: {
        provider: 'openai',
        model: 'gpt-4o-mini'
      }
    })
  });

  const data = await response.json();
  return data.answer;
}

// Usage
const text = "The Great Wall of China is a series of fortifications that were built across the historical northern borders of ancient Chinese states. Construction began as early as the 7th century BC, with the most famous sections built during the Ming Dynasty (1368-1644). The wall stretches over 13,000 miles.";
const question = "How long is the Great Wall of China?";

askQuestion(text, question).then(answer => {
  console.log('Answer:', answer);
});
```

## Supported Providers

The endpoint supports multiple LLM providers:
- `openai` - OpenAI models (gpt-4, gpt-3.5-turbo, etc.)
- `anthropic` - Claude models
- `ollama` - Local Ollama models
- `openrouter` - OpenRouter models

## Use Cases

1. **Document Q&A**: Answer questions about specific documents or text content
2. **Context-based Information Extraction**: Extract specific information from text
3. **Reading Comprehension**: Test understanding of provided material
4. **Customer Support**: Answer questions based on product documentation
5. **Educational Tools**: Create study aids that answer questions from textbooks

## Notes

- The LLM will only use information from the provided text to answer the question
- If the text doesn't contain enough information to answer the question, the response will indicate this
- Token usage is tracked and returned in the response for billing/monitoring purposes
- The endpoint uses a single API call to the LLM for efficiency
