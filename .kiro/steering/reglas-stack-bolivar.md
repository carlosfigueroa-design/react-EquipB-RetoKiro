---
inclusion: auto
---

# 🛠️ Stack Tecnológico de Autogestión — Seguros Bolívar (v3.3)

Este documento define la configuración técnica exacta para las iniciativas de autogestión. Su contenido es la base para el aprovisionamiento automático de ambientes.

---

## 🏗️ 1. Perfil del Proyecto VÍNCULO

| Capa | Tecnología | Versión |
| :--- | :--- | :--- |
| **Frontend** | React + TypeScript + Vite | 18.x / 5.x / 5.x |
| **Design System** | @seguros-bolivar/ui-bundle | ^1.0.6 |
| **Backend** | Node.js + NestJS + Prisma ORM | 20.x / 10.x / 5.x |
| **Build Tool** | npm | 10.x |
| **Persistencia** | PostgreSQL (RDS) + Redis (ElastiCache) | 16+ / 7+ |
| **Registry** | JFrog Artifactory | - |
| **Infra** | Docker Compose (local) / AWS EKS (prod) | - |

---

## 📚 2. Inventario General de Tecnologías Habilitadas

### Frontend — Frameworks y Librerías

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **React** | 18.x | Interfaces dinámicas y de alto rendimiento |
| **TypeScript** | 5.x | Tipado estricto para calidad de código |
| **Vite** | 5.x | Build tool rápido y moderno |
| **React Router** | 6.x | Navegación y routing |
| **TailwindCSS** | 3.x | Utilidades de layout (complemento al design system SB) |

### Frontend — UI Libraries

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **@seguros-bolivar/ui-bundle** | ^1.0.6 | Design System corporativo (CSS + Web Components) |
| **Font Awesome 6** | Bundled | Iconografía (incluida en ui-bundle) |

### Backend — Node.js

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **Node.js** | 20.x (LTS) | Runtime de JavaScript para backend |
| **NestJS** | 10.x | Framework backend con arquitectura modular |
| **Prisma ORM** | 5.x | ORM type-safe para PostgreSQL |
| **Passport.js + JWT** | 0.x / 10.x | Autenticación OAuth 2.0 |
| **class-validator** | 0.14.x | Validación de DTOs |
| **Swagger/OpenAPI** | 7.x | Documentación automática de APIs |

### Backend — Base de Datos

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **PostgreSQL** | 16+ | Motor de base de datos relacional (PRINCIPAL) |
| **Redis** | 7+ | Caché y sesiones |

### Backend — Autenticación y Seguridad

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **JWT** | jsonwebtoken 9.x | Tokens JSON Web para autenticación |
| **Passport.js** | passport 0.x | Middleware de autenticación |
| **bcrypt** | 5.x | Hashing de contraseñas |

### Infraestructura y Cloud

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **Docker** | 24.x+ | Containerización de aplicaciones |
| **Docker Compose** | Latest | Orquestación multi-contenedor |
| **AWS EKS** | Latest | Kubernetes gestionado (producción) |
| **AWS RDS PostgreSQL** | 16+ | Base de datos gestionada |
| **AWS ElastiCache** | Redis 7+ | Caché gestionado |
| **AWS CloudFront + S3** | Latest | CDN y distribución de contenido |

### CI/CD y Versionamiento

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **Git** | 2.40+ | Control de versiones distribuido |
| **GitHub Actions** | Latest | CI/CD integrado con GitHub |

### Herramientas de Desarrollo

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **ESLint** | 9.x | Linter para JavaScript/TypeScript |
| **Prettier** | Latest | Formateador de código automático |
| **PostCSS** | 8.x | Transformación de CSS |
| **Autoprefixer** | 10.x | Prefijos CSS automáticos |

### Repositorios y Gestión de Dependencias

| Tecnología | Propósito |
| :--- | :--- |
| **JFrog Artifactory** | Repositorio institucional de librerías |
| **npm** | Gestor de paquetes para Node.js |
| **npm Registry (JFrog)** | Configuración de .npmrc para JFrog |

---

## 🛡️ 3. Estándar Global de Identidad y Acceso (IAM)

| Componente | Estándar | Propósito |
| :--- | :--- | :--- |
| Protocolo | OAuth 2.0 / OIDC | Autenticación y autorización |
| Tokens | JWT | Transporte de identidad |
| Almacenamiento | httpOnly cookies | Gestión de Refresh Tokens (evitar XSS) |
| Validación | Firma y Scopes | Backend verifica firma y permisos |

---

## 🚀 4. Estándares de Infraestructura y Despliegue

| Regla | Detalle |
| :--- | :--- |
| Gestión de Librerías | Descarga exclusiva desde JFrog |
| Direccionamiento | Solo DNS, prohibido IPs fijas |
| Observabilidad | Logs centralizados (CloudWatch/OpenTelemetry) |
| Resiliencia | Retries + Circuit Breakers obligatorios |
