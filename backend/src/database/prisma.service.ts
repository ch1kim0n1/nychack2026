import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** How often the background retry attempts to (re)connect to the database. */
const RETRY_INTERVAL_MS = 5000;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /**
   * True once the database is reachable. Services read this as a plain boolean
   * (`this.prisma.dbAvailable`) to pick static fallbacks. Stays `false` until a
   * connection succeeds, and is flipped to `true` by the background retry loop
   * if the DB only becomes reachable after boot.
   */
  dbAvailable = false;

  private retryTimer?: ReturnType<typeof setInterval>;

  async onModuleInit() {
    // In test mode, skip DB connection entirely - tests mock Prisma.
    if (process.env.NODE_ENV === 'test') {
      this.dbAvailable = false;
      return;
    }

    // Non-fatal: app must boot even when no DB is reachable (demo runs on static fallbacks).
    const connected = await this.tryConnect();
    if (!connected) {
      // DB not ready at boot — recover automatically once Postgres comes up,
      // without requiring a process restart. Local boot-order no longer matters.
      this.startRetryLoop();
    }
  }

  async onModuleDestroy() {
    this.stopRetryLoop();
    await this.$disconnect().catch(() => undefined);
  }

  /** Attempt a single connection. Returns true on success; never throws. */
  private async tryConnect(): Promise<boolean> {
    try {
      await this.$connect();
      this.dbAvailable = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Poll for database availability in the background. Errors are swallowed at
   * debug level to avoid log spam. The timer is `unref()`-ed so it never keeps
   * the process alive, and stops itself the moment a connection succeeds.
   */
  private startRetryLoop() {
    if (this.retryTimer) return;
    this.logger.warn(
      `Database unavailable at boot — serving static demo fallbacks. Retrying every ${RETRY_INTERVAL_MS}ms.`,
    );

    this.retryTimer = setInterval(() => {
      void this.tryConnect().then((connected) => {
        if (connected) {
          this.logger.log('Database now reachable — live data restored.');
          this.stopRetryLoop();
        } else {
          this.logger.debug('Database still unavailable; will retry.');
        }
      });
    }, RETRY_INTERVAL_MS);

    // Don't hold the event loop open just for reconnection attempts.
    this.retryTimer.unref?.();
  }

  private stopRetryLoop() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = undefined;
    }
  }
}
