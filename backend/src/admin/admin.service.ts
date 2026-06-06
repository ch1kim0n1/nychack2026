import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type ReviewState = 'approved' | 'rejected';

export interface ReviewStats {
  pending: number;
  approved: number;
  rejected: number;
  auto_approved: number;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  getPendingFindings() {
    return this.prisma.riskFinding.findMany({
      where: { review_state: 'pending' },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  async reviewFinding(id: string, state: ReviewState, note?: string) {
    if (state !== 'approved' && state !== 'rejected') {
      throw new BadRequestException(`Invalid review state: ${state}`);
    }
    return this.prisma.riskFinding.update({
      where: { id },
      data: {
        review_state: state,
        reviewer_note: note,
        reviewed_at: new Date(),
      },
    });
  }

  async getStats(): Promise<ReviewStats> {
    const rows = await this.prisma.riskFinding.groupBy({
      by: ['review_state'],
      _count: { review_state: true },
    });

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.review_state] = row._count.review_state;
    }

    return {
      pending: map['pending'] ?? 0,
      approved: map['approved'] ?? 0,
      rejected: map['rejected'] ?? 0,
      auto_approved: map['auto_approved'] ?? 0,
    };
  }
}
