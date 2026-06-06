import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BusinessProfile } from '../profile/profile.service';

export interface RadarThreat {
  source_id: string;
  title: string;
  agency: string;
  jurisdiction: string;
  source_url: string;
  last_checked_at: string | null;
  matched_tags: string[];
}

/** Shape of a chunk row returned from Prisma (select clause subset). */
interface ChunkTagRow {
  jurisdiction_tags: string[];
  industry_tags: string[];
  activity_tags: string[];
}

/** Shape of a RegulatorySource row with included chunks returned from Prisma. */
interface SourceWithChunks {
  id: string;
  title: string;
  agency: string;
  jurisdiction: string;
  source_url: string;
  last_checked_at: Date | null;
  chunks: ChunkTagRow[];
}

/** Static demo threats returned when DB is unavailable — food_service / Austin profile */
const DEMO_THREATS: RadarThreat[] = [
  {
    source_id: 'demo-src-001',
    title: 'Austin Public Health – Food Enterprise Permit Requirements',
    agency: 'Austin Public Health',
    jurisdiction: 'Austin, TX',
    source_url:
      'https://www.austintexas.gov/health/programs/fixed-food-establishments',
    last_checked_at: new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    matched_tags: ['Austin, TX', 'food_service', 'food_preparation'],
  },
  {
    source_id: 'demo-src-002',
    title: 'Texas Alcoholic Beverage Commission – License & Permit Updates',
    agency: 'Texas Alcoholic Beverage Commission (TABC)',
    jurisdiction: 'Texas',
    source_url: 'https://www.tabc.texas.gov/services/tabc-licenses-permits/',
    last_checked_at: new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    matched_tags: ['Texas', 'food_service', 'alcohol_planned'],
  },
  {
    source_id: 'demo-src-003',
    title: 'Federal FDA Food Safety Modernization Act – Retail Food Guidance',
    agency: 'U.S. Food and Drug Administration',
    jurisdiction: 'Federal',
    source_url:
      'https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements',
    last_checked_at: new Date(
      Date.now() - 12 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    matched_tags: ['Federal', 'food_service'],
  },
];

@Injectable()
export class RadarService {
  private readonly logger = new Logger(RadarService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Query sources re-checked within the last `days` days whose chunks match
   * the profile's jurisdiction + industry/activity tags. Returns deduplicated
   * threat objects ordered by recency (most recent first).
   *
   * Tag-matching logic:
   *  - jurisdiction_tags must overlap: profile.location, any expansion_locations,
   *    "Texas", or "Federal"
   *  - AND (industry_tags overlap profile.industry OR activity_tags overlap
   *    profile.activities)
   *
   * This runs a single JOIN query at the chunk level then deduplicates by
   * source, collecting matched tags per source for display.
   */
  async getThreats(
    profile: BusinessProfile,
    days = 30,
  ): Promise<RadarThreat[]> {
    if (!this.prisma.dbAvailable) {
      return DEMO_THREATS;
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Build jurisdiction candidates: profile location + expansion + always Texas + Federal
    const jurisdictionCandidates = [
      profile.location,
      ...profile.expansion_locations,
      'Texas',
      'Federal',
    ].filter((j): j is string => typeof j === 'string' && j.trim().length > 0);

    // Normalize industry/activities for comparison
    const industryNorm = profile.industry.trim().toLowerCase();
    const activitiesNorm = profile.activities.map((a) =>
      a.trim().toLowerCase(),
    );

    try {
      // Fetch sources re-checked within the window that have at least one chunk.
      // We retrieve tag arrays for chunks and filter in application code to keep
      // the query generic (no pgarray operators needed).
      // The Prisma client is typed as `any` in this project (client not generated);
      // explicit interface assertions restore type safety on the result.
      const sources: SourceWithChunks[] =
        await this.prisma.regulatorySource.findMany({
          where: {
            last_checked_at: { gte: since },
            chunks: { some: {} },
          },
          include: {
            chunks: {
              select: {
                jurisdiction_tags: true,
                industry_tags: true,
                activity_tags: true,
              },
            },
          },
          orderBy: { last_checked_at: 'desc' },
        });

      const threats: RadarThreat[] = [];

      for (const source of sources) {
        const matchedTags = new Set<string>();

        for (const chunk of source.chunks) {
          // Jurisdiction match: at least one chunk tag overlaps our candidates
          const jurisdictionMatched = chunk.jurisdiction_tags.some((jt) =>
            jurisdictionCandidates.some(
              (candidate) =>
                jt.toLowerCase().includes(candidate.toLowerCase()) ||
                candidate.toLowerCase().includes(jt.toLowerCase()),
            ),
          );

          if (!jurisdictionMatched) continue;

          // Industry or activity match
          const industryMatched = chunk.industry_tags.some(
            (it) => it.trim().toLowerCase() === industryNorm,
          );
          const activityMatched =
            activitiesNorm.length > 0 &&
            chunk.activity_tags.some((at) =>
              activitiesNorm.includes(at.trim().toLowerCase()),
            );

          if (!industryMatched && !activityMatched) continue;

          // Collect the matched tags for this chunk
          chunk.jurisdiction_tags
            .filter((jt) =>
              jurisdictionCandidates.some(
                (candidate) =>
                  jt.toLowerCase().includes(candidate.toLowerCase()) ||
                  candidate.toLowerCase().includes(jt.toLowerCase()),
              ),
            )
            .forEach((t) => matchedTags.add(t));

          chunk.industry_tags
            .filter((it) => it.trim().toLowerCase() === industryNorm)
            .forEach((t) => matchedTags.add(t));

          chunk.activity_tags
            .filter((at) => activitiesNorm.includes(at.trim().toLowerCase()))
            .forEach((t) => matchedTags.add(t));
        }

        if (matchedTags.size > 0) {
          threats.push({
            source_id: source.id,
            title: source.title,
            agency: source.agency,
            jurisdiction: source.jurisdiction,
            source_url: source.source_url,
            last_checked_at: source.last_checked_at?.toISOString() ?? null,
            matched_tags: Array.from(matchedTags),
          });
        }
      }

      return threats;
    } catch (err) {
      this.logger.warn(
        `Radar query failed, returning demo threats: ${(err as Error).message}`,
      );
      return DEMO_THREATS;
    }
  }

  /** Build a human-readable summary of a profile for display in the response */
  summarizeProfile(profile: BusinessProfile): string {
    const parts: string[] = [profile.industry, profile.location];
    if (profile.expansion_locations.length > 0) {
      parts.push(`expanding to ${profile.expansion_locations.join(', ')}`);
    }
    if (profile.activities.length > 0) {
      parts.push(profile.activities.slice(0, 3).join(', '));
    }
    return parts.join(' · ');
  }
}
