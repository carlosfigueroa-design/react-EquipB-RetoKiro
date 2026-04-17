---
inclusion: auto
---

# Reglas de Testing Fullstack — Cobertura SonarQube

## Mandato de Coherencia

Por cada cambio en lógica de negocio (Frontend o Backend), se DEBE generar automáticamente el código del test unitario correspondiente. No se acepta código de lógica sin su test asociado.

---

## Frontend (React + TypeScript)

### Framework de Testing

- Vitest como framework de testing (compatible con Vite).
- React Testing Library para tests de componentes.
- Cada componente, hook, servicio y utilidad DEBE tener su archivo `.test.tsx` o `.test.ts` junto al archivo fuente.

### Reglas Obligatorias

- Simular estados de carga (`loading`), éxito (`success`) y error (`error`) en cada componente que consuma datos asíncronos.
- Mockear llamadas HTTP con `vi.mock()` o `msw`. Nunca hacer llamadas reales en tests.
- Verificar renderizado condicional: elementos que aparecen/desaparecen según estado.
- Testear event handlers (`handleClick`, `handleSubmit`, etc.) y validar que llamen los servicios correctos.
- Para Web Components (`<sb-ui-datepicker>`, `<sb-ui-modal>`, etc.), verificar que se rendericen sin errores.

### Estructura de un Test de Componente

```typescript
describe('MiComponente', () => {
  // Setup con render()
  // Test: debe crear el componente
  // Test: debe mostrar spinner en estado loading
  // Test: debe mostrar datos en estado success
  // Test: debe mostrar mensaje de error en estado error
  // Test: debe llamar al servicio al ejecutar acción
});
```

### Estructura de un Test de Hook

```typescript
describe('useMiHook', () => {
  // Setup con renderHook()
  // Test: debe retornar estado inicial
  // Test: debe actualizar estado al llamar función
  // Test: debe manejar errores
});
```

---

## Backend — Node.js (NestJS)

### Framework de Testing

- Jest + Supertest para tests de integración de APIs.
- Jest para tests unitarios de servicios y utilidades.

### Reglas Obligatorias

- Probar las 3 capas: Controladores (rutas), Servicios (lógica) y Repositorios (acceso a datos).
- Mockear conexiones a PostgreSQL y Redis con `jest.mock()` o `jest.spyOn()`.
- Cada endpoint debe tener tests para: respuesta exitosa (200/201), validación fallida (400), no autorizado (401), no encontrado (404) y error interno (500).
- Validar que el `Correlation-ID` se propague correctamente entre capas.
- Testear middleware de autenticación (JWT) con tokens válidos, expirados e inválidos.

### Estructura de un Test de Controlador

```typescript
describe('POST /v1/vinculo/recurso', () => {
  // Test: debe retornar 201 con datos válidos
  // Test: debe retornar 400 con datos inválidos
  // Test: debe retornar 401 sin token JWT
  // Test: debe retornar 500 cuando el servicio falla
});
```

### Estructura de un Test de Servicio

```typescript
describe('RecursoService', () => {
  // Setup con mocks del repositorio (Prisma)
  // Test: debe retornar datos del repositorio
  // Test: debe lanzar error si no encuentra recurso
  // Test: debe validar reglas de negocio antes de guardar
});
```

---

## Mocks Dinámicos

- PROHIBIDO hacer llamadas reales a bases de datos, APIs externas de Bolívar (CONECTA, COMUNES) o servicios de terceros en tests.
- Usar mocks/stubs que simulen respuestas reales con datos representativos.
- Los mocks deben cubrir escenarios: respuesta exitosa, timeout, error de red y respuesta con datos vacíos.
- Centralizar fixtures/mocks reutilizables en carpetas dedicadas:
  - Frontend: `vinculo-frontend/src/__mocks__/`
  - Backend: `vinculo-backend/test/mocks/`

---

## Métricas SonarQube — Quality Gate

| Métrica | Umbral Mínimo |
|---------|---------------|
| Cobertura de líneas | > 80% |
| Code Smells críticos | 0 |
| Code Smells mayores | < 5 |
| Bugs | 0 |
| Vulnerabilidades | 0 |
| Duplicación de código | < 3% |
| Deuda técnica | < 30 min por archivo |

### Reglas para Cumplir el Quality Gate

- No dejar código muerto (funciones, variables o imports sin usar).
- No usar `any` en TypeScript; definir tipos estrictos siempre.
- No dejar `console.log` en código productivo; usar el sistema de logging centralizado.
- No ignorar errores con `catch` vacíos; siempre loguear o relanzar.
- Complejidad ciclomática máxima por función: 10.
- Máximo 300 líneas por archivo de código fuente.
- Cada función debe tener una sola responsabilidad.
