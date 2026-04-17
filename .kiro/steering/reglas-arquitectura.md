---
inclusion: auto
---

# 🔏 Reglas de Arquitectura para Proyectos de Autogestión (v2.1)

Este documento consolida las reglas, convenciones y mejores prácticas obligatorias para garantizar la excelencia técnica, seguridad y escalabilidad de las iniciativas desarrolladas por los equipos autogestionados de **Seguros y Servicios Bolívar**.

---

## 🎯 Regla Principal: Consistencia

**"Un proyecto debe parecer escrito por una sola persona"**

* **Validación Obligatoria:** Antes de modificar código, identifica el patrón estándar existente y replícalo.
* **Uniformidad:** Se prohíbe el *vibe coding* (programar por intuición del momento). No inventar nuevas formas.
* **Mantenibilidad:** El código debe ser lo suficientemente claro para permitir correcciones en menos de **1 día** en casos críticos y **5 días** para temas no productivos.
* **NO inventar nuevas formas** - Mantén la uniformidad del código.
* **Validar contra estas reglas** - Asegúrate de cumplir todas las reglas.

---

## 🏗️ Estándar de Solución: 3 Capas y Usabilidad

Toda iniciativa debe estructurarse obligatoriamente en tres capas independientes para garantizar la **Portabilidad** y **Adecuación Funcional**:

1. **Capa de Presentación (Frontend):** Responsable del renderizado de UI y eventos de usuario. **NUNCA** debe contener lógica de negocio.
2. **Capa de Lógica (Backend):** Intermediario obligatorio donde residen las reglas de dominio, cálculos y validaciones de seguridad.
3. **Capa de Persistencia (Datos):** Repositorios oficiales (Postgres, Mongo, Data Lake). Se prohíbe la conexión directa desde el Front; siempre vía API.

**💡 Regla de Usabilidad:**

* Toda funcionalidad principal debe ser intuitiva y ejecutable en un máximo de **5 clics** sin requerir manuales de usuario.

---

## 🛡️ Seguridad y Protección de Datos

* **Identidad y Acceso (IAM):**
  * Uso obligatorio de **OAuth 2.0 y OpenID Connect (OIDC)** como protocolos estándar.
  * Comunicación entre capas protegida mediante **JSON Web Tokens (JWT)** firmados.
  * Autorización basada en **Roles y Scopes (RBAC)** validados estrictamente en el Backend.
* **Sanitización y Tipado:** Definición estricta de tipos de datos en todos los campos para evitar inyecciones.
* **Enmascaramiento:** El 100% de los datos sensibles (PII, financiero, salud) debe estar enmascarado en las respuestas de la API.
* **Comunicación DNS (No IPs):** Prohibido el uso de direcciones IP fijas. Comunicación exclusivamente mediante nombres de dominio o DNS.
* **Gestión de Secretos:** No incluir API keys o credenciales en el código fuente. Uso obligatorio de **Variables de Entorno** o **Secret Manager**.
* **Seguridad Web:** Los tokens no deben almacenarse en `localStorage`; se deben usar `httpOnly cookies`.
* **Retención de Datos:** Las aplicaciones deben tener políticas de borrado de información que no superen los **90 días**.

---

## ⚙️ Resiliencia, Desempeño y Operación

* **Métricas de Desempeño:** Las acciones en el Frontend deben responder en menos de **3 segundos** y el procesamiento en Backend (APIs) no debe superar los **15 segundos**.
* **Trazabilidad:** Inserción obligatoria de un `Correlation-ID` en cada petición que viaje entre las capas de la solución.
* **Observabilidad:** Los logs deben ser estandarizados y enviados a servicios centrales, nunca almacenados localmente.
* **Manejo de Fallos (Fiabilidad):** Implementar políticas de reintentos (*Retries*) y *Circuit Breakers* para el 100% de los errores sin provocar cierres inesperados.
* **Asincronía:** Tareas de larga duración deben ejecutarse en segundo plano para no bloquear la UI.
* **Throttling:** Implementar límites de consumo (Rate Limiting) para proteger componentes core.
* **Versionamiento de Contratos (API First):** Cualquier cambio en la estructura de datos debe ser versionado con prefijos en las rutas (ej: `/v1/api/`, `/v2/api/`).

---

## 🏷️ Estándares de Desarrollo

### Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| **Componentes** | PascalCase | `UserProfile.tsx` |
| **Hooks** | camelCase con `use` | `useUserData.ts` |
| **Servicios** | camelCase | `userService.ts` |
| **Constantes** | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| **Variables/Funciones** | camelCase | `userName`, `fetchUser()` |
| **Event Handlers** | `handle` prefix | `handleClick`, `handleSubmit` |

### Estructura Modular (`/src`)

```text
src/
├── assets/             # Estilos globales e imágenes
├── components/         # Componentes transversales (ui/layout)
├── features/           # Lógica por dominio de negocio
│   └── modulo-ejemplo/
│       ├── components/ # UI específica del módulo
│       ├── hooks/      # Lógica de estado local
│       ├── services/   # Llamadas a API del módulo
│       └── index.ts    # Punto de exposición
├── services/           # Clientes globales
├── hooks/              # Hooks globales reutilizables
├── types/              # Interfaces y tipos de TypeScript
└── config/             # Variables de entorno y constantes
```

---

## 🚀 Ciclo de Vida y Gobierno de TI

* **Fuentes Oficiales:** Toda librería debe descargarse únicamente del repositorio institucional (**JFrog**).
* **Versionamiento:** El código debe residir obligatoriamente en el repositorio oficial de la compañía.
* **Separación de Entornos:** Los ambientes de Desarrollo, Stage y Producción deben estar físicamente separados.
* **Cierre Limpio (Graceful Shutdown):** La aplicación debe completar transacciones en curso antes de finalizar procesos de reinicio o despliegue.
