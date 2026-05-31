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
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
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

  analyzeRisk: (profile: BusinessProfile) =>
    apiFetch<RiskAnalysisResult>('/api/risk/analyze', {
      method: 'POST',
      body: JSON.stringify({ profile }),
    }),

  getDemoRisk: () =>
    apiFetch<RiskAnalysisResult>('/api/risk/demo'),

  getDiff: (scenario = 'scenario-a') =>
    apiFetch<ScenarioDiff>(`/api/diff/${scenario}`),
}
