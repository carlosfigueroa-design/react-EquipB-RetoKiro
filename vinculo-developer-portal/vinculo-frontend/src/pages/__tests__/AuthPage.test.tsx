import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from '../AuthPage';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>,
  );
}

describe('AuthPage', () => {
  it('renders the email step by default', () => {
    renderWithRouter();
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar código otp/i })).toBeInTheDocument();
  });

  it('renders the email input with proper attributes', () => {
    renderWithRouter();
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toBeRequired();
  });

  it('renders the email form with accessible label', () => {
    renderWithRouter();
    expect(screen.getByRole('form', { name: /formulario de email/i })).toBeInTheDocument();
  });
});
