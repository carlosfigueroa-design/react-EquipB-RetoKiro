import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CatalogPage from '../CatalogPage';

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { items: [], total: 0, totalPages: 1 } }),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

function renderWithRouter(initialEntries = ['/catalog']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <CatalogPage />
    </MemoryRouter>,
  );
}

describe('CatalogPage', () => {
  it('renders the page title', () => {
    renderWithRouter();
    expect(screen.getByText('Catálogo de APIs')).toBeInTheDocument();
  });

  it('renders the search bar', () => {
    renderWithRouter();
    expect(screen.getByPlaceholderText(/buscar apis/i)).toBeInTheDocument();
  });

  it('renders filter sidebar with product options', () => {
    renderWithRouter();
    expect(screen.getByText('Filtros')).toBeInTheDocument();
    expect(screen.getByText('Vida')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();
    expect(screen.getByText('Hogar')).toBeInTheDocument();
    expect(screen.getByText('Salud')).toBeInTheDocument();
    expect(screen.getByText('Open Finance')).toBeInTheDocument();
    expect(screen.getByText('Identity Security')).toBeInTheDocument();
  });

  it('renders the clear filters button', () => {
    renderWithRouter();
    expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument();
  });
});
