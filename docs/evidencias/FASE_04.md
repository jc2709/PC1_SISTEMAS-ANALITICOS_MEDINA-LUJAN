# Evidencia — Fase 4: Integración Gemini y backend Vercel

## Objetivo

Preparar una conexión segura entre la aplicación local y Google Gemini mediante una función desplegable en Vercel, incorporar una primera propuesta estratégica estructurada y mantener el control humano y la trazabilidad local.

## Cambios realizados

- Endpoint `GET/POST /api/ai/strategic-analysis` compatible con Vercel Functions.
- Clave `GEMINI_API_KEY` leída exclusivamente en el servidor.
- Modelo configurable mediante `GEMINI_MODEL`, con valor estable inicial `gemini-2.5-flash`.
- Respuesta JSON estructurada con resumen, fortalezas, riesgos, prioridades y confianza.
- Validación del input, pertenencia del plan, tamaño máximo y salida de Gemini.
- Restricción CORS configurable para frontend web y aplicación local.
- Tiempo máximo de solicitud y mensajes controlados para clave ausente, límite, rechazo y caída del proveedor.
- Pantalla `Copiloto IA` con selección de organización, plan y enfoque.
- Estados visuales: No configurada, Verificando, Conectada, Sin conexión, Procesando y Error.
- Control humano: Aprobar, Editar o Rechazar cada propuesta.
- Bitácora local con fecha, módulo, modelo, respuesta y decisión del usuario.
- Migración de IndexedDB a versión 3 con el almacén `aiInteractions`.
- Configuración local de la URL pública del backend; nunca de la clave Gemini.
- Versión del proyecto actualizada a `0.5.0`.

## Qué puedes usar en esta fase

Sin un backend desplegado puedes abrir el módulo IA, consultar su estado, configurar la URL y comprobar que una falla de conexión no bloquea la aplicación. Con Vercel y Gemini configurados puedes generar un análisis estratégico inicial para un plan, revisarlo, editarlo, aprobarlo o rechazarlo y consultar la bitácora.

## Cómo debe funcionar

- La pantalla inicia como `IA: No configurada` si no existe URL del backend.
- Al guardar la URL se consulta el endpoint de estado sin recibir ni mostrar la clave.
- Solo se habilita `Generar propuesta` cuando hay organización, plan y conexión lista.
- Durante la solicitud aparece `IA: Procesando`; el resto del sistema continúa utilizable.
- Una respuesta con formato inválido se rechaza y permite reintentar.
- La propuesta inicia como `AI_PROPOSED` y no altera el plan.
- `Editar` crea contenido marcado como modificado por el usuario.
- `Aprobar` o `Rechazar` guarda la decisión localmente.
- Si no hay Internet aparece `IA no disponible temporalmente` sin perder información local.

## Archivos principales

- `api/ai/strategic-analysis.ts`
- `frontend/server/ai/strategicAnalysis.ts`
- `frontend/server/ai/strategicAnalysisHandler.ts`
- `frontend/vercel.json` (compatibilidad cuando Vercel usa `frontend` como directorio raíz)
- `frontend/package.json` declara como opcionales los binarios Linux de Tailwind/Lightning CSS requeridos por Vercel
- `vercel.json`
- `tsconfig.api.json`
- `frontend/src/pages/AIPage.tsx`
- `frontend/src/components/AIStatusBadge.tsx`
- `frontend/src/components/AIProposalEditor.tsx`
- `frontend/src/hooks/useAIGateway.ts`
- `frontend/src/services/aiService.ts`
- `frontend/src/types/models.ts`
- `frontend/src/storage/IndexedDbStorageProvider.ts`
- `docs/manual/CONFIGURACION_GEMINI.md`

## Pruebas

- Validación de frontend y backend con TypeScript.
- Pruebas del endpoint sin clave, respuesta válida y plan incongruente.
- Pruebas del cliente sin configuración, validación de JSON y decisiones humanas.
- Flujo de interfaz con backend simulado: configurar, generar y aprobar.
- Persistencia y borrado en cascada de interacciones.
- Build de HTML autocontenido para comprobar compatibilidad; no se regeneró el entregable final por acuerdo con el usuario.
- 11 pruebas de frontend y 3 pruebas del endpoint aprobadas.
- Servidor local verificado con respuesta HTTP 200 y contenedor React presente.

## Problemas y soluciones

- La configuración de pruebas del API no resolvía Vitest desde la raíz del monorepo. Se ubicó junto al workspace frontend y se estableció explícitamente la raíz del repositorio.
- La actualización normal del lockfile quedó esperando red. Se interrumpió sin cambios parciales y se actualizó en modo offline, ya que no se añadieron paquetes.
- El lint detectó una actualización inmediata de estado dentro de un efecto. La comprobación automática ahora actualiza el estado únicamente al resolver la solicitud asíncrona.
- La herramienta de navegador automatizado no está instalada en este entorno. La verificación se completó con el flujo integral de Testing Library, el build y una comprobación HTTP del servidor local.

## Decisiones técnicas

- Se utiliza `fetch` y Web APIs estándar en la función para evitar dependencias innecesarias.
- La respuesta de Gemini se valida tanto en el backend como en el cliente.
- No se desplegó ni configuró una clave real desde el repositorio. El propietario debe añadirla directamente en Vercel.
- La bitácora se guarda en IndexedDB del usuario y no en Vercel o GitHub.
- No se implementaron autenticación cloud, búsqueda web ni módulos de planeamiento de la Fase 5.

## Estado final

Fase 4 implementada y verificable con pruebas automatizadas. La conexión real queda disponible al desplegar el backend y configurar las variables privadas según el manual.
