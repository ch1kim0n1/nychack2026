import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /** True when the database connected at boot. Services use this to pick static fallbacks. */
  dbAvailable = false;

  async onModuleInit() {
    // Non-fatal: app must boot even when no DB is reachable (demo runs on static fallbacks).
    try {
      await this.$connect();
      this.dbAvailable = true;
    } catch (err) {
      this.logger.warn(
        `Database unavailable at boot — serving static demo fallbacks. (${(err as Error).message})`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => undefined);
  }
}
