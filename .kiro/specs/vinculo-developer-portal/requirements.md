# Documento de Requerimientos — VÍNCULO Developer Portal

## Introducción

VÍNCULO by Seguros Bolívar es un portal de desarrolladores API de nivel empresarial, diseñado como ecosistema de autoservicio bajo la estrategia OpenX (Open Finance + Open Insurance + Open Data). El portal permite a aliados externos (fintechs, intermediarios, socios digitales) explorar, probar e integrar APIs de seguros de forma autónoma, reduciendo el tiempo de onboarding de días a menos de 5 minutos. Internamente, permite a administradores y líderes técnicos gestionar el ciclo de vida completo de las APIs con generación automática de documentación mediante IA.

**URL:** vinculo.segurosbolivar.com
**Contexto:** Colombia · Sector asegurador · Open Insurance 2026

## Glosario

- **Portal**: La aplicación web VÍNCULO Developer Portal accesible en vinculo.segurosbolivar.com
- **Visitante_Público**: Usuario no autenticado que navega la zona pública del Portal
- **Aliado_Externo**: Usuario autenticado con rol EXTERNO que consume documentación y APIs
- **Administrador**: Usuario autenticado con rol ADMIN que gestiona APIs y usuarios
- **Líder_Técnico**: Usuario autenticado con rol LIDER_TECNICO que monitorea métricas y gobernanza
- **Sistema_Auth**: Módulo de autenticación basado en Email + OTP con JWT RS256
- **Catálogo**: Módulo que lista y permite buscar APIs disponibles por producto, proceso y dominio
- **Motor_Sandbox**: Módulo de ejecución interactiva de APIs con datos mock realistas de seguros
- **Motor_IA**: Módulo de inteligencia artificial basado en Claude claude-sonnet-4-20250514 + RAG sobre documentación
- **Motor_Mock**: Servicio que genera respuestas realistas de seguros simulando sistemas legados
- **Generador_IA_Docs**: Componente del Motor_IA que auto-genera documentación OpenAPI 3.1 a partir de JSON de Request Body
- **Asistente_IA**: Chatbot contextual flotante disponible en todas las pantallas del Portal
- **Panel_Observabilidad**: Dashboard de métricas en tiempo real para líderes técnicos
- **Sistema_Gobernanza**: Módulo de gestión del ciclo de vida de APIs (ACTIVE → DEPRECATED → SUNSET)
- **Log_Auditoría**: Registro inmutable de acciones administrativas en formato JSON
- **OTP**: One-Time Password, código de 6 dígitos enviado por email con expiración de 5 minutos
- **Golden_Path**: Flujo guiado de onboarding que lleva al Aliado_Externo desde el registro hasta su primera llamada API en menos de 5 minutos
- **Buscador_Global**: Componente de búsqueda semántica disponible en todas las pantallas del Portal
- **Checklist_Seguridad**: Documento PDF descargable con requisitos de seguridad para paso a producción
- **Ventana_Migración**: Período configurable (30, 60 o 90 días) entre la deprecación y el sunset de una API
- **Parser_OpenAPI**: Componente que interpreta especificaciones OpenAPI 3.1 para renderizar documentación interactiva
- **Printer_OpenAPI**: Componente que serializa objetos de especificación API de vuelta a formato OpenAPI 3.1 válido

## Requerimientos

### Requerimiento 1: Exploración Pública del Portal

**Historia de Usuario:** Como Visitante_Público, quiero explorar el catálogo de APIs y probar demos sin registrarme, para evaluar el ecosistema de VÍNCULO y decidir si quiero integrarme como aliado.

#### Criterios de Aceptación

1. WHEN un Visitante_Público accede al Portal, THE Portal SHALL cargar la página de inicio con contenido visible en menos de 2 segundos (LCP < 2s)
2. THE Catálogo SHALL mostrar un mínimo de 3 APIs por línea de producto (Vida, Auto, Hogar, Salud) con nombre y descripción básica en la zona pública
3. WHEN un Visitante_Público activa el Motor_Sandbox en modo demo, THE Motor_Sandbox SHALL ejecutar llamadas con datos mock genéricos de seguros sin requerir autenticación
4. THE Buscador_Global SHALL estar visible y funcional en la zona pública del Portal
5. WHEN un Visitante_Público ingresa un término de búsqueda, THE Buscador_Global SHALL retornar resultados relevantes en menos de 500 milisegundos
6. THE Portal SHALL mostrar un botón de llamada a la acción "Registrarse / Iniciar sesión" visible en todo momento sin bloquear el contenido
7. WHEN un Visitante_Público interactúa con el Asistente_IA en modo público, THE Asistente_IA SHALL responder preguntas generales sobre las APIs disponibles en el Portal
8. THE Portal SHALL cumplir con WCAG 2.1 nivel AA y ser completamente responsive en dispositivos móviles, tabletas y escritorio

### Requerimiento 2: Registro y Autenticación con Email + OTP

**Historia de Usuario:** Como Aliado_Externo, quiero registrarme e iniciar sesión con mi email y un código OTP, para acceder a la zona privada del Portal de forma segura y rápida.

#### Criterios de Aceptación

1. WHEN un usuario ingresa su email en el formulario de registro, THE Sistema_Auth SHALL completar el flujo de registro en menos de 2 minutos solicitando únicamente el campo de email
2. WHEN un usuario solicita autenticación, THE Sistema_Auth SHALL enviar un OTP de 6 dígitos al email proporcionado en menos de 30 segundos
3. WHEN han transcurrido 5 minutos desde la generación del OTP, THE Sistema_Auth SHALL invalidar el OTP y requerir la generación de uno nuevo
4. WHEN un usuario ingresa un OTP incorrecto 3 veces consecutivas, THE Sistema_Auth SHALL bloquear la cuenta durante 15 minutos
5. WHEN un usuario se autentica exitosamente, THE Sistema_Auth SHALL emitir un JWT RS256 con una sesión de 8 horas y un refresh token rotativo
6. WHILE la sesión del Aliado_Externo se aproxima a su expiración, THE Sistema_Auth SHALL ejecutar un refresco silencioso del token sin interrumpir la experiencia del usuario
7. WHEN el email ingresado no corresponde a un usuario existente, THE Sistema_Auth SHALL iniciar automáticamente el flujo de registro asignando el rol EXTERNO por defecto
8. THE Sistema_Auth SHALL utilizar OTP de un solo uso, JWT RS256, refresh tokens rotativos y comunicación exclusiva sobre HTTPS con TLS 1.3

### Requerimiento 3: Consumo de Documentación Técnica de APIs

**Historia de Usuario:** Como Aliado_Externo, quiero buscar y consumir documentación técnica de APIs, para integrarlas en mi primer sprint de desarrollo.

#### Criterios de Aceptación

1. WHEN un Aliado_Externo realiza una búsqueda en el Catálogo, THE Catálogo SHALL retornar resultados relevantes en menos de 500 milisegundos con filtros por producto, proceso, versión y estado
2. THE Catálogo SHALL presentar la documentación de cada API siguiendo el estándar OpenAPI 3.1 renderizada con Swagger UI
3. WHEN un Aliado_Externo accede al detalle de una API, THE Portal SHALL mostrar descripción de cada endpoint, parámetros, esquemas y ejemplos de request/response
4. WHEN un Aliado_Externo accede al detalle de una API, THE Motor_Sandbox SHALL estar disponible como interfaz "Try-It" integrada en la misma pantalla
5. THE Portal SHALL generar snippets de código funcionales en JavaScript, Python, Java y cURL para cada endpoint de la API
6. THE Portal SHALL documentar los códigos de respuesta HTTP 200, 201, 400, 401, 403, 404, 422 y 500 con descripciones claras para cada endpoint
7. WHEN un Aliado_Externo utiliza el Buscador_Global con lenguaje natural, THE Motor_IA SHALL interpretar la consulta semánticamente y retornar APIs relevantes al caso de uso descrito
8. THE Portal SHALL presentar las descripciones de APIs en español e inglés técnico

### Requerimiento 4: Sandbox Interactivo

**Historia de Usuario:** Como Aliado_Externo, quiero probar APIs en un sandbox interactivo con datos realistas de seguros, para validar mi integración antes de solicitar acceso a producción.

#### Criterios de Aceptación

1. WHEN un Aliado_Externo selecciona un endpoint en el Motor_Sandbox, THE Motor_Sandbox SHALL presentar una interfaz con selector de endpoint, editor JSON de request body y panel de respuesta
2. WHEN un Aliado_Externo ejecuta una llamada en el Motor_Sandbox, THE Motor_Mock SHALL generar respuestas realistas de seguros simulando el comportamiento de los sistemas legados
3. WHILE un Aliado_Externo opera en la zona privada, THE Motor_Sandbox SHALL utilizar datos mock personalizados por aliado en lugar de datos genéricos
4. THE Motor_Sandbox SHALL soportar simulación de escenarios de error incluyendo circuit breaker, timeouts y códigos de error HTTP
5. WHEN un Aliado_Externo ejecuta una llamada en el Motor_Sandbox, THE Motor_Sandbox SHALL registrar el request y response completos con trace ID para depuración
6. WHILE un Visitante_Público opera en la zona pública, THE Motor_Sandbox SHALL funcionar en modo demo con datos genéricos de solo lectura

### Requerimiento 5: Proceso de Paso a Producción

**Historia de Usuario:** Como Aliado_Externo, quiero consultar el proceso de paso a producción de una API, para saber exactamente qué necesito hacer para integrarme en el ambiente productivo.

#### Criterios de Aceptación

1. THE Portal SHALL documentar el proceso de paso a producción en pasos numerados y claros con un componente visual tipo stepper
2. WHEN un Aliado_Externo accede al proceso de producción de una API, THE Portal SHALL mostrar el contacto de TI responsable del producto (nombre, email y canal Slack)
3. THE Portal SHALL ofrecer el Checklist_Seguridad como documento PDF descargable con los requisitos de seguridad para producción
4. THE Portal SHALL indicar explícitamente el tiempo estimado de aprobación para cada API

### Requerimiento 6: Carga y Publicación de APIs con Generación Automática por IA

**Historia de Usuario:** Como Administrador, quiero subir una nueva API proporcionando su JSON de Request Body, para publicarla completamente documentada sin trabajo manual.

#### Criterios de Aceptación

1. WHEN un Administrador sube un JSON de Request Body con especificaciones de la API, THE Generador_IA_Docs SHALL aceptar el archivo y procesarlo para auto-generación
2. WHEN el Generador_IA_Docs procesa un JSON válido, THE Generador_IA_Docs SHALL auto-generar nombre, descripción, tipo de proceso, especificación OpenAPI 3.1, casos de prueba, configuración de sandbox y snippets de código
3. THE Generador_IA_Docs SHALL generar casos de prueba que incluyan el happy path y un mínimo de 3 escenarios de error
4. WHEN el Generador_IA_Docs inicia el procesamiento, THE Generador_IA_Docs SHALL completar la auto-generación completa en menos de 3 minutos
5. WHEN la auto-generación finaliza, THE Portal SHALL mostrar una vista previa completa de la documentación generada con opción de edición antes de publicar
6. WHEN un Administrador confirma la publicación de una API, THE Log_Auditoría SHALL registrar la acción con identificador de usuario y marca de tiempo

### Requerimiento 7: Parseo y Serialización de Especificaciones OpenAPI

**Historia de Usuario:** Como Administrador, quiero que el sistema parsee y serialice especificaciones OpenAPI 3.1 de forma confiable, para garantizar la integridad de la documentación técnica en todo el ciclo de vida de las APIs.

#### Criterios de Aceptación

1. WHEN se proporciona una especificación OpenAPI 3.1 válida, THE Parser_OpenAPI SHALL parsearla en un objeto de especificación API estructurado
2. WHEN se proporciona una especificación OpenAPI 3.1 inválida, THE Parser_OpenAPI SHALL retornar un error descriptivo indicando la ubicación y naturaleza del problema
3. THE Printer_OpenAPI SHALL formatear objetos de especificación API de vuelta a especificaciones OpenAPI 3.1 válidas
4. FOR ALL objetos de especificación API válidos, parsear y luego imprimir y luego parsear nuevamente SHALL producir un objeto equivalente al original (propiedad round-trip)

### Requerimiento 8: Deprecación de APIs con Notificación a Aliados

**Historia de Usuario:** Como Administrador, quiero deprecar una API con aviso automático a los aliados que la consumen, para gestionar el ciclo de vida sin interrumpir sus integraciones.

#### Criterios de Aceptación

1. WHEN un Administrador depreca una API, THE Portal SHALL mostrar un banner "DEPRECATED" visible en la página de detalle de la API desde la fecha indicada
2. WHEN un Administrador depreca una API, THE Portal SHALL enviar una notificación automática a todos los Aliados_Externos que consumen activamente la API
3. WHEN un Administrador configura la deprecación, THE Sistema_Gobernanza SHALL permitir configurar la Ventana_Migración en 30, 60 o 90 días
4. WHEN un Administrador ejecuta una acción de deprecación, THE Log_Auditoría SHALL registrar la acción en un registro inmutable
5. WHILE una API se encuentra en estado DEPRECATED y no ha alcanzado la fecha de sunset, THE Portal SHALL mantener la API accesible y funcional en el Portal

### Requerimiento 9: Asistente de IA Contextual

**Historia de Usuario:** Como usuario autenticado, quiero interactuar con el asistente de IA integrado, para resolver dudas técnicas y navegar más rápido sin salir del Portal.

#### Criterios de Aceptación

1. WHEN un usuario autenticado realiza una pregunta al Asistente_IA, THE Asistente_IA SHALL responder en el contexto de la pantalla y API que el usuario está visualizando actualmente
2. WHEN un usuario describe una necesidad de negocio al Asistente_IA, THE Asistente_IA SHALL sugerir APIs relevantes del Catálogo que satisfagan la necesidad descrita
3. WHEN un usuario solicita código al Asistente_IA, THE Asistente_IA SHALL generar snippets de código en el lenguaje preferido del usuario (JavaScript, Python, Java o cURL)
4. WHEN un usuario autenticado realiza una consulta, THE Asistente_IA SHALL responder en menos de 3 segundos en el percentil 95 de las consultas
5. WHEN un usuario reporta un error de integración al Asistente_IA, THE Asistente_IA SHALL explicar el error y proporcionar pasos de solución específicos

### Requerimiento 10: Dashboard de Observabilidad y Métricas

**Historia de Usuario:** Como Líder_Técnico, quiero ver métricas de uso y salud del ecosistema de APIs, para tomar decisiones técnicas y de negocio basadas en datos reales.

#### Criterios de Aceptación

1. THE Panel_Observabilidad SHALL mostrar métricas en tiempo real incluyendo número de llamadas, latencia y tasa de errores por API
2. THE Panel_Observabilidad SHALL mostrar percentiles de latencia (p50, p95, p99) visibles por cada API
3. WHEN un Aliado_Externo alcanza el 80% de su cuota asignada, THE Portal SHALL generar una alerta automática visible en el Panel_Observabilidad
4. THE Panel_Observabilidad SHALL soportar trazabilidad distribuida permitiendo seguir una solicitud de extremo a extremo mediante trace ID
5. WHEN un Líder_Técnico solicita exportar datos de consumo, THE Panel_Observabilidad SHALL generar un archivo CSV con datos de consumo por aliado

### Requerimiento 11: Gestión de Usuarios y Control de Acceso

**Historia de Usuario:** Como Administrador, quiero gestionar usuarios y sus roles dentro del Portal, para controlar el acceso a las diferentes zonas y funcionalidades según el perfil de cada usuario.

#### Criterios de Aceptación

1. THE Portal SHALL implementar control de acceso basado en roles (RBAC) con los roles PUBLICO, EXTERNO, LIDER_TECNICO y ADMIN
2. WHEN un Administrador accede al panel de gestión de usuarios, THE Portal SHALL mostrar la lista de usuarios con su rol, estado y fecha de último acceso
3. WHEN un Administrador modifica el rol de un usuario, THE Log_Auditoría SHALL registrar el cambio con identificador del administrador, usuario afectado y marca de tiempo
4. WHILE un usuario tiene rol EXTERNO, THE Portal SHALL restringir el acceso a las funcionalidades de administración, gobernanza y observabilidad avanzada
5. WHILE un usuario tiene rol PUBLICO, THE Portal SHALL restringir el acceso a la zona privada y mostrar únicamente contenido de la zona pública

### Requerimiento 12: Búsqueda Global Semántica

**Historia de Usuario:** Como usuario del Portal, quiero buscar APIs por nombre, producto, proceso o caso de uso con lenguaje natural, para encontrar rápidamente la API que necesito sin conocer la terminología exacta.

#### Criterios de Aceptación

1. THE Buscador_Global SHALL permitir búsqueda por nombre de API, producto, proceso y caso de uso
2. WHEN un usuario ingresa un término de búsqueda, THE Buscador_Global SHALL retornar resultados en menos de 500 milisegundos
3. THE Buscador_Global SHALL ofrecer filtros por producto, proceso, versión y estado de la API
4. WHEN un usuario ingresa una consulta en lenguaje natural, THE Motor_IA SHALL interpretar la intención semántica y retornar APIs relevantes
5. WHILE un usuario autenticado utiliza el Buscador_Global, THE Buscador_Global SHALL mantener un historial de búsquedas recientes accesible para el usuario

### Requerimiento 13: Gobernanza y Ciclo de Vida de APIs

**Historia de Usuario:** Como Administrador, quiero gestionar el ciclo de vida completo de las APIs (publicación, versionamiento, deprecación, sunset), para mantener un ecosistema ordenado y predecible para los aliados.

#### Criterios de Aceptación

1. THE Sistema_Gobernanza SHALL gestionar el ciclo de vida de cada API a través de los estados ACTIVE, DEPRECATED y SUNSET
2. WHEN un Administrador publica una nueva versión de una API, THE Sistema_Gobernanza SHALL registrar la versión con URL versionada (/v1/, /v2/, /v3/)
3. WHEN un Administrador ejecuta una acción de gobernanza (publicar, deprecar, sunset), THE Log_Auditoría SHALL registrar la acción en un registro inmutable con usuario, acción, API afectada y marca de tiempo
4. THE Portal SHALL mostrar un panel de estado con versión, estado y SLA de cada API para el Administrador y el Líder_Técnico
5. WHEN una API alcanza la fecha de sunset, THE Sistema_Gobernanza SHALL desactivar la API del Catálogo y notificar a los Aliados_Externos afectados

### Requerimiento 14: Log de Auditoría Inmutable

**Historia de Usuario:** Como Administrador, quiero que todas las acciones administrativas queden registradas en un log inmutable, para cumplir con los requisitos de la SFC Colombia, Habeas Data y GDPR.

#### Criterios de Aceptación

1. WHEN un usuario con rol ADMIN o LIDER_TECNICO ejecuta una acción administrativa, THE Log_Auditoría SHALL registrar la acción en formato JSON inmutable incluyendo usuario, acción, recurso afectado, marca de tiempo e IP de origen
2. THE Log_Auditoría SHALL retener los registros durante un mínimo de 1 año para cumplimiento con la SFC Colombia
3. WHEN un Administrador consulta el Log_Auditoría, THE Portal SHALL permitir filtrar registros por usuario, tipo de acción, recurso y rango de fechas
4. THE Log_Auditoría SHALL ser inmutable, impidiendo la modificación o eliminación de registros una vez creados

</text>
</invoke>