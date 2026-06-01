import { OpenAIProvider } from './openai.provider';

describe('OpenAIProvider', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  });

  it('fails fast when OPENAI_API_KEY is missing', () => {
    delete process.env.OPENAI_API_KEY;

    expect(OpenAIProvider.useFactory).toThrow('OPENAI_API_KEY is not set');
  });
});
