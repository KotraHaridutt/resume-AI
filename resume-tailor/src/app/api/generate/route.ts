import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamObject } from 'ai';
import { z } from 'zod';

// Initialize the OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Define the expected JSON structure for the resume
const resumeSchema = z.object({
  bullets: z.array(
    z.object({
      id: z.string(),
      originalText: z.string(),
      currentText: z.string(),
    })
  ),
});

export async function POST(req: Request) {
  // FIX 1: Extract 'rawResumeText' instead of 'originalResume'
  const { jd, rawResumeText } = await req.json();

  const result = await streamObject({
    model: openrouter('nvidia/nemotron-3-super-120b-a12b:free'), // or your chosen free model
    mode: 'json', 
    schema: resumeSchema,
    prompt: `You are an expert resume writer. I am providing you with the user's raw resume text and a target Job Description (JD).
    
    Task:
    1. Break the user's raw resume text down into individual bullet points.
    2. Rewrite each bullet point to heavily align with the JD keywords.
    
    CRITICAL INSTRUCTION: You must return ONLY raw, valid JSON. Do NOT wrap the output in markdown code blocks (no backticks). Use exactly these keys:
    {
      "bullets": [
        {
          "id": "1",
          "originalText": "exact old text here",
          "currentText": "new tailored text here"
        }
      ]
    }
    
    Job Description:
    ${jd}
    
    User's Raw Resume Text:
    ${rawResumeText}`,
  }as any); 

  // FIX 2: Return the stream to the frontend
  return result.toTextStreamResponse();
}