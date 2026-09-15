# Evidencia — Fase 5: Planeamiento estratégico

## Objetivo

Convertir cada plan registrado en un espacio de formulación estratégica trazable, separando preparación, diagnóstico, identidad y elección estratégica, con persistencia local y control humano sobre cualquier contenido procedente de IA.

## Cambios realizados

- Nuevo espacio `Formular` disponible desde cada plan estratégico.
- Flujo guiado en cuatro pasos: Preparación, Diagnóstico, Identidad y Estrategia.
- Mandato y reto estratégico vinculados al contexto de la organización.
- Matriz FODA editable mediante listas independientes.
- Registro estructurado de hechos críticos con evidencia, explicación, impacto, incertidumbre, fuente, confianza y necesidad de decisión.
- Diseño de misión mediante cliente prioritario, necesidad, oferta, resultado, diferenciación, capacidades y principios.
- Declaraciones de misión, visión y horizonte temporal.
- Elecciones explícitas sobre dónde competir, cómo ganar, capacidades, sistema de gestión y renuncias.
- Estado independiente por etapa: `DRAFT`, `IN_REVIEW` o `APPROVED`.
- Validaciones que impiden aprobar una etapa esencial sin su contenido mínimo.
- Acción explícita `Incorporar al plan` para reutilizar el diagnóstico de IA aprobado más reciente.
- La importación lleva fortalezas al FODA, riesgos a amenazas y prioridades a hechos críticos; evita duplicados y conserva el modelo y la confianza como trazabilidad.
- Migración de IndexedDB a versión 4 con el almacén `strategicPlannings` y relación única por plan.
- Persistencia equivalente en memoria cuando IndexedDB no está disponible.
- Borrado en cascada del planeamiento al eliminar su plan u organización.
- Versión del proyecto actualizada a `0.6.0`.

## Qué puedes usar en esta fase

Puedes abrir `Planeamiento`, crear o elegir un plan y pulsar `Formular`. Desde allí puedes construir y guardar el mandato, el FODA, los hechos críticos, la identidad y las elecciones estratégicas. Si ya aprobaste una propuesta en `IA`, puedes incorporarla al diagnóstico del plan y después corregirla antes de guardar.

## Cómo debe funcionar

- `Formular` abre únicamente el contenido del plan seleccionado y muestra su organización y periodo.
- Cambiar campos marca el planeamiento como `Cambios sin guardar`.
- `Guardar planeamiento` valida el contenido y lo almacena localmente en el navegador y dispositivo actuales.
- Cada paso puede permanecer en Borrador, pasar a En revisión o marcarse Aprobado.
- Una etapa vacía no puede guardarse como Aprobada; el sistema explica qué falta.
- Aprobar una propuesta en `IA` no altera por sí solo el planeamiento.
- `Incorporar al plan` aparece habilitado solo cuando existe un diagnóstico aprobado para el mismo plan.
- La incorporación modifica el borrador visible; todavía debes revisarlo y pulsar `Guardar planeamiento`.
- Repetir la incorporación no duplica fortalezas, amenazas ni prioridades equivalentes.
- Los datos no viajan a GitHub ni se guardan dentro del EXE: permanecen en IndexedDB del perfil que abrió la aplicación.

## Archivos principales

- `frontend/src/pages/PlanningHubPage.tsx`
- `frontend/src/pages/StrategicPlanningPage.tsx`
- `frontend/src/components/ListField.tsx`
- `frontend/src/components/StrategicFactsEditor.tsx`
- `frontend/src/services/planningService.ts`
- `frontend/src/types/models.ts`
- `frontend/src/hooks/useStrategicWorkspace.ts`
- `frontend/src/storage/StorageProvider.ts`
- `frontend/src/storage/InMemoryStorageProvider.ts`
- `frontend/src/storage/IndexedDbStorageProvider.ts`

## Pruebas

- Creación del borrador completo con estados iniciales.
- Validación de etapas aprobadas sin contenido mínimo.
- Normalización y eliminación de duplicados.
- Importación exclusiva de diagnósticos aprobados.
- Mapeo de fortalezas, riesgos y prioridades procedentes de IA.
- Persistencia y borrado en cascada del planeamiento.
- Flujo de interfaz completo: generar, aprobar, incorporar y guardar.
- 14 pruebas de frontend y 6 pruebas del endpoint aprobadas.
- Lint y validación TypeScript sin advertencias.
- Build de producción generado correctamente; no se regeneró el EXE por acuerdo con el usuario.
- Servidor local verificado con HTTP 200 y contenedor React disponible.
- Commit funcional `715ec21` publicado en GitHub y detectado en producción mediante el texto propio de la Fase 5.
- `https://pc1-medina-lujan.vercel.app` verificado con HTTP 200 después del despliegue.
- Backend publicado verificado con HTTP 200 y estado `ready` después del despliegue.

## Decisiones técnicas

- Existe un único documento de formulación por plan para evitar versiones paralelas accidentales.
- La IA continúa siendo una fuente de propuestas, nunca un actor que aprueba o modifica silenciosamente el plan.
- El FODA usa listas editables y los asuntos que requieren decisión se modelan como hechos críticos estructurados.
- Escenarios, objetivos BSC e iniciativas no se adelantaron: corresponden a las fases 8, 6 y 7 respectivamente.

## Estado final

Fase 5 implementada, probada y desplegada. El planeamiento puede formularse completamente sin IA; la IA aprobada se reutiliza solo mediante una acción humana explícita y queda sujeta a revisión antes del guardado.
