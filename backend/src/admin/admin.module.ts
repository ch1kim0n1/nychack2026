import { Module } from '@nestjs/common';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminApiKeyGuard, AdminService],
})
export class AdminModule {}
