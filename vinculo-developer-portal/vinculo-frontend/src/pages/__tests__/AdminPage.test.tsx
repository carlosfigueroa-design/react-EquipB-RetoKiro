import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminPage from '../AdminPage';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'Cotización Auto',
          product: 'AUTO',
          process: 'COTIZACION',
          lifecycleState: 'ACTIVE',
          currentVersion: '1.0.0',
          slaUptime: 99.9,
        },
        {
          id: '2',
          name: 'Emisión Vida',
          product: 'VIDA',
          process: 'EMISION',
          lifecycleState: 'DRAFT',
          currentVersion: '0.1.0',
          slaUptime: null,
        },
      ],
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>,
  );
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', () => {
    renderPage();
    expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
  });

  it('renders the create API and upload spec buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /crear api con ia/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subir especificación openapi/i })).toBeInTheDocument();
  });

  it('renders the APIs table with data', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Cotización Auto')).toBeInTheDocument();
    });
    expect(screen.getByText('Emisión Vida')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('Borrador')).toBeInTheDocument();
  });

  it('renders governance action buttons based on state', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Cotización Auto')).toBeInTheDocument();
    });
    // ACTIVE API should have Deprecar button
    expect(screen.getByRole('button', { name: /deprecar cotización auto/i })).toBeInTheDocument();
    // DRAFT API should have Publicar button
    expect(screen.getByRole('button', { name: /publicar emisión vida/i })).toBeInTheDocument();
  });

  it('renders the APIs table header', () => {
    renderPage();
    expect(screen.getByText('APIs del Portal')).toBeInTheDocument();
  });
});
