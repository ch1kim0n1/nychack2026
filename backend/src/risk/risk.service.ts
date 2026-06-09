import {
  Inject,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { RagService, RegulatoryChunk } from '../rag/rag.service';
import { BusinessProfile } from '../profile/profile.service';
import { OPENAI_CHAT_MODEL, OPENAI_CLIENT } from '../openai/openai.provider';
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

const NULL_STRING_FIELDS: ReadonlyArray<keyof RiskFinding> = [
  'permit_fee',
  'effective_date',
  'agency_phone',
  'agency_url',
  'agency_department',
  'who_to_contact',
  'what_to_ask',
  'impact_label',
];

function sanitizeFinding(f: RiskFinding): RiskFinding {
  const out = { ...f };
  for (const field of NULL_STRING_FIELDS) {
    if ((out[field] as unknown) === 'null') {
      delete out[field];
    }
  }
  return out;
}

const RISK_ORDER: Record<'high' | 'medium' | 'low', number> = {
  high: 0,
  medium: 1,
  low: 2,
};
const RISK_WEIGHTS: Record<'high' | 'medium' | 'low', number> = {
  high: 3,
  medium: 1.5,
  low: 0.5,
};
const EXPECTED_VERY_HIGH_RISK_WEIGHT = 15;
const DISCLAIMER = 'This is informational guidance, not legal advice.';
const DEMO_BUSINESS_ID = 'demo-biz-scenario-a';

export function calculateRiskScore(
  findings: Pick<RiskFinding, 'risk_level'>[],
): number {
  // Normalize weighted severity against a reference "very high risk" profile
  // of five high-risk findings. This preserves room above three highs while
  // preventing a few medium/low findings from immediately collapsing to 100.
  const raw = findings.reduce((sum, f) => sum + RISK_WEIGHTS[f.risk_level], 0);
  return Math.min(
    100,
    Math.round((raw / EXPECTED_VERY_HIGH_RISK_WEIGHT) * 100),
  );
}

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  // Idempotency cache: identical profiles return the first computed result
  // verbatim. LLM generation is only near-deterministic (temperature 0 + seed
  // still allow occasional risk_level drift), which would otherwise make the
  // risk_score wobble across repeated identical requests. Caching guarantees a
  // stable, reproducible answer for the same input — required for a trustworthy
  // regulatory tool — and avoids redundant OpenAI calls during a demo.
  private readonly analysisCache = new Map<string, RiskAnalysisResult>();

  constructor(
    private prisma: PrismaService,
    private ragService: RagService,
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
  ) {}

  /** Canonical key for a profile — order-insensitive so equivalent inputs map together. */
  private profileKey(profile: BusinessProfile): string {
    const norm = (s: string) => s.trim().toLowerCase();
    return JSON.stringify({
      industry: norm(profile.industry),
      location: norm(profile.location),
      employees: profile.employees ?? null,
      activities: [...profile.activities].map(norm).sort(),
      expansion_locations: [...profile.expansion_locations].map(norm).sort(),
    });
  }

  async analyze(profile: BusinessProfile): Promise<RiskAnalysisResult> {
    // Live analysis needs the vector store. Without a DB there is nothing to
    // retrieve, so fail with a clear, actionable error instead of an opaque 500.
    if (!this.prisma.dbAvailable) {
      throw new ServiceUnavailableException(
        'Live analysis requires the database and ingested sources. Start Postgres and run ingestion, or use GET /api/risk/demo for the validated demo.',
      );
    }

    // Return a prior identical analysis verbatim (deterministic per input).
    const cacheKey = this.profileKey(profile);
    const cached = this.analysisCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let findings: RiskFinding[];
    try {
      const chunks = await this.ragService.retrieve(profile);
      findings = await this.synthesize(profile, chunks);
    } catch (err) {
      if (err instanceof ServiceUnavailableException) {
        throw err;
      }
      this.logger.warn(
        `Live risk analysis unavailable: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'Live risk analysis is unavailable. Use the demo endpoint for cached results.',
      );
    }

    findings.sort(
      (a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level],
    );

    const risk_score = calculateRiskScore(findings);
    const risk_level = this.overallLevel(risk_score);

    // Persistence is secondary to the computed result: never let a write
    // failure drop a successful analysis. Save best-effort.
    try {
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
          review_state: this.requiresReview(f.affected_area)
            ? 'pending'
            : 'auto_approved',
        })),
      });
    } catch (err) {
      this.logger.warn(
        `Analysis computed but could not be saved: ${(err as Error).message}`,
      );
    }

    const result: RiskAnalysisResult = {
      risk_score,
      risk_level,
      findings,
      disclaimer: DISCLAIMER,
    };
    this.analysisCache.set(cacheKey, result);
    return result;
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
      const risk_score = calculateRiskScore(findings);
      return {
        risk_score,
        risk_level: this.overallLevel(risk_score),
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

    const risk_score = calculateRiskScore(findings);
    const risk_level = this.overallLevel(risk_score);

    return { risk_score, risk_level, findings, disclaimer: DISCLAIMER };
  }

  private requiresReview(affected_area: string): boolean {
    return /alcohol|tabc|zoning|health|fine|childcare/i.test(affected_area);
  }

  private overallLevel(riskScore: number): 'high' | 'medium' | 'low' {
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  private async synthesize(
    profile: BusinessProfile,
    chunks: RegulatoryChunk[],
  ): Promise<RiskFinding[]> {
    const context = chunks
      .map((c) => `SOURCE: ${c.source_url}\n${c.text}`)
      .join('\n\n---\n\n');

    const response = await this.openai.chat.completions.create(
      {
        model: OPENAI_CHAT_MODEL,
        temperature: 0,
        // Fixed seed + temperature 0 makes repeated identical requests
        // near-deterministic (stable findings, scores, and label wording).
        seed: 42,
        messages: [
          {
            role: 'system',
            content: `You are a Texas regulatory compliance analyst.
Given a business profile and regulatory source text, identify compliance requirements.

RULES:
- Every finding MUST have a source_url copied exactly from the provided context
- Do NOT invent findings not supported by the provided sources
- Return ONLY valid JSON — no markdown, no explanation
- For optional fields: omit the field entirely if the value is not found in the source — do NOT output the string "null"

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
    "permit_fee": "(optional) estimated cost if explicitly mentioned in source, e.g. '~$3,000/year' — omit if not mentioned",
    "effective_date": "(optional) deadline or effective date if explicitly mentioned in source — omit if not mentioned",
    "agency_department": "specific department or division within the agency",
    "agency_phone": "(optional) agency phone number if explicitly stated in source — omit if not available",
    "agency_url": "(optional) official agency website URL if explicitly stated in source — omit if not mentioned",
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
      },
      { timeout: 60_000 },
    );

    const parsed = JSON.parse(response.choices[0].message.content ?? '{}') as {
      findings?: RiskFinding[];
    };
    const raw: RiskFinding[] = (parsed.findings ?? []).map(sanitizeFinding);

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
