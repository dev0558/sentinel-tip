const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Dashboard
export const getDashboardStats = () => fetchAPI<import('./types').DashboardStats>('/api/v1/dashboard/stats');
export const getDashboardTimeline = (limit = 50) => fetchAPI<import('./types').TimelineEntry[]>(`/api/v1/dashboard/timeline?limit=${limit}`);
export const getDashboardGeo = () => fetchAPI<import('./types').GeoData[]>('/api/v1/dashboard/geo');
export const getTopThreats = (limit = 20) => fetchAPI<import('./types').TopThreat[]>(`/api/v1/dashboard/top-threats?limit=${limit}`);
export const getFeedHealth = () => fetchAPI<import('./types').FeedHealth[]>('/api/v1/dashboard/feed-health');
export const getTrends = (days = 7) => fetchAPI<import('./types').TrendPoint[]>(`/api/v1/dashboard/trends?days=${days}`);

// IOCs
export const getIOCs = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchAPI<import('./types').PaginatedResponse<import('./types').IOC>>(`/api/v1/iocs${query}`);
};
export const getIOC = (id: string) => fetchAPI<import('./types').IOCDetail>(`/api/v1/iocs/${id}`);
export const searchIOCs = (filters: import('./types').SearchFilters) =>
  fetchAPI<import('./types').PaginatedResponse<import('./types').IOC>>('/api/v1/iocs/search', {
    method: 'POST',
    body: JSON.stringify(filters),
  });
export const bulkLookup = (values: string[]) =>
  fetchAPI<import('./types').IOC[]>('/api/v1/iocs/bulk', {
    method: 'POST',
    body: JSON.stringify({ values }),
  });
export const updateIOCTags = (id: string, tags: string[]) =>
  fetchAPI<import('./types').IOC>(`/api/v1/iocs/${id}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ tags }),
  });
export const getIOCEnrichment = (id: string) => fetchAPI<unknown[]>(`/api/v1/iocs/${id}/enrichment`);
export const triggerEnrichment = (id: string) =>
  fetchAPI<unknown>(`/api/v1/iocs/${id}/enrich`, { method: 'POST' });
export const getIOCRelationships = (id: string) => fetchAPI<import('./types').IOCRelationship[]>(`/api/v1/iocs/${id}/relationships`);
export const getIOCTimeline = (id: string) => fetchAPI<unknown[]>(`/api/v1/iocs/${id}/timeline`);

// Feeds
export const getFeeds = () => fetchAPI<import('./types').FeedSource[]>('/api/v1/feeds');
export const triggerFeedSync = (id: string) =>
  fetchAPI<unknown>(`/api/v1/feeds/${id}/sync`, { method: 'POST' });
export const updateFeed = (id: string, data: Partial<import('./types').FeedSource>) =>
  fetchAPI<import('./types').FeedSource>(`/api/v1/feeds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// ATT&CK
export const getAttackMatrix = () => fetchAPI<import('./types').AttackMatrix>('/api/v1/attack/matrix');
export const getAttackHeatmap = (minScore = 0) => fetchAPI<import('./types').HeatmapEntry[]>(`/api/v1/attack/heatmap?min_score=${minScore}`);
export const getAttackTechnique = (id: string) => fetchAPI<unknown>(`/api/v1/attack/techniques/${id}`);

// Reports
export const getReports = () => fetchAPI<{ items: import('./types').Report[]; total: number }>('/api/v1/reports');
export const generateReport = (data: Record<string, unknown>) =>
  fetchAPI<import('./types').Report>('/api/v1/reports/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const getDailyBrief = () => fetchAPI<unknown>('/api/v1/reports/daily-brief');

// Health
export const getHealth = () => fetchAPI<{ status: string }>('/api/v1/health');
