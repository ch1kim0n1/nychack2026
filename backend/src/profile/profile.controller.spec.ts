import 'reflect-metadata';
import { ProfileController } from './profile.controller';

// Verify @Throttle({ default: { ttl: 60_000, limit: 10 } }) is applied to
// the classify endpoint so the ThrottlerGuard enforces it at runtime.
describe('ProfileController throttle metadata', () => {
  it('applies 10 req/min limit to classify', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const classify = ProfileController.prototype.classify;
    const limit = Reflect.getMetadata(
      'THROTTLER:LIMITdefault',
      classify,
    ) as number;
    const ttl = Reflect.getMetadata('THROTTLER:TTLdefault', classify) as number;
    expect(limit).toBe(10);
    expect(ttl).toBe(60_000);
  });
});
