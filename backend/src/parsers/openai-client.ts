import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// Create OpenAI client instance
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
export const MODEL = 'gpt-4o-mini';
