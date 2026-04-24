# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto adhiere a [Versionamiento Semántico](https://semver.org/lang/es/).

## [No publicado]

### Agregado
- Se implementó portal completo Vínculo Developer Portal con React 18 + Vite 5 + TailwindCSS
- Se creó sistema de autenticación OTP con envío de correo via Ethereal/Gmail SMTP
- Se implementó catálogo de APIs con 9 APIs de seguros colombianos (Vida, Auto, Hogar, Salud)
- Se creó página de detalle de API con documentación integral, endpoints, código y sandbox
- Se implementó Sandbox interactivo con flujo progresivo dinámico (API → Método → Endpoint → Body)
- Se creó módulo de Administración con gestión del ciclo de vida (Publicar, Deprecar, Retirar, Reactivar)
- Se implementó creación de APIs con carga de archivos OpenAPI y agente IA de documentación
- Se creó página de Analítica con métricas de uso, engagement, negocio y gráficos CSS
- Se implementó página de Observabilidad con APM, RUM, CNM y NPM con datos de servicios
- Se creó Asistente IA flotante con conocimiento de todas las APIs y snippets de código
- Se implementó diseño corporativo Seguros Bolívar con colores, tipografías y hover amarillo (#F9A825)
- Se creó navegación contextual con botones "volver" dinámicos según origen (catálogo/admin/sandbox)
- Se implementó búsqueda funcional en catálogo con filtros por producto, proceso, nombre y descripción
- Se configuró backend NestJS con mock DB/Redis para desarrollo sin dependencias externas

### Cambiado
- Se optimizaron espacios y paddings en todas las páginas para mejor aprovechamiento visual
- Se mejoró responsive para tablets y celulares en todas las vistas
- Se cambió nombre "VÍNCULO" a "Vínculo" (primera mayúscula) en toda la aplicación

### Eliminado
- Se eliminaron proyectos viejos de la raíz (vinculo-backend/, vinculo-frontend/)
- Se eliminaron archivos no usados: apiStore, uiStore, sandboxStore, ProtectedRoute, AdminLayout
- Se eliminaron páginas no usadas: GovernancePage, ProductionPage, UserManagementPage
- Se eliminó docker-compose.yml y package.json de la raíz que referenciaban proyectos viejos
