import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { RagService, RegulatoryChunk } from '../rag/rag.service';
import { BusinessProfile } from '../profile/profile.service';

export interface RiskFinding {
  risk_level: 'high' | 'medium' | 'low';
  affected_area: string;
  explanation: string;
  recommended_action: string;
  source_url: string;
}

export interface RiskAnalysisResult {
  risk_score: number;
  risk_level: 'high' | 'medium' | 'low';
  findings: RiskFinding[];
  disclaimer: string;
}

const RISK_ORDER: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 };
const RISK_POINTS: Record<'high' | 'medium' | 'low', number> = { high: 30, medium: 15, low: 5 };
const DISCLAIMER = 'This is informational guidance, not legal advice.';

@Injectable()
export class RiskService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(
    private prisma: PrismaService,
    private ragService: RagService,
  ) {}

  async analyze(profile: BusinessProfile): Promise<RiskAnalysisResult> {
    const chunks = await this.ragService.retrieve(profile);
    const findings = await this.synthesize(profile, chunks);

    findings.sort((a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]);

    const risk_score = Math.min(
      100,
      findings.reduce((sum, f) => sum + RISK_POINTS[f.risk_level], 0),
    );
    const risk_level: 'high' | 'medium' | 'low' = findings.some((f) => f.risk_level === 'high')
      ? 'high'
      : findings.some((f) => f.risk_level === 'medium')
        ? 'medium'
        : 'low';

    const business = await this.prisma.business.create({
      data: {
        city: profile.location.split(',')[0].trim(),
        state: 'TX',
        industry_code: profile.industry,
        activities: profile.activities,
        expansion_plans: { locations: profile.expansion_locations },
      },
    });

    await this.prisma.riskFinding.createMany({
      data: findings.map((f) => ({
        business_id: business.id,
        risk_level: f.risk_level,
        affected_area: f.affected_area,
        explanation: f.explanation,
        recommended_action: f.recommended_action,
        source_url: f.source_url,
      })),
    });

    return { risk_score, risk_level, findings, disclaimer: DISCLAIMER };
  }

  private async synthesize(
    profile: BusinessProfile,
    chunks: RegulatoryChunk[],
  ): Promise<RiskFinding[]> {
    const context = chunks
      .map((c) => `SOURCE: ${c.source_url}\n${c.text}`)
      .join('\n\n---\n\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Texas regulatory compliance analyst.
Given a business profile and regulatory source text, identify compliance requirements.

RULES:
- Every finding MUST have a source_url copied exactly from the provided context
- Do NOT invent findings that are not supported by the provided sources
- Return ONLY valid JSON — no markdown, no explanation

Return a JSON object with a "findings" array:
{
  "findings": [{
    "risk_level": "high|medium|low",
    "affected_area": "short label, e.g. Food Service Permit",
    "explanation": "plain-English explanation of what is required",
    "recommended_action": "specific next step the owner should take",
    "source_url": "exact URL from SOURCE: lines in the context"
  }]
}`,
        },
        {
          role: 'user',
          content: `BUSINESS PROFILE:\n${JSON.stringify(profile, null, 2)}\n\nREGULATORY CONTEXT:\n${context}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    const raw: RiskFinding[] = parsed.findings ?? [];

    const verified = raw.filter(
      (f) => typeof f.source_url === 'string' && f.source_url.startsWith('http'),
    );

    if (verified.length === 0) {
      throw new InternalServerErrorException(
        'No findings could be verified — all lacked valid citations.',
      );
    }

    return verified;
  }
}
