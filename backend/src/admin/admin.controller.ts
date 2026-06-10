import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminApiKeyGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  /** GET /api/admin/findings/pending */
  @Get('findings/pending')
  getPendingFindings() {
    return this.adminService.getPendingFindings();
  }

  /** PATCH /api/admin/findings/:id/review */
  @Patch('findings/:id/review')
  reviewFinding(
    @Param('id') id: string,
    @Body() body: { state: 'approved' | 'rejected'; note?: string },
  ) {
    return this.adminService.reviewFinding(id, body.state, body.note);
  }

  /** GET /api/admin/stats */
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }
}
