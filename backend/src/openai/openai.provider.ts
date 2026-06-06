import { ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';

export const OPENAI_CLIENT = 'OPENAI_CLIENT';
export const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const NOT_CONFIGURED_MESSAGE =
  'OpenAI is not configured — set OPENAI_API_KEY for live analysis; use the demo endpoints otherwise';

/**
 * Builds a stand-in that satisfies the `OpenAI` injection type but throws a
 * clear, catchable {@link ServiceUnavailableException} on ANY actual use. It
 * constructs without throwing, so DI + Nest bootstrap succeed even when no key
 * is present (demo/diff routes never touch OpenAI). Recursive proxy handles
 * nested access like `client.chat.completions.create` and
 * `client.embeddings.create`.
 */
function createUnconfiguredClient(): OpenAI {
  const throwUnavailable = (): never => {
    throw new ServiceUnavailableException(NOT_CONFIGURED_MESSAGE);
  };

  const handler: ProxyHandler<object> = {
    get: (_target, prop): unknown => {
      // Let promise-unwrapping / type guards behave normally instead of
      // throwing (e.g. `await client` or feature detection).
      if (prop === 'then' || typeof prop === 'symbol') {
        return undefined;
      }
      // Any further property navigation returns the same throwing proxy,
      // so `client.chat.completions.create(...)` reaches a callable that throws.
      return new Proxy(throwUnavailable, handler);
    },
    apply: throwUnavailable,
  };

  // The proxy intentionally has no real OpenAI surface; the cast is what keeps
  // injected `OpenAI`-typed consumers type-safe without `any`.
  return new Proxy(throwUnavailable, handler) as unknown as OpenAI;
}

export const OpenAIProvider = {
  provide: OPENAI_CLIENT,
  useFactory: (): OpenAI => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return createUnconfiguredClient();
    }
    return new OpenAI({ apiKey });
  },
};
