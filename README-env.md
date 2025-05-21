# Environment Setup for AI Backend

## OpenAI API Key

To use the `/summarize` endpoint, you need to set up an OpenAI API key:

1. Create a `.env` file in the root directory of this project
2. Add the following line to the file, replacing `your-openai-api-key` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=your-openai-api-key
   ```

3. Make sure to add `.env` to your `.gitignore` file to avoid committing sensitive information to version control

## Running the Application

After setting up the environment variables, you can run the application using:

```
npm run dev
```

The summarize endpoint will be available at `/summarize` and will require an API key header (`x-api-key`) for access.

## Testing the Summarize Endpoint

You can test the summarize endpoint with the following curl command:

```
curl -X POST http://localhost:3000/summarize \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key" \
  -d '{"text": "Your long text to be summarized goes here.", "maxLength": 100}'
```

Replace `your-secret-api-key` with the same API key specified in `src/index.ts`.
