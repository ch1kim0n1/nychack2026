import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BusinessProfile } from '../profile/profile.service';

export interface SavedProfile {
  id: string;
  client_id: string;
  label: string;
  profile_json: BusinessProfile;
  created_at: Date;
  updated_at: Date;
}

function profilesEqual(a: BusinessProfile, b: BusinessProfile): boolean {
  return (
    a.industry === b.industry &&
    a.location === b.location &&
    a.employees === b.employees &&
    a.activities.length === b.activities.length &&
    a.activities.every((v, i) => v === b.activities[i]) &&
    a.expansion_locations.length === b.expansion_locations.length &&
    a.expansion_locations.every((v, i) => v === b.expansion_locations[i])
  );
}

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async save(dto: {
    client_id: string;
    label: string;
    profile: BusinessProfile;
  }): Promise<SavedProfile> {
    const existing = await this.prisma.savedProfile.findMany({
      where: { client_id: dto.client_id },
    });
    const duplicate = existing.find((r) =>
      profilesEqual(r.profile_json as unknown as BusinessProfile, dto.profile),
    );
    if (duplicate) {
      throw new ConflictException(
        'This profile is already saved to your watchlist.',
      );
    }

    const record = await this.prisma.savedProfile.create({
      data: {
        client_id: dto.client_id,
        label: dto.label,
        profile_json: { ...dto.profile },
      },
    });
    return this.toSavedProfile(record);
  }

  async list(clientId: string): Promise<SavedProfile[]> {
    const records = await this.prisma.savedProfile.findMany({
      where: { client_id: clientId },
      orderBy: { created_at: 'desc' },
    });
    return records.map((r) => this.toSavedProfile(r));
  }

  async remove(id: string, clientId: string): Promise<void> {
    const record = await this.prisma.savedProfile.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException(`SavedProfile ${id} not found`);
    }

    if (record.client_id !== clientId) {
      throw new ForbiddenException(
        'You do not have permission to delete this profile',
      );
    }

    await this.prisma.savedProfile.delete({ where: { id } });
  }

  private toSavedProfile(record: {
    id: string;
    client_id: string;
    label: string;
    profile_json: unknown;
    created_at: Date;
    updated_at: Date;
  }): SavedProfile {
    return {
      id: record.id,
      client_id: record.client_id,
      label: record.label,
      profile_json: record.profile_json as BusinessProfile,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
}
