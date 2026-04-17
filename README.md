# VÍNCULO by Seguros Bolívar — Conecta 2.0

> El lugar donde tu negocio se conecta con el futuro del seguro

API Developer Portal empresarial de Seguros Bolívar — ecosistema de autoservicio que centraliza, expone y gobierna el consumo de activos digitales bajo el paradigma de **Open Insurance**.

## Quick Start

```bash
docker-compose up --build
```

| Servicio | URL |
|----------|-----|
| **Portal Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:4000 |
| **Swagger Docs** | http://localhost:4000/api/docs |

## Cobertura del Caso de Negocio Conecta 2.0

### Requerimientos de Usuario

| ID | Requerimiento | Módulo | Estado |
|----|--------------|--------|--------|
| **RU-01** | Onboarding Golden Path | `AliadoModule` + Onboarding UI | ✅ |
| **RU-02** | Catálogo Inteligente | `CatalogModule` + Catalog UI | ✅ |
| **RU-03** | Sandbox Interactivo | `SandboxModule` + Sandbox UI | ✅ |
| **RU-04** | Consola de Analítica | `AnalyticsModule` + Analytics UI | ✅ |
| **RU-05** | Documentación y SDKs | Swagger + Docs UI | ✅ |
| **RU-06** | Notificaciones Ciclo de Vida | `NotificationsModule` | ✅ |
| **RU-07** | Gestión Centralizada (Admin) | `AdminModule` + Admin UI | ✅ |
| **RU-08** | Auditoría y Cumplimiento | `AuditModule` + Audit UI | ✅ |
| **RU-09** | Gobierno de Versiones | `GovernanceModule` + Governance UI | ✅ |

### Requerimientos Técnicos

| ID | Requerimiento | Implementación | Estado |
|----|--------------|----------------|--------|
| **RT-01** | Control vs Data Plane | Arquitectura modular NestJS | ⚠️ Diseño |
| **RT-02** | mTLS + OAuth2 | JWT + OAuth 2.0 implementado | ⚠️ Parcial |
| **RT-03** | Abstracción de Legados | Mock Engine como adaptador | ⚠️ Diseño |
| **RT-04** | Circuit Breakers | Patrón preparado en servicios | ⚠️ Diseño |
| **RT-05** | IA Ready (MCP/AX) | OpenAPI semántico + specs | ⚠️ Diseño |

### RNF

| Categoría | Especificación | Estado |
|-----------|---------------|--------|
| Disponibilidad | 99.95% SLA multi-zona | ✅ Diseño AWS EKS |
| Escalabilidad | 1,500+ TPS con K8s | ✅ Docker Compose local |
| Rendimiento | < 30ms gateway | ✅ Mock engine < 200ms |
| Observabilidad | OpenTelemetry + tracing | ⚠️ Correlation-ID en schema |
| Seguridad | OWASP API Top 10 | ✅ Validación + JWT |
| Resiliencia | Throttling dinámico | ⚠️ Diseño |

## Estructura del Proyecto

```
├── vinculo-frontend/        # React 18 + TypeScript + Vite + SB Design System
│   └── src/pages/
│       ├── Landing.tsx      # Landing page
│       ├── Onboarding.tsx   # RU-01: Golden Path (5 pasos)
│       ├── Dashboard.tsx    # Dashboard del aliado
│       ├── Catalog.tsx      # RU-02: Catálogo inteligente
│       ├── ApiDetail.tsx    # RU-02: Detalle de API
│       ├── Sandbox.tsx      # RU-03: Sandbox interactivo
│       ├── Apps.tsx         # RU-01: Gestión de credenciales
│       ├── Analytics.tsx    # RU-04: Consola de analítica
│       ├── Docs.tsx         # RU-05: Documentación y SDKs
│       ├── Admin.tsx        # RU-07: Panel administrativo
│       ├── Audit.tsx        # RU-08: Auditoría y cumplimiento
│       └── Governance.tsx   # RU-09: Gobierno de versiones
│
├── vinculo-backend/         # NestJS + Prisma ORM
│   └── src/
│       ├── auth/            # OAuth 2.0 + JWT
│       ├── aliado/          # RU-01: Onboarding
│       ├── apps/            # RU-01: Gestión de apps
│       ├── catalog/         # RU-02: Catálogo
│       ├── insurance/       # Mock engine (Vida, Auto, Hogar, Salud)
│       ├── sandbox/         # RU-03: Sandbox
│       ├── analytics/       # RU-04: Analytics
│       ├── admin/           # RU-07: Admin
│       ├── audit/           # RU-08: Auditoría
│       ├── notifications/   # RU-06: Notificaciones
│       ├── governance/      # RU-09: Versiones
│       └── health/          # Health check
│
├── .kiro/steering/          # Reglas Seguros Bolívar
│   ├── reglas-arquitectura.md
│   ├── reglas-frontend.md
│   ├── reglas-stack-bolivar.md
│   ├── reglas-pruebas-fullstack.md
│   └── comportamiento-agente-qa.md
│
├── docs/                    # Documentación de arquitectura
└── docker-compose.yml       # PostgreSQL + Redis + Backend + Frontend
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + TailwindCSS + Vite |
| Design System | @seguros-bolivar/ui-bundle (CSS + Web Components) |
| Backend | Node.js 20 + NestJS 10 + Prisma ORM |
| Auth | OAuth 2.0 + JWT (Passport.js) |
| Docs | OpenAPI 3.1 + Swagger UI |
| DB | PostgreSQL 16 + Redis 7 |
| Infra | Docker Compose (local) / AWS EKS (prod) |

## Credenciales Demo

```
Email: demo@fintech.co
Password: Demo2026!
```

## Rivales a Superar

- [Zurich Exchange](https://exchange.zurich.com/en/api)
- [Chubb Studio](https://studio.chubb.com/connect/)

## Licencia

© 2026 Seguros Bolívar. Todos los derechos reservados.
