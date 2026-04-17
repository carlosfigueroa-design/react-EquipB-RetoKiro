# VÍNCULO by Seguros Bolívar

> El lugar donde tu negocio se conecta con el futuro del seguro

Portal de desarrolladores OpenX (Open Finance + Open Insurance + Open Data) de Seguros Bolívar.

## Quick Start

```bash
docker-compose up --build
```

El portal estará disponible en:
- **Frontend (Portal):** http://localhost:3000
- **Backend (API):** http://localhost:4000
- **API Docs (Swagger):** http://localhost:4000/api/docs

## Estructura del Proyecto

```
vinculo-frontend/    # React 18 + TypeScript + TailwindCSS + Vite
vinculo-backend/     # NestJS + Prisma ORM + Mock Engine
vinculo-specs/       # OpenAPI 3.1 specs
vinculo-docs/        # Documentación MDX
docker-compose.yml   # Setup local completo
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + TailwindCSS + Vite |
| Backend | Node.js 20 + NestJS + Prisma ORM |
| Auth | OAuth 2.0 + JWT |
| Docs | OpenAPI 3.1 + Swagger UI |
| DB | PostgreSQL + Redis |
| Infra | Docker Compose (local) / AWS EKS (prod) |

## Módulos

1. **Golden Path Onboarding** — Registro y primera llamada en < 5 min
2. **Catálogo de APIs OpenX** — Documentación viva con Swagger UI
3. **Sandbox Interactivo con IA** — Try-it-now con mock engine
4. **Seguridad y Gobernanza** — OWASP API Top 10, mTLS, WAF
5. **Analítica y Observabilidad** — Dashboards self-service
6. **IA Readiness (MCP)** — Preparado para agentes IA

## Marca

- **Colores:** Verde Bolívar `#1A3C0E`, Acento `#76C442`, Dorado `#F9A825`
- **Fuentes:** Sora (display), Plus Jakarta Sans (body), JetBrains Mono (code)

## Licencia

© 2026 Seguros Bolívar. Todos los derechos reservados.
