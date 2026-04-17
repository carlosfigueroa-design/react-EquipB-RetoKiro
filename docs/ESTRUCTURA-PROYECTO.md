# 📁 Estructura del Proyecto VÍNCULO — Conecta 2.0

> Guía paso a paso de la arquitectura de carpetas, alineada con el caso de negocio y las reglas de Seguros Bolívar.

---

## 🏗️ Visión General (Raíz)

```
VÍNCULO/
│
├── 📋 README.md                    # Documentación principal del proyecto
├── 🐳 docker-compose.yml           # Orquestación local: PostgreSQL + Redis + Backend + Frontend
├── 🚫 .gitignore                   # Exclusiones de Git (node_modules, .env, .npmrc)
│
├── 📂 vinculo-backend/             # Capa de Lógica (NestJS) — RT-01 Control Plane
├── 📂 vinculo-frontend/            # Capa de Presentación (React 18) — UI del Portal
├── 📂 docs/                        # Documentación técnica y de arquitectura
│
└── 📂 .kiro/                       # Reglas de Kiro (steering files)
    └── steering/
        ├── reglas-arquitectura.md          # Reglas de 3 capas, seguridad, resiliencia
        ├── reglas-frontend.md              # Convenciones React + Design System SB
        ├── reglas-stack-bolivar.md         # Stack tecnológico completo
        ├── reglas-pruebas-fullstack.md     # Testing + Quality Gate SonarQube
        └── comportamiento-agente-qa.md     # Rol del agente QA
```

---

## 🖥️ Frontend — `vinculo-frontend/`

Capa de Presentación. **NUNCA** contiene lógica de negocio (regla de arquitectura).

```
vinculo-frontend/
│
├── 📄 package.json                 # Dependencias: React 18, Vite, TailwindCSS, @seguros-bolivar/ui-bundle
├── 📄 .npmrc.example               # Configuración JFrog (sin secretos)
├── 📄 tsconfig.json                # TypeScript strict mode
├── 📄 vite.config.ts               # Build tool + proxy para desarrollo
├── 📄 tailwind.config.js           # Extensión de colores Bolívar
├── 📄 postcss.config.js            # PostCSS + Autoprefixer
├── 📄 Dockerfile                   # Imagen Docker para desarrollo
├── 📄 index.html                   # Entry point HTML (data-brand="seguros-bolivar")
│
├── 📂 public/                      # Assets estáticos
│   └── vite.svg                    # Favicon
│
└── 📂 src/                         # Código fuente
    │
    ├── 📄 main.tsx                 # Entry point React + importación SB Web Components
    ├── 📄 App.tsx                  # Router principal (React Router v6)
    ├── 📄 index.css                # Estilos globales + importación Design System SB
    ├── 📄 sb-ui.d.ts               # TypeScript declarations para Web Components SB
    ├── 📄 vite-env.d.ts            # Tipos de Vite
    │
    ├── 📂 components/              # Componentes compartidos (transversales)
    │   ├── BolivarLogo.tsx         # Logo corporativo reutilizable (sm/md/lg/xl, light/dark)
    │   └── Layout.tsx              # Shell principal: header + nav + footer + <Outlet>
    │
    ├── 📂 lib/                     # Utilidades y servicios globales
    │   ├── api.ts                  # Cliente HTTP centralizado (proxy en dev, URL en prod)
    │   └── auth-context.tsx        # Context de autenticación (login, register, logout)
    │
    └── 📂 pages/                   # Páginas por ruta (una por requerimiento)
        │
        │── 🏠 Landing.tsx          # Landing page pública (hero + features + CTA)
        │── 🚀 Onboarding.tsx       # RU-01: Golden Path — Wizard de 5 pasos
        │── 📊 Dashboard.tsx        # Dashboard del aliado (métricas + quick actions)
        │── 📚 Catalog.tsx          # RU-02: Catálogo inteligente con filtros por dominio
        │── 📖 ApiDetail.tsx        # RU-02: Detalle de API (docs + curl + changelog)
        │── 🧪 Sandbox.tsx          # RU-03: Sandbox interactivo (6 presets + mock engine)
        │── 🔑 Apps.tsx             # RU-01: Gestión de aplicaciones y credenciales
        │── 📈 Analytics.tsx        # RU-04: Consola de analítica (latencia, top APIs)
        │── 📖 Docs.tsx             # RU-05: Documentación, guías y SDKs
        │── 🛡️ Admin.tsx            # RU-07: Panel admin (aprobar/suspender/revocar aliados)
        │── 📋 Audit.tsx            # RU-08: Auditoría y cumplimiento (Habeas Data/GDPR/SFC)
        └── 🔀 Governance.tsx       # RU-09: Gobierno de versiones (publish/deprecate/sunset)
```

### Convenciones Frontend

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes | PascalCase | `BolivarLogo.tsx` |
| Hooks | camelCase con `use` | `useAuth()` |
| Servicios/Utils | camelCase | `api.ts` |
| Constantes | UPPER_SNAKE_CASE | `LOGO_URL` |
| Event Handlers | `handle` prefix | `handleLogin`, `handleRegister` |
| Estilos | `--sb-ui-*` tokens | `var(--sb-ui-color-primary-base, #05A660)` |

---

## ⚙️ Backend — `vinculo-backend/`

Capa de Lógica. Aquí residen las reglas de dominio, validaciones y seguridad.

```
vinculo-backend/
│
├── 📄 package.json                 # Dependencias: NestJS 10, Prisma, Passport, JWT
├── 📄 tsconfig.json                # TypeScript config
├── 📄 tsconfig.build.json          # Config de build (excluye tests)
├── 📄 nest-cli.json                # NestJS CLI config
├── 📄 .env.example                 # Variables de entorno (sin secretos)
├── 📄 Dockerfile                   # Imagen Docker (build + migrate + seed + run)
│
├── 📂 prisma/                      # Capa de Persistencia (ORM)
│   ├── schema.prisma               # Modelos: Aliado, App, ApiCall, AuditLog, Notification, ApiVersion
│   ├── seed.ts                     # Datos iniciales (aliado demo + API calls de ejemplo)
│   └── migrations/                 # Migraciones SQL versionadas
│       ├── 20260101000000_init/
│       │   └── migration.sql       # DDL inicial (tablas + enums + índices)
│       └── migration_lock.toml     # Lock de proveedor (PostgreSQL)
│
└── 📂 src/                         # Código fuente NestJS
    │
    ├── 📄 main.ts                  # Bootstrap: CORS, ValidationPipe, Swagger, listen
    ├── 📄 app.module.ts            # Módulo raíz (importa todos los módulos)
    │
    ├── 📂 prisma/                  # Módulo global de Prisma
    │   ├── prisma.module.ts        # @Global() module
    │   └── prisma.service.ts       # PrismaClient con lifecycle hooks
    │
    │── 📂 auth/                    # RT-02: Autenticación OAuth 2.0 + JWT
    │   ├── auth.module.ts          # Passport + JWT config
    │   ├── auth.controller.ts      # POST /v2/vinculo/auth/token, /refresh
    │   ├── auth.service.ts         # Login (bcrypt verify) + token generation
    │   ├── jwt.strategy.ts         # Passport JWT strategy
    │   └── jwt-auth.guard.ts       # Guard reutilizable
    │
    │── 📂 aliado/                  # RU-01: Onboarding Golden Path
    │   ├── aliado.module.ts
    │   ├── aliado.controller.ts    # POST /register, GET /cuotas, GET /metricas
    │   ├── aliado.service.ts       # Registro + auto-creación sandbox + métricas
    │   └── dto/
    │       └── register-aliado.dto.ts  # Validación con class-validator
    │
    │── 📂 apps/                    # RU-01: Gestión de aplicaciones
    │   ├── apps.module.ts
    │   ├── apps.controller.ts      # GET /apps, POST /apps, POST /rotate-secret
    │   └── apps.service.ts         # CRUD de apps + rotación de secretos
    │
    │── 📂 catalog/                 # RU-02: Catálogo inteligente
    │   ├── catalog.module.ts
    │   └── catalog.controller.ts   # GET /apis (filtros), GET /apis/:id, GET /domains
    │
    │── 📂 insurance/               # RU-02/03: APIs de Open Insurance (Mock Engine)
    │   ├── insurance.module.ts
    │   ├── insurance.controller.ts # Endpoints v3: cotización, emisión, siniestros
    │   └── mock-engine.service.ts  # RT-03: Capa de abstracción (simula legados)
    │
    │── 📂 sandbox/                 # RU-03: Centro de experimentación
    │   ├── sandbox.module.ts
    │   ├── sandbox.controller.ts   # POST /sandbox/execute
    │   └── sandbox.service.ts      # Mock engine con trace ID + latencia simulada
    │
    │── 📂 analytics/               # RU-04: Consola de analítica
    │   ├── analytics.module.ts
    │   └── analytics.controller.ts # GET /analytics/overview
    │
    │── 📂 admin/                   # RU-07: Gestión centralizada de aliados
    │   ├── admin.module.ts
    │   ├── admin.controller.ts     # Dashboard, listar, aprobar, suspender, reactivar, revocar
    │   └── admin.service.ts        # Lógica de gestión + audit logging automático
    │
    │── 📂 audit/                   # RU-08: Auditoría y cumplimiento
    │   ├── audit.module.ts
    │   ├── audit.controller.ts     # GET /logs (filtros), GET /compliance
    │   └── audit.service.ts        # Logs con paginación + reporte Habeas Data/GDPR/SFC
    │
    │── 📂 notifications/           # RU-06: Notificaciones de ciclo de vida
    │   ├── notifications.module.ts
    │   ├── notifications.controller.ts  # GET, POST /read, POST /read-all, POST /global
    │   └── notifications.service.ts     # Personal + global notifications
    │
    │── 📂 governance/              # RU-09: Gobierno de versiones
    │   ├── governance.module.ts
    │   ├── governance.controller.ts     # GET /versions, GET /timeline, POST publish/deprecate/sunset
    │   └── governance.service.ts        # Lifecycle: ACTIVE → DEPRECATED → SUNSET
    │
    └── 📂 health/                  # Health check
        ├── health.module.ts
        └── health.controller.ts    # GET /health
```

### Convenciones Backend

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Módulos | PascalCase + Module suffix | `AdminModule` |
| Controladores | PascalCase + Controller | `AdminController` |
| Servicios | PascalCase + Service | `AdminService` |
| DTOs | PascalCase + Dto | `RegisterAliadoDto` |
| Rutas API | Versionadas con prefijo | `/v1/vinculo/admin/aliados` |
| Enums | PascalCase | `AliadoStatus`, `AuditAction` |

---

## 📂 Documentación — `docs/`

```
docs/
├── arquitectura-proyecto.html      # Documento visual de arquitectura (HTML imprimible)
└── ESTRUCTURA-PROYECTO.md          # Este archivo — guía de carpetas
```

---

## 📂 Kiro Steering — `.kiro/steering/`

Reglas automáticas que Kiro carga en cada interacción:

```
.kiro/steering/
├── reglas-arquitectura.md          # [auto] 3 capas, seguridad, resiliencia, naming
├── reglas-frontend.md              # [fileMatch: vinculo-frontend/**] React + SB tokens
├── reglas-stack-bolivar.md         # [auto] Stack tecnológico completo
├── reglas-pruebas-fullstack.md     # [auto] Testing + Quality Gate SonarQube (>80%)
└── comportamiento-agente-qa.md     # [auto] Rol QA: entrega dual código+test
```

---

## 🗄️ Base de Datos — Modelos Prisma

```
┌─────────────────────────────────────────────────────────────┐
│                    MODELOS DE DATOS                          │
├─────────────┬───────────────────────────────────────────────┤
│ Aliado      │ RU-01: Registro, tipo, estado, isAdmin        │
│ App         │ RU-01: Client ID/Secret, sandbox/producción   │
│ ApiCall     │ RU-04: Tracking de llamadas + correlationId   │
│ ApiSpec     │ RU-02: Especificaciones OpenAPI del catálogo   │
│ AuditLog    │ RU-08: Trazabilidad completa de acciones       │
│ Notification│ RU-06: Alertas personales y globales           │
│ ApiVersion  │ RU-09: Lifecycle ACTIVE→DEPRECATED→SUNSET      │
└─────────────┴───────────────────────────────────────────────┘
```

---

## 🐳 Docker Compose — Servicios

```
┌──────────────┬──────────┬─────────────────────────────────┐
│ Servicio     │ Puerto   │ Propósito                        │
├──────────────┼──────────┼─────────────────────────────────┤
│ postgres     │ 5432     │ Base de datos PostgreSQL 16       │
│ redis        │ 6379     │ Caché y sesiones                  │
│ backend      │ 4000     │ API NestJS + Swagger              │
│ frontend     │ 3000     │ Portal React + Vite               │
└──────────────┴──────────┴─────────────────────────────────┘
```

---

## 🔗 Mapeo Requerimientos → Código

| Requerimiento | Backend Module | Frontend Page | DB Model | Endpoints |
|--------------|---------------|---------------|----------|-----------|
| **RU-01** Onboarding | `aliado/`, `apps/`, `auth/` | `Onboarding.tsx`, `Apps.tsx` | Aliado, App | `/register`, `/token`, `/apps` |
| **RU-02** Catálogo | `catalog/`, `insurance/` | `Catalog.tsx`, `ApiDetail.tsx` | ApiSpec | `/catalog/apis`, `/catalog/domains` |
| **RU-03** Sandbox | `sandbox/` | `Sandbox.tsx` | ApiCall | `/sandbox/execute` |
| **RU-04** Analytics | `analytics/` | `Analytics.tsx` | ApiCall | `/analytics/overview`, `/metricas` |
| **RU-05** Docs | Swagger UI | `Docs.tsx` | — | `/api/docs` |
| **RU-06** Notificaciones | `notifications/` | (API ready) | Notification | `/notifications` |
| **RU-07** Admin | `admin/` | `Admin.tsx` | Aliado, App | `/admin/aliados`, `/approve`, `/suspend` |
| **RU-08** Auditoría | `audit/` | `Audit.tsx` | AuditLog | `/audit/logs`, `/audit/compliance` |
| **RU-09** Governance | `governance/` | `Governance.tsx` | ApiVersion | `/governance/versions`, `/timeline` |
| **RT-02** Auth | `auth/` | `auth-context.tsx` | Aliado | `/auth/token`, `/auth/refresh` |
| **RT-03** Legados | `insurance/mock-engine` | — | — | Mock engine como adaptador |

---

## ✅ Mejores Prácticas Implementadas

### Arquitectura
- ✅ Separación estricta de 3 capas (Presentación / Lógica / Persistencia)
- ✅ Frontend NUNCA contiene lógica de negocio
- ✅ Comunicación Frontend → Backend siempre vía API REST
- ✅ Versionamiento de APIs (`/v1/`, `/v2/`, `/v3/`)
- ✅ Módulos independientes por dominio de negocio

### Seguridad
- ✅ OAuth 2.0 + JWT con Passport.js
- ✅ Passwords hasheados con bcrypt (12 rounds)
- ✅ Validación de DTOs con class-validator (whitelist + forbidNonWhitelisted)
- ✅ CORS configurado por origen
- ✅ Secretos en variables de entorno (nunca en código)
- ✅ `.npmrc` con token excluido de Git

### Calidad de Código
- ✅ TypeScript strict en frontend y backend
- ✅ Naming conventions consistentes (PascalCase, camelCase, UPPER_SNAKE)
- ✅ Design System corporativo (@seguros-bolivar/ui-bundle)
- ✅ CSS tokens `--sb-ui-*` en vez de valores hardcodeados
- ✅ Componentes reutilizables (BolivarLogo, Layout)

### Operación
- ✅ Docker Compose para setup local en un comando
- ✅ Health check endpoint
- ✅ Swagger UI auto-generado desde decoradores NestJS
- ✅ Seed de datos demo para desarrollo
- ✅ Prisma migrations versionadas

### Gobernanza
- ✅ Kiro steering files para consistencia automática
- ✅ Audit logging en acciones administrativas
- ✅ Reporte de cumplimiento (Habeas Data / GDPR / SFC)
- ✅ Gobierno de versiones con lifecycle (ACTIVE → DEPRECATED → SUNSET)
- ✅ Notificaciones de ciclo de vida
