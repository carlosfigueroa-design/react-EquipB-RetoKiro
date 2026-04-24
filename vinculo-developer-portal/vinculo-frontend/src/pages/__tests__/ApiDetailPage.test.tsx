import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ApiDetailPage from '../ApiDetailPage';

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: {
        id: 'test-api-1',
        name: 'Cotización Vida',
        slug: 'cotizacion-vida',
        description: 'API de cotización de seguros de vida',
        descriptionEn: 'Life insurance quotation API',
        product: 'Vida',
        process: 'Cotización',
        currentVersion: '1.0.0',
        lifecycleState: 'ACTIVE',
        slaUptime: 99.9,
        contactName: 'Juan Pérez',
        contactEmail: 'juan@segurosbolivar.com',
        contactSlack: '#vida-api',
        specOpenApi: { openapi: '3.1.0', info: { title: 'Cotización Vida', version: '1.0.0' }, paths: {} },
        testCases: [
          { name: 'Happy Path', description: 'Cotización exitosa', type: 'happy_path', endpoint: '/cotizar', method: 'POST', expectedStatus: 200 },
        ],
        codeSnippets: { javascript: 'fetch("/api/cotizar")', python: 'requests.post("/api/cotizar")' },
      },
    }),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/catalog/test-api-1']}>
      <Routes>
        <Route path="/catalog/:apiId" element={<ApiDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ApiDetailPage', () => {
  it('renders the tab navigation', async () => {
    renderWithRouter();
    expect(await screen.findByRole('tab', { name: /descripción/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /documentación/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /casos de prueba/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /sandbox/i })).toBeInTheDocument();
  });

  it('renders the API name after loading', async () => {
    renderWithRouter();
    expect(await screen.findByText('Cotización Vida')).toBeInTheDocument();
  });

  it('renders the description tab by default', async () => {
    renderWithRouter();
    expect(await screen.findByText('Descripción (ES)')).toBeInTheDocument();
  });
});
