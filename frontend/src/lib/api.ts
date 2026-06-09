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
  // Phase 1, impact dimensions
  money_risk?: 'high' | 'medium' | 'low'
  delay_risk?: 'high' | 'medium' | 'low'
  legal_severity?: 'high' | 'medium' | 'low'
  urgency?: 'immediate' | 'soon' | 'ongoing'
  impact_score?: number
  impact_label?: string
  // Phase 1, action playbook
  who_to_contact?: string
  what_to_ask?: string
  documents_needed?: string[]
  next_steps?: string[]
  // Manual validation
  review_state?: string // "pending" | "approved" | "rejected" | "auto_approved"
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

export interface SavedProfile {
  id: string
  client_id: string
  label: string
  profile_json: BusinessProfile
  created_at: string
  updated_at: string
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

export interface RadarThreat {
  source_id: string
  title: string
  agency: string
  jurisdiction: string
  source_url: string
  last_checked_at: string | null
  matched_tags: string[]
}

export interface RadarResponse {
  threats: RadarThreat[]
  generated_at: string
  profile_summary: string
}

export interface DigestItem {
  level: 'high' | 'medium' | 'low'
  title: string
  body: string
  link: string
  agency: string
}

export interface PulseDigest {
  items: DigestItem[]
  generated_at: string
  personalized: boolean
  business_label: string
}

export interface AdminFinding {
  id: string
  review_state: string
  affected_area: string
  risk_level: 'high' | 'medium' | 'low'
  explanation: string
  source_url: string
  confidence_level?: string
  created_at: string
}

export interface ReviewStats {
  pending: number
  approved: number
  rejected: number
  auto_approved: number
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
  const contentLength = res.headers.get('content-length')
  if (contentLength === '0' || res.status === 204) {
    return undefined as unknown as T
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

  watchlist: {
    list: (clientId: string) =>
      apiFetch<SavedProfile[]>(`/api/watchlist?client_id=${encodeURIComponent(clientId)}`),

    save: (params: { client_id: string; label: string; profile: BusinessProfile }) =>
      apiFetch<SavedProfile>('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    remove: (id: string, clientId: string) =>
      apiFetch<void>(`/api/watchlist/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        body: JSON.stringify({ client_id: clientId }),
      }),
  },

  radarThreats: (profile: BusinessProfile, days?: number) =>
    apiFetch<RadarResponse>('/api/radar', {
      method: 'POST',
      body: JSON.stringify({ profile, days }),
    }),

  getPulseDigest: (profile: BusinessProfile) =>
    apiFetch<PulseDigest>('/api/pulse', {
      method: 'POST',
      body: JSON.stringify({ profile }),
    }),

  getAdminPendingFindings: (adminApiKey: string) =>
    apiFetch<AdminFinding[]>('/api/admin/findings/pending', {
      headers: { 'x-admin-api-key': adminApiKey },
    }),

  reviewFinding: (
    id: string,
    state: 'approved' | 'rejected',
    note: string | undefined,
    adminApiKey: string,
  ) =>
    apiFetch<AdminFinding>(`/api/admin/findings/${id}/review`, {
      method: 'PATCH',
      headers: { 'x-admin-api-key': adminApiKey },
      body: JSON.stringify({ state, note }),
    }),

  getAdminStats: (adminApiKey: string) =>
    apiFetch<ReviewStats>('/api/admin/stats', {
      headers: { 'x-admin-api-key': adminApiKey },
    }),
}
