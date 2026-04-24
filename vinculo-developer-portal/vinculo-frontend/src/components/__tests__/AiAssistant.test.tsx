import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiAssistant from '../AiAssistant';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: { response: 'Respuesta del asistente IA.' } }),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: null,
    token: null,
  }),
}));

function renderComponent(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AiAssistant />
    </MemoryRouter>,
  );
}

describe('AiAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the floating button', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /abrir asistente ia/i })).toBeInTheDocument();
  });

  it('opens the chat panel when clicking the floating button', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente ia/i }));
    expect(screen.getByRole('dialog', { name: /asistente ia/i })).toBeInTheDocument();
    expect(screen.getByText('Asistente VÍNCULO')).toBeInTheDocument();
  });

  it('shows public mode label when not authenticated', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente ia/i }));
    expect(screen.getByText('Modo público')).toBeInTheDocument();
  });

  it('renders the message input and send button', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente ia/i }));
    expect(screen.getByLabelText('Mensaje al asistente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar mensaje/i })).toBeInTheDocument();
  });

  it('sends a message and shows it in the chat', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente ia/i }));

    const input = screen.getByLabelText('Mensaje al asistente');
    fireEvent.change(input, { target: { value: '¿Qué APIs hay disponibles?' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar mensaje/i }));

    expect(screen.getByText('¿Qué APIs hay disponibles?')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Respuesta del asistente IA.')).toBeInTheDocument();
    });
  });

  it('closes the chat panel when clicking close', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente ia/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cerrar asistente ia/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
