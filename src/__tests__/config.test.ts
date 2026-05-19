import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAIProvider } from '../config.js';

describe('Config', () => {
  beforeEach(() => {
    vi.stubEnv('AI_PROVIDER', '');
    vi.stubEnv('AI_API_KEY', '');
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('AI_BASE_URL', '');
    vi.stubEnv('AI_MODEL', '');
  });

  it('should throw error if openai key is missing', () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    expect(() => getAIProvider()).toThrow('OpenAI API key is missing');
  });

  it('should return openai provider if key is present', () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const provider = getAIProvider();
    expect(provider).toBeDefined();
    expect(provider.modelId).toBe('gpt-4o');
  });

  it('should use custom model if provided', () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubEnv('AI_MODEL', 'gpt-3.5-turbo');
    const provider = getAIProvider();
    expect(provider.modelId).toBe('gpt-3.5-turbo');
  });

  it('should return anthropic provider if key is present', () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic');
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    const provider = getAIProvider();
    expect(provider).toBeDefined();
    expect(provider.modelId).toBe('claude-3-5-sonnet-20240620');
  });

  it('should work with ollama without key', () => {
    vi.stubEnv('AI_PROVIDER', 'ollama');
    const provider = getAIProvider();
    expect(provider).toBeDefined();
    expect(provider.modelId).toBe('llama3');
  });
});
