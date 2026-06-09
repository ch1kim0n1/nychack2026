import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configuredKey = process.env.ADMIN_API_KEY;

    if (!configuredKey) {
      throw new UnauthorizedException('Admin API is not configured.');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.header('x-admin-api-key');

    if (providedKey !== configuredKey) {
      throw new UnauthorizedException('Admin API key is required.');
    }

    return true;
  }
}
