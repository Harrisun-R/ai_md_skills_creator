import dotenv from 'dotenv';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

dotenv.config();

/**
 * Sanitizes an API key for safe logging/error messages.
 * e.g. "sk-abc123456789" -> "sk-ab...6789"
 */
export function sanitizeKey(key: string | undefined): string {
  if (!key) return 'undefined';
  if (key.length < 8) return '***';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom';

export interface Config {
  provider: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

export function getAIProvider() {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase() as ProviderType;
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  const getApiKey = (envVars: string[]) => {
    if (apiKey) return apiKey;
    for (const v of envVars) {
      if (process.env[v]) return process.env[v];
    }
    return undefined;
  };

  switch (provider) {
    case 'openai': {
      const key = getApiKey(['OPENAI_API_KEY']);
      if (!key && !baseUrl) throw new Error('OpenAI API key is missing. Set AI_API_KEY or OPENAI_API_KEY.');
      return createOpenAI({
        apiKey: key || undefined,
        baseURL: baseUrl || undefined,
      })(model || 'gpt-4o');
    }
    case 'anthropic': {
      const key = getApiKey(['ANTHROPIC_API_KEY']);
      if (!key) throw new Error('Anthropic API key is missing. Set AI_API_KEY or ANTHROPIC_API_KEY.');
      return createAnthropic({
        apiKey: key,
        baseURL: baseUrl || undefined,
      })(model || 'claude-3-5-sonnet-20240620');
    }
    case 'google': {
      const key = getApiKey(['GOOGLE_GENERATIVE_AI_API_KEY', 'GEMINI_API_KEY']);
      if (!key) throw new Error('Google API key is missing. Set AI_API_KEY or GEMINI_API_KEY.');
      return createGoogleGenerativeAI({
        apiKey: key,
      })(model || 'gemini-1.5-pro');
    }
    case 'ollama':
    case 'custom':
      return createOpenAI({
        apiKey: apiKey || 'not-needed',
        baseURL: baseUrl || 'http://localhost:11434/v1',
      })(model || 'llama3');
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
