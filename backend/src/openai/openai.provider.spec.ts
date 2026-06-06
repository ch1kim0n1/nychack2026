import { ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_CLIENT, OpenAIProvider } from './openai.provider';

describe('OpenAIProvider', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  });

  it('exposes the OPENAI_CLIENT DI token', () => {
    expect(OpenAIProvider.provide).toBe(OPENAI_CLIENT);
  });

  it('returns a real OpenAI client when OPENAI_API_KEY is present', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key';

    const client = OpenAIProvider.useFactory();

    expect(client).toBeInstanceOf(OpenAI);
  });

  describe('when OPENAI_API_KEY is missing', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
    });

    it('constructs the provider without throwing (boot succeeds key-less)', () => {
      expect(() => OpenAIProvider.useFactory()).not.toThrow();
    });

    it('throws a clear ServiceUnavailableException on chat completions calls', () => {
      const client = OpenAIProvider.useFactory();

      let caught: unknown;
      try {
        void client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [],
        });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      expect((caught as ServiceUnavailableException).message).toContain(
        'OpenAI is not configured',
      );
    });

    it('throws a clear ServiceUnavailableException on embeddings calls', () => {
      const client = OpenAIProvider.useFactory();

      let caught: unknown;
      try {
        void client.embeddings.create({
          model: 'text-embedding-3-small',
          input: 'x',
        });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      expect((caught as ServiceUnavailableException).message).toContain(
        'OpenAI is not configured',
      );
    });
  });
});
