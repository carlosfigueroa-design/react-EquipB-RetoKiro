import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ObservabilityPage from '../ObservabilityPage';

const mockMetrics = [
  { apiId: '1', apiName: 'Cotización Auto', callCount: 12500, avgLatencyMs: 120, errorRate: 1.2 },
  { apiId: '2', apiName: 'Emisión Vida', callCount: 8300, avgLatencyMs: 250, errorRate: 3.5 },
];

const mockAlerts = [
  {
    id: 'a1',
    type: 'QUOTA_WARNING',
    message: 'Aliado XYZ alcanzó el 80% de su cuota mensual.',
    apiName: 'Cotización Auto',
    severity: 'warning',
    createdAt: '2024-01-15T10:30:00Z',
  },
];

const mockLatency = { p50: 80, p95: 200, p99: 450 };

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('/metrics')) return Promise.resolve({ data: mockMetrics });
      if (url.includes('/alerts')) return Promise.resolve({ data: mockAlerts });
      if (url.includes('/latency/')) return Promise.resolve({ data: mockLatency });
      if (url.includes('/traces/')) return Promise.resolve({ data: { steps: [] } });
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn().mockResolvedValue({ data: new Blob(['csv-data']) }),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ObservabilityPage />
    </MemoryRouter>,
  );
}

describe('ObservabilityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', () => {
    renderPage();
    expect(screen.getByText('Dashboard de Observabilidad')).toBeInTheDocument();
  });

  it('renders the export CSV button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /exportar csv/i })).toBeInTheDocument();
  });

  it('renders metrics cards after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Cotización Auto').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('Emisión Vida').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the latency percentiles table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Percentiles de Latencia')).toBeInTheDocument();
    });
  });

  it('renders active alerts', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/alcanzó el 80%/i)).toBeInTheDocument();
    });
  });

  it('renders the trace search section after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Trazabilidad Distribuida')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Trace ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buscar trace/i })).toBeInTheDocument();
  });
});
