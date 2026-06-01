import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { RagService, RegulatoryChunk } from '../rag/rag.service';
import { BusinessProfile } from '../profile/profile.service';
import { DEMO_FINDINGS } from './demo-data';

export interface RiskFinding {
  risk_level: 'high' | 'medium' | 'low';
  affected_area: string;
  explanation: string;
  recommended_action: string;
  source_url: string;
  // Regulatory intelligence
  prerequisites?: string[]; // permits/steps that must be done first
  is_hidden_requirement?: boolean; // easy-to-miss requirement from a different agency
  response_path?:
    | 'monitor'
    | 'contact_agency'
    | 'update_docs'
    | 'change_plan'
    | 'seek_clarification';
  // Stakeholder + cost + timing
  permit_fee?: string; // e.g. "~$3,000/year" or "Free"
  effective_date?: string; // e.g. "2026-01-01" or "upon application"
  agency_department?: string; // specific department within agency (for stakeholder map)
  agency_phone?: string;
  agency_url?: string;
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

const RISK_ORDER: Record<'high' | 'medium' | 'low', number> = {
  high: 0,
  medium: 1,
  low: 2,
};
const RISK_POINTS: Record<'high' | 'medium' | 'low', number> = {
  high: 30,
  medium: 15,
  low: 5,
};
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

    findings.sort(
      (a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level],
    );

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
        prerequisites: f.prerequisites ?? [],
        is_hidden_requirement: f.is_hidden_requirement ?? null,
        response_path: f.response_path ?? null,
        permit_fee: f.permit_fee ?? null,
        effective_date: f.effective_date ?? null,
        agency_department: f.agency_department ?? null,
        agency_phone: f.agency_phone ?? null,
        agency_url: f.agency_url ?? null,
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
    // Static fallback: DB unavailable or unseeded → serve bundled demo findings.
    // Demo never depends on Postgres or OpenAI (backlog 16.10).
    let rows: Awaited<ReturnType<PrismaService['riskFinding']['findMany']>> =
      [];
    if (this.prisma.dbAvailable) {
      rows = await this.prisma.riskFinding
        .findMany({ where: { business_id: DEMO_BUSINESS_ID } })
        .catch(() => []);
    }

    if (rows.length === 0) {
      const findings = [...DEMO_FINDINGS].sort(
        (a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level],
      );
      const risk_score = Math.min(
        100,
        findings.reduce((s, f) => s + RISK_POINTS[f.risk_level], 0),
      );
      return {
        risk_score,
        risk_level: this.overallLevel(findings),
        findings,
        disclaimer: DISCLAIMER,
      };
    }

    const findings: RiskFinding[] = rows
      .map((r) => ({
        risk_level: r.risk_level as 'high' | 'medium' | 'low',
        affected_area: r.affected_area,
        explanation: r.explanation,
        recommended_action: r.recommended_action,
        source_url: r.source_url,
        prerequisites: r.prerequisites,
        is_hidden_requirement: r.is_hidden_requirement ?? undefined,
        response_path:
          (r.response_path as RiskFinding['response_path']) ?? undefined,
        permit_fee: r.permit_fee ?? undefined,
        effective_date: r.effective_date ?? undefined,
        agency_department: r.agency_department ?? undefined,
        agency_phone: r.agency_phone ?? undefined,
        agency_url: r.agency_url ?? undefined,
        confidence_level:
          (r.confidence_level as RiskFinding['confidence_level']) ?? undefined,
        jurisdiction_level:
          (r.jurisdiction_level as RiskFinding['jurisdiction_level']) ??
          undefined,
        money_risk: (r.money_risk as RiskFinding['money_risk']) ?? undefined,
        delay_risk: (r.delay_risk as RiskFinding['delay_risk']) ?? undefined,
        legal_severity:
          (r.legal_severity as RiskFinding['legal_severity']) ?? undefined,
        urgency: (r.urgency as RiskFinding['urgency']) ?? undefined,
        impact_score: r.impact_score ?? undefined,
        impact_label: r.impact_label ?? undefined,
        who_to_contact: r.who_to_contact ?? undefined,
        what_to_ask: r.what_to_ask ?? undefined,
        documents_needed: r.documents_needed,
        next_steps: r.next_steps,
      }))
      .sort((a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]);

    const risk_score = Math.min(
      100,
      findings.reduce((sum, f) => sum + RISK_POINTS[f.risk_level], 0),
    );
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
    "prerequisites": ["other permits/steps that must be completed before this one — empty array if none"],
    "is_hidden_requirement": true if this is easy to miss because it comes from a different agency or jurisdiction than the obvious one, otherwise false,
    "response_path": "one of: monitor | contact_agency | update_docs | change_plan | seek_clarification",
    "permit_fee": "estimated cost if mentioned in source (e.g. '~$3,000/year'), otherwise null",
    "effective_date": "when this requirement takes effect or deadline if mentioned, otherwise null",
    "agency_department": "specific department or division within the agency",
    "agency_phone": "agency phone number if available from source, otherwise null",
    "agency_url": "official agency website URL if mentioned in source, otherwise null",
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

    const parsed = JSON.parse(response.choices[0].message.content ?? '{}') as {
      findings?: RiskFinding[];
    };
    const raw: RiskFinding[] = parsed.findings ?? [];

    const verified = raw.filter(
      (f) =>
        typeof f.source_url === 'string' && f.source_url.startsWith('http'),
    );

    if (verified.length === 0) {
      throw new InternalServerErrorException(
        'No findings could be verified — all lacked valid citations.',
      );
    }

    return verified;
  }
}
