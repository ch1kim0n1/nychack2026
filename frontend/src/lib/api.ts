const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface BusinessProfile {
  industry: string
  location: string
  expansion_locations: string[]
  activities: string[]
  employees: number | null
}

export interface RiskFinding {
  risk_level: 'high' | 'medium' | 'low'
  affected_area: string
  explanation: string
  recommended_action: string
  source_url: string
  // Regulatory intelligence
  prerequisites?: string[]
  is_hidden_requirement?: boolean
  response_path?: 'monitor' | 'contact_agency' | 'update_docs' | 'change_plan' | 'seek_clarification'
  // Stakeholder + cost + timing
  permit_fee?: string
  effective_date?: string
  agency_department?: string
  agency_phone?: string
  agency_url?: string
  // Trust & citation
  confidence_level?: 'high' | 'medium' | 'low'
  jurisdiction_level?: 'city' | 'county' | 'state' | 'federal' | 'agency'
  // Phase 1 — impact dimensions
  money_risk?: 'high' | 'medium' | 'low'
  delay_risk?: 'high' | 'medium' | 'low'
  legal_severity?: 'high' | 'medium' | 'low'
  urgency?: 'immediate' | 'soon' | 'ongoing'
  impact_score?: number
  impact_label?: string
  // Phase 1 — action playbook
  who_to_contact?: string
  what_to_ask?: string
  documents_needed?: string[]
  next_steps?: string[]
}

export interface DraftResult {
  channel: 'email' | 'call_script' | 'landlord'
  subject?: string
  body: string
  agency_name: string
  source_url: string
}

export interface RiskAnalysisResult {
  risk_score: number
  risk_level: 'high' | 'medium' | 'low'
  findings: RiskFinding[]
  disclaimer: string
}

export interface DiffItem {
  category: string
  dallas: string | null
  austin: string | null
  status: 'new' | 'changed' | 'same'
  source_a: string | null
  source_b: string | null
}

export interface ScenarioDiff {
  scenario: string
  title: string
  city_a: string
  city_b: string
  differences: DiffItem[]
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    signal: init?.signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  classifyProfile: (input: string) =>
    apiFetch<BusinessProfile>('/api/profile/classify', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),

  analyzeRisk: (profile: BusinessProfile, signal?: AbortSignal) =>
    apiFetch<RiskAnalysisResult>('/api/risk/analyze', {
      method: 'POST',
      body: JSON.stringify({ profile }),
      signal,
    }),

  getDemoRisk: (signal?: AbortSignal) =>
    apiFetch<RiskAnalysisResult>('/api/risk/demo', { signal }),

  getDiff: (scenario = 'scenario-a') =>
    apiFetch<ScenarioDiff>(`/api/diff/${scenario}`),

  citationCoverage: () =>
    apiFetch<{ total_findings: number; cited_findings: number; coverage_percent: number }>(
      '/api/metrics/citation-coverage',
    ),

  generateDraft: (params: {
    affected_area: string
    explanation: string
    recommended_action: string
    source_url: string
    who_to_contact?: string
    what_to_ask?: string
    business_description: string
    channel?: 'email' | 'call_script' | 'landlord'
  }) =>
    apiFetch<DraftResult>('/api/draft', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
}
