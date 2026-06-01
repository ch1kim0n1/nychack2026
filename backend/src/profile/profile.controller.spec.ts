import 'reflect-metadata';
import { Throttle } from '@nestjs/throttler';
import { ProfileController } from './profile.controller';

// Verify @Throttle({ default: { ttl: 60_000, limit: 10 } }) is applied to
// the classify endpoint so the ThrottlerGuard enforces it at runtime.
describe('ProfileController throttle metadata', () => {
  it('applies 10 req/min limit to classify', () => {
    const limit = Reflect.getMetadata('THROTTLER:LIMITdefault', ProfileController.prototype.classify);
    const ttl   = Reflect.getMetadata('THROTTLER:TTLdefault',   ProfileController.prototype.classify);
    expect(limit).toBe(10);
    expect(ttl).toBe(60_000);
  });
});
