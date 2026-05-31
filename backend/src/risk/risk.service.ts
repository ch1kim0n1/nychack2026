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
  // Trust & citation
  confidence_level?: 'high' | 'medium' | 'low';
  jurisdiction_level?: 'city' | 'county' | 'state' | 'federal' | 'agency';
  // Phase 1 — impact dimensions
  money_risk?: 'high' | 'medium' | 'low';
  delay_risk?: 'high' | 'medium' | 'low';
  legal_severity?: 'high' | 'medium' | 'low';
  urgency?: 'immediate' | 'soon' | 'ongoing';
  impact_score?: number;
  impact_label?: string;
  // Phase 1 — action playbook
  who_to_contact?: string;
  what_to_ask?: string;
  documents_needed?: string[];
  next_steps?: string[];
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
const DEMO_BUSINESS_ID = 'demo-biz-scenario-a';

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
    const risk_level = this.overallLevel(findings);

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
        confidence_level: f.confidence_level ?? null,
        jurisdiction_level: f.jurisdiction_level ?? null,
        money_risk: f.money_risk ?? null,
        delay_risk: f.delay_risk ?? null,
        legal_severity: f.legal_severity ?? null,
        urgency: f.urgency ?? null,
        impact_score: f.impact_score ?? null,
        impact_label: f.impact_label ?? null,
        who_to_contact: f.who_to_contact ?? null,
        what_to_ask: f.what_to_ask ?? null,
        documents_needed: f.documents_needed ?? [],
        next_steps: f.next_steps ?? [],
      })),
    });

    return { risk_score, risk_level, findings, disclaimer: DISCLAIMER };
  }

  async getDemo(): Promise<RiskAnalysisResult> {
    const rows = await this.prisma.riskFinding.findMany({
      where: { business_id: DEMO_BUSINESS_ID },
    });

    const findings: RiskFinding[] = rows
      .map((r) => ({
        risk_level: r.risk_level as 'high' | 'medium' | 'low',
        affected_area: r.affected_area,
        explanation: r.explanation,
        recommended_action: r.recommended_action,
        source_url: r.source_url,
        confidence_level: r.confidence_level as RiskFinding['confidence_level'] ?? undefined,
        jurisdiction_level: r.jurisdiction_level as RiskFinding['jurisdiction_level'] ?? undefined,
        money_risk: r.money_risk as RiskFinding['money_risk'] ?? undefined,
        delay_risk: r.delay_risk as RiskFinding['delay_risk'] ?? undefined,
        legal_severity: r.legal_severity as RiskFinding['legal_severity'] ?? undefined,
        urgency: r.urgency as RiskFinding['urgency'] ?? undefined,
        impact_score: r.impact_score ?? undefined,
        impact_label: r.impact_label ?? undefined,
        who_to_contact: r.who_to_contact ?? undefined,
        what_to_ask: r.what_to_ask ?? undefined,
        documents_needed: r.documents_needed as string[],
        next_steps: r.next_steps as string[],
      }))
      .sort((a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]);

    const risk_score = Math.min(100, findings.reduce((sum, f) => sum + RISK_POINTS[f.risk_level], 0));
    const risk_level = this.overallLevel(findings);

    return { risk_score, risk_level, findings, disclaimer: DISCLAIMER };
  }

  private overallLevel(findings: RiskFinding[]): 'high' | 'medium' | 'low' {
    if (findings.some((f) => f.risk_level === 'high')) return 'high';
    if (findings.some((f) => f.risk_level === 'medium')) return 'medium';
    return 'low';
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
- Do NOT invent findings not supported by the provided sources
- Return ONLY valid JSON — no markdown, no explanation

Return a JSON object with a "findings" array. Each finding must have ALL of these fields:
{
  "findings": [{
    "risk_level": "high|medium|low",
    "affected_area": "short label, e.g. Food Service Permit",
    "explanation": "plain-English explanation of what is required",
    "recommended_action": "specific next step the owner should take",
    "source_url": "exact URL from SOURCE: lines in the context",
    "money_risk": "high|medium|low",
    "delay_risk": "high|medium|low",
    "legal_severity": "high|medium|low",
    "urgency": "immediate|soon|ongoing",
    "impact_score": 0-100,
    "impact_label": "one of: Could delay opening | Could trigger fine | Must verify before lease | Renewal risk | Informational",
    "confidence_level": "high|medium|low — high=official source with clear requirement, medium=general guidance, low=inferred or ambiguous",
    "jurisdiction_level": "city|county|state|federal|agency",
    "who_to_contact": "specific agency, department, or office name",
    "what_to_ask": "exact question to ask when contacting that agency",
    "documents_needed": ["list of documents required for this compliance step"],
    "next_steps": ["ordered list of concrete next actions"]
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
