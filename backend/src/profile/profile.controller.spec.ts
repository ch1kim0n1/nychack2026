import 'reflect-metadata';
import { ProfileController } from './profile.controller';

// Verify @Throttle({ default: { ttl: 60_000, limit: 10 } }) is applied to
// the classify endpoint so the ThrottlerGuard enforces it at runtime.
describe('ProfileController throttle metadata', () => {
  it('applies 10 req/min limit to classify', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      ProfileController.prototype,
      'classify',
    );
    expect(descriptor?.value).toBeDefined();
    const classifyHandler = descriptor?.value as object;

    const limit: unknown = Reflect.getMetadata(
      'THROTTLER:LIMITdefault',
      classifyHandler,
    );
    const ttl: unknown = Reflect.getMetadata(
      'THROTTLER:TTLdefault',
      classifyHandler,
    );
    expect(limit).toBe(10);
    expect(ttl).toBe(60_000);
  });
});
