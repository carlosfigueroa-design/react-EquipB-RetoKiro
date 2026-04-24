import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  it('renders the hero section with title and CTA', () => {
    renderWithRouter();
    expect(screen.getByText('VÍNCULO Developer Portal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /registrarse o iniciar sesión/i })).toHaveAttribute('href', '/auth');
  });

  it('renders featured APIs for each product line', () => {
    renderWithRouter();
    expect(screen.getByText('Vida')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();
    expect(screen.getByText('Hogar')).toBeInTheDocument();
    expect(screen.getByText('Salud')).toBeInTheDocument();
  });

  it('renders the benefits section with 3 cards', () => {
    renderWithRouter();
    expect(screen.getByText('Autoservicio')).toBeInTheDocument();
    expect(screen.getByText('Sandbox Interactivo')).toBeInTheDocument();
    expect(screen.getByText('Documentación IA')).toBeInTheDocument();
  });

  it('renders a visible search bar', () => {
    renderWithRouter();
    expect(screen.getByRole('search', { name: /buscar apis/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar apis/i)).toBeInTheDocument();
  });

  it('has proper accessibility landmarks', () => {
    renderWithRouter();
    expect(screen.getByRole('region', { name: /hero/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /apis destacadas/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /beneficios/i })).toBeInTheDocument();
  });
});
