/**
 * VÍNCULO API Client
 * Uses Vite proxy in dev (/v1, /v2, /v3 → backend:4000)
 * Uses VITE_API_URL in production builds
 */
const API_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || '')
  : '';  // In dev, use Vite proxy (relative URLs)

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('vinculo_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...((options?.headers as Record<string, string>) || {}) },
    });
  } catch (networkErr) {
    throw new Error(
      'No se pudo conectar con el servidor. Verifica que el backend esté corriendo (docker-compose up --build).'
    );
  }

  if (!res.ok) {
    let errorBody: any;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { message: `Error del servidor (HTTP ${res.status})` };
    }

    // NestJS validation errors come as array
    const msg =
      Array.isArray(errorBody.message)
        ? errorBody.message.join('. ')
        : errorBody.message || `Error HTTP ${res.status}`;

    throw new Error(msg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<any>('/v2/vinculo/auth/token', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Onboarding
  register: (data: any) =>
    request<any>('/v1/vinculo/onboarding/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Apps
  getApps: () => request<any[]>('/v1/vinculo/apps'),
  createApp: (name: string) =>
    request<any>('/v1/vinculo/apps', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  // Catalog
  getCatalog: (domain?: string, search?: string) => {
    const params = new URLSearchParams();
    if (domain) params.set('domain', domain);
    if (search) params.set('search', search);
    return request<any>(`/v1/vinculo/catalog/apis?${params}`);
  },
  getApiDetail: (id: string) => request<any>(`/v1/vinculo/catalog/apis/${id}`),
  getDomains: () => request<any[]>('/v1/vinculo/catalog/domains'),

  // Sandbox
  executeSandbox: (data: { method: string; path: string; headers?: any; body?: any }) =>
    request<any>('/v1/vinculo/sandbox/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Metrics
  getQuotas: () => request<any>('/v1/vinculo/aliado/cuotas'),
  getMetrics: () => request<any>('/v1/vinculo/aliado/metricas'),

  // Analytics
  getAnalyticsOverview: () => request<any>('/v1/vinculo/analytics/overview'),

  // Admin (RU-07)
  adminDashboard: () => request<any>('/v1/vinculo/admin/dashboard'),
  adminListAliados: (status?: string, type?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    return request<any>(`/v1/vinculo/admin/aliados?${params}`);
  },
  adminApprove: (id: string) =>
    request<any>(`/v1/vinculo/admin/aliados/${id}/approve`, { method: 'POST' }),
  adminSuspend: (id: string, reason?: string) =>
    request<any>(`/v1/vinculo/admin/aliados/${id}/suspend`, {
      method: 'POST', body: JSON.stringify({ reason }),
    }),
  adminReactivate: (id: string) =>
    request<any>(`/v1/vinculo/admin/aliados/${id}/reactivate`, { method: 'POST' }),
  adminRevokeApp: (aliadoId: string, appId: string) =>
    request<any>(`/v1/vinculo/admin/aliados/${aliadoId}/apps/${appId}/revoke`, { method: 'POST' }),

  // Audit (RU-08)
  getAuditLogs: (filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters);
    return request<any>(`/v1/vinculo/audit/logs?${params}`);
  },
  getComplianceReport: () => request<any>('/v1/vinculo/audit/compliance'),

  // Notifications (RU-06)
  getNotifications: () => request<any>('/v1/vinculo/notifications'),
  markNotificationRead: (id: string) =>
    request<any>(`/v1/vinculo/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    request<any>('/v1/vinculo/notifications/read-all', { method: 'POST' }),

  // Governance (RU-09)
  getVersions: (apiName?: string) => {
    const params = apiName ? `?apiName=${apiName}` : '';
    return request<any>(`/v1/vinculo/governance/versions${params}`);
  },
  getVersionTimeline: () => request<any>('/v1/vinculo/governance/timeline'),

  // Health
  health: () => request<any>('/health'),
};
