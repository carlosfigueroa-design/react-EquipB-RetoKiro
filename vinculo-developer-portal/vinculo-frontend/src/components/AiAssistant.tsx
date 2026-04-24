import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CATALOG_APIS, getApiById } from '@/lib/catalogData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  apiLink?: { id: string; name: string };
  codeSnippet?: string;
}

const SUGGESTIONS = [
  '¿Cómo emitir una póliza?',
  '¿Cómo consultar siniestros?',
  '¿Cómo cotizar un seguro?',
];

let msgCounter = 0;
function genId(): string { return `msg-${Date.now()}-${++msgCounter}`; }

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  function handleSend(text?: string) {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: genId(), role: 'user', content: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response with API knowledge
    setTimeout(() => {
      const response = generateAiResponse(trimmed);
      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 800 + Math.random() * 700);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#2E7D32] text-white rounded-full shadow-xl hover:bg-[#F9A825] hover:text-[#1A3C0E] transition-all duration-300 hover:scale-110 hover:rotate-12 flex items-center justify-center"
        aria-label={isOpen ? 'Cerrar asistente IA' : 'Abrir asistente IA'}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" role="dialog" aria-label="Asistente IA">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A3C0E] to-[#2E7D32] text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg" aria-hidden="true">🤖</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-sm">Asistente IA</h3>
                <p className="text-[10px] text-white/60 font-body">Pregúntame sobre las APIs de Vínculo Bolívar</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors p-1" aria-label="Cerrar">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-label="Conversación">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">🤖</span>
                </div>
                <p className="font-display font-bold text-primary text-sm mb-1">¡Hola! Soy el asistente de APIs</p>
                <p className="font-body text-xs text-gray-500 mb-5">Puedo ayudarte a encontrar la API correcta para tu caso de uso. Prueba con:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="text-xs font-body text-secondary border border-secondary/30 rounded-full px-3 py-1.5 hover:bg-[#F9A825]/10 hover:border-[#F9A825] hover:text-[#F9A825] transition-all duration-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#2E7D32] text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-4 h-4 bg-[#76C442] rounded-full flex items-center justify-center text-[8px] text-white font-bold">✓</span>
                    </div>
                  )}
                  <p className="text-sm font-body whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {msg.apiLink && (
                    <Link
                      to={`/catalog/${msg.apiLink.id}`}
                      onClick={() => setIsOpen(false)}
                      className={`mt-2 inline-flex items-center gap-1 text-xs font-body font-semibold ${
                        msg.role === 'user' ? 'text-white/80 hover:text-white' : 'text-secondary hover:underline'
                      }`}
                    >
                      📋 Ver detalle de {msg.apiLink.name}
                    </Link>
                  )}

                  {msg.codeSnippet && (
                    <div className="mt-3 bg-gray-900 rounded-lg p-3 overflow-x-auto">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-gray-400">Ejemplo cURL</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(msg.codeSnippet || '')}
                          className="text-[10px] font-body text-gray-400 hover:text-white transition-colors"
                        >
                          📋 Copiar
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-amber-300 whitespace-pre-wrap">{msg.codeSnippet}</pre>
                    </div>
                  )}

                  <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/40' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu consulta sobre APIs..."
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                disabled={loading}
                aria-label="Mensaje al asistente"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="bg-[#2E7D32] hover:bg-[#F9A825] hover:text-[#1A3C0E] text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                aria-label="Enviar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── AI Response Generator ── */
function generateAiResponse(query: string): Message {
  const q = query.toLowerCase();
  let content = '';
  let apiLink: { id: string; name: string } | undefined;
  let codeSnippet: string | undefined;

  // Match against known APIs and topics
  if (q.includes('emitir') || q.includes('emisión') || q.includes('póliza nueva') || q.includes('crear póliza')) {
    const api = getApiById('api-emision-polizas')!;
    content = `Para emitir una nueva póliza, utiliza la **${api.name}**. Esta API permite crear pólizas de seguros proporcionando los datos del asegurado, tipo de cobertura y plan seleccionado. Soporta productos de vida, hogar, auto y salud.`;
    apiLink = { id: api.id, name: api.name };
    codeSnippet = api.codeSnippets.curl;
  } else if (q.includes('cotizar') || q.includes('cotización') || q.includes('precio') || q.includes('prima')) {
    const api = getApiById('api-cotizacion-seguros')!;
    content = `Para cotizar un seguro, usa la **${api.name}**. Genera cotizaciones en tiempo real con cálculo automático de prima basado en perfil de riesgo y coberturas seleccionadas. Soporta vida, auto, hogar y salud.`;
    apiLink = { id: api.id, name: api.name };
    codeSnippet = api.codeSnippets.curl;
  } else if (q.includes('siniestro') || q.includes('reclamación') || q.includes('accidente')) {
    const api = getApiById('api-registro-siniestros')!;
    content = `Para registrar un siniestro, utiliza la **${api.name}**. Permite radicar siniestros de todas las líneas de producto con documentación adjunta y seguimiento de estado.`;
    apiLink = { id: api.id, name: api.name };
    codeSnippet = api.codeSnippets.curl;
  } else if (q.includes('renovar') || q.includes('renovación')) {
    const api = getApiById('api-renovacion-polizas')!;
    content = `Para renovar pólizas, usa la **${api.name}**. Soporta renovación automática al vencimiento y renovación manual anticipada con recálculo de prima.`;
    apiLink = { id: api.id, name: api.name };
  } else if (q.includes('consultar') || q.includes('buscar póliza') || q.includes('estado póliza')) {
    const api = getApiById('api-consulta-polizas')!;
    content = `Para consultar pólizas, usa la **${api.name}**. Permite buscar por número de póliza, documento del asegurado o filtros avanzados.`;
    apiLink = { id: api.id, name: api.name };
  } else if (q.includes('cancelar') || q.includes('cancelación') || q.includes('rescate')) {
    const api = getApiById('api-cancelacion-polizas')!;
    content = `Para cancelar pólizas, usa la **${api.name}**. Soporta cancelación voluntaria, por mora y cálculo de valor de rescate.`;
    apiLink = { id: api.id, name: api.name };
  } else if (q.includes('pago') || q.includes('pagar') || q.includes('prima')) {
    const api = getApiById('api-pagos')!;
    content = `Para procesar pagos de primas, usa la **${api.name}**. Soporta PSE, tarjeta, efectivo y débito automático.`;
    apiLink = { id: api.id, name: api.name };
  } else if (q.includes('auto') || q.includes('vehículo') || q.includes('soat') || q.includes('carro')) {
    const api = getApiById('api-cotizacion-auto')!;
    content = `Para seguros de auto, usa la **${api.name}**. Integra con FASECOLDA para validación de vehículos y calcula prima basada en modelo, año y ciudad. Incluye SOAT y todo riesgo.`;
    apiLink = { id: api.id, name: api.name };
    codeSnippet = api.codeSnippets.curl;
  } else if (q.includes('salud') || q.includes('beneficiario') || q.includes('preexistencia')) {
    const api = getApiById('api-salud-beneficiarios')!;
    content = `Para planes de salud, usa la **${api.name}**. Verifica elegibilidad, preexistencias médicas y períodos de carencia.`;
    apiLink = { id: api.id, name: api.name };
  } else if (q.includes('hogar') || q.includes('casa') || q.includes('vivienda')) {
    content = `Para seguros de hogar, puedes usar la **API de Consulta de Pólizas** para verificar coberturas existentes, o la **API de Cotización de Seguros** para generar nuevas cotizaciones de hogar con cobertura personalizada por zona.`;
    apiLink = { id: 'api-cotizacion-seguros', name: 'API de Cotización de Seguros' };
  } else if (q.includes('api') || q.includes('catálogo') || q.includes('disponible')) {
    content = `Tenemos ${CATALOG_APIS.length} APIs disponibles en el catálogo:\n\n${CATALOG_APIS.map(a => `• **${a.name}** — ${a.description}`).join('\n')}\n\n¿Sobre cuál te gustaría saber más?`;
  } else {
    content = `Puedo ayudarte con información sobre las APIs de Vínculo. Tenemos APIs para:\n\n• **Emisión** de pólizas\n• **Cotización** de seguros (vida, auto, hogar, salud)\n• **Siniestros** — registro y seguimiento\n• **Renovación** de pólizas\n• **Consultas** de pólizas\n• **Pagos** de primas\n• **Validación** de beneficiarios\n\n¿Qué necesitas hacer?`;
  }

  return {
    id: genId(),
    role: 'assistant',
    content,
    timestamp: new Date(),
    apiLink,
    codeSnippet,
  };
}
