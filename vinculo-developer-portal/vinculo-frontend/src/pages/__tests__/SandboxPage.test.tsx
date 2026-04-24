import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SandboxPage from '../SandboxPage';

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { items: [] } }),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/sandbox/test-api-1']}>
      <Routes>
        <Route path="/sandbox/:apiId" element={<SandboxPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SandboxPage', () => {
  it('renders the page title', () => {
    renderWithRouter();
    expect(screen.getByText('Sandbox Interactivo')).toBeInTheDocument();
  });

  it('renders the HTTP method selector', () => {
    renderWithRouter();
    expect(screen.getByLabelText(/método http/i)).toBeInTheDocument();
  });

  it('renders the endpoint input', () => {
    renderWithRouter();
    expect(screen.getByLabelText(/url del endpoint/i)).toBeInTheDocument();
  });

  it('renders the execute button', () => {
    renderWithRouter();
    expect(screen.getByRole('button', { name: /ejecutar/i })).toBeInTheDocument();
  });

  it('shows demo mode badge for unauthenticated users', () => {
    renderWithRouter();
    expect(screen.getByText('Modo Demo')).toBeInTheDocument();
  });

  it('renders the error scenario selector', () => {
    renderWithRouter();
    expect(screen.getByLabelText(/escenario de error/i)).toBeInTheDocument();
  });
});
