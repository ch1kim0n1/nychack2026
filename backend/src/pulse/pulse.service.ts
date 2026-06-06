import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BusinessProfile } from '../profile/profile.service';

export interface DigestItem {
  level: 'high' | 'medium' | 'low';
  title: string;
  body: string;
  link: string;
  agency: string;
}

export interface PulseDigest {
  items: DigestItem[];
  generated_at: string;
  personalized: boolean;
  business_label: string;
}

const STATIC_DIGEST_ITEMS: DigestItem[] = [
  {
    level: 'medium',
    title: 'Austin updated outdoor-service hour rules',
    body: 'City of Austin extended permitted outdoor service hours on Friday/Saturday by 1 hour. Review your beer garden permit conditions.',
    link: 'https://www.austintexas.gov/development-services/zoning-verification',
    agency: 'City of Austin',
  },
  {
    level: 'low',
    title: 'Texas Franchise Tax filing window opens June 15',
    body: 'Annual franchise tax report due May 15. File early to avoid a $50 late-filing penalty.',
    link: 'https://comptroller.texas.gov/taxes/sales/',
    agency: 'TX Comptroller',
  },
];

const RISK_ORDER: Record<'high' | 'medium' | 'low', number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const URGENCY_ORDER: Record<string, number> = {
  immediate: 0,
  soon: 1,
  ongoing: 2,
};

@Injectable()
export class PulseService {
  constructor(private readonly prisma: PrismaService) {}

  async generateDigest(profile: BusinessProfile): Promise<PulseDigest> {
    const generated_at = new Date().toISOString();
    const business_label = profile.location ?? 'your business';

    if (!this.prisma.dbAvailable) {
      return {
        items: STATIC_DIGEST_ITEMS,
        generated_at,
        personalized: false,
        business_label,
      };
    }

    // Find the most recent matching business by industry_code + city
    const city = profile.location.split(',')[0].trim();
    const matchingBusiness = await this.prisma.business.findFirst({
      where: {
        industry_code: profile.industry,
        city,
      },
      orderBy: { created_at: 'desc' },
    });

    // Query findings: prefer business match, fall back to matching industry+city across all
    let findings: Array<{
      risk_level: string;
      affected_area: string;
      explanation: string;
      recommended_action: string;
      source_url: string;
      urgency: string | null;
      impact_label: string | null;
      who_to_contact: string | null;
      effective_date: string | null;
    }> = [];

    if (matchingBusiness) {
      findings = await this.prisma.riskFinding.findMany({
        where: { business_id: matchingBusiness.id },
        select: {
          risk_level: true,
          affected_area: true,
          explanation: true,
          recommended_action: true,
          source_url: true,
          urgency: true,
          impact_label: true,
          who_to_contact: true,
          effective_date: true,
        },
      });
    }

    if (findings.length === 0) {
      // Broader fallback: any business in same city+industry
      const businesses = await this.prisma.business.findMany({
        where: { industry_code: profile.industry, city },
        select: { id: true },
        take: 5,
        orderBy: { created_at: 'desc' },
      });

      if (businesses.length > 0) {
        const bizIds = businesses.map((b) => b.id);
        findings = await this.prisma.riskFinding.findMany({
          where: { business_id: { in: bizIds } },
          select: {
            risk_level: true,
            affected_area: true,
            explanation: true,
            recommended_action: true,
            source_url: true,
            urgency: true,
            impact_label: true,
            who_to_contact: true,
            effective_date: true,
          },
        });
      }
    }

    if (findings.length === 0) {
      return {
        items: STATIC_DIGEST_ITEMS,
        generated_at,
        personalized: false,
        business_label,
      };
    }

    // Sort: high risk first, then by urgency (immediate → soon → ongoing)
    const sorted = [...findings].sort((a, b) => {
      const riskDiff =
        RISK_ORDER[a.risk_level as 'high' | 'medium' | 'low'] -
        RISK_ORDER[b.risk_level as 'high' | 'medium' | 'low'];
      if (riskDiff !== 0) return riskDiff;
      const ua = URGENCY_ORDER[a.urgency ?? 'ongoing'] ?? 2;
      const ub = URGENCY_ORDER[b.urgency ?? 'ongoing'] ?? 2;
      return ua - ub;
    });

    const top5 = sorted.slice(0, 5);

    const items: DigestItem[] = top5.map((f) => ({
      level: f.risk_level as 'high' | 'medium' | 'low',
      title: f.effective_date
        ? `${f.affected_area} — due ${f.effective_date}`
        : `${f.affected_area} needs attention`,
      body: f.impact_label
        ? `${f.impact_label}. ${f.recommended_action}`
        : f.recommended_action,
      link: f.source_url,
      agency: f.who_to_contact ?? 'Agency',
    }));

    // Query recently-active regulatory sources for context (last 30 days).
    // Fetched for future enrichment; current digest uses risk findings only.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const allLocations = [
      profile.location,
      ...(profile.expansion_locations ?? []),
    ];
    await this.prisma.regulatorySource.findMany({
      where: {
        last_checked_at: { gte: thirtyDaysAgo },
        jurisdiction: { in: allLocations },
      },
      select: { id: true, title: true, source_url: true, jurisdiction: true },
      take: 10,
    });

    return {
      items,
      generated_at,
      personalized: true,
      business_label: `${profile.industry} business in ${profile.location}`,
    };
  }
}
