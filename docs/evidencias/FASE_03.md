# Evidencia — Fase 3: Organizaciones y planes

## Objetivo

Incorporar el primer flujo funcional de negocio: administrar múltiples organizaciones y múltiples planes estratégicos relacionados, con validación, persistencia local y eliminación controlada.

## Cambios realizados

- CRUD de organizaciones con creación, consulta detallada, edición y eliminación confirmada.
- Registro de nombre, sector, descripción, productos o servicios, clientes, mercados, competidores, misión, visión, principios e información financiera y operativa.
- CRUD de planes estratégicos vinculados obligatoriamente a una organización.
- Periodos de plan con año inicial/final y estados Borrador, Activo o Archivado.
- Filtro de planes por organización.
- Eliminación en cascada de los planes cuando se confirma la eliminación de su organización.
- Contadores reales de organizaciones y planes activos en Inicio.
- Mensajes de éxito, errores controlados, estados vacíos y modales accesibles.
- Migración de IndexedDB a la versión 2 con almacenes `organizations` y `plans`.
- Implementación equivalente en memoria para el modo de respaldo temporal.
- Versión del proyecto actualizada a `0.4.0`.

## Qué puedes usar en esta fase

### Organizaciones

Puedes registrar diferentes empresas o instituciones, consultar toda su ficha, corregir sus datos y eliminarlas con confirmación explícita.

### Planes estratégicos

Puedes crear varios planes por organización, definir su periodo, asignarles un estado, filtrarlos, editarlos y eliminarlos sin afectar a la organización.

### Inicio

Las tarjetas `Organizaciones` y `Planes activos` muestran valores obtenidos de los datos registrados.

## Cómo debe funcionar

- `Organización` abre un directorio con tarjetas y resúmenes.
- `Nueva organización` abre un formulario organizado por identificación, mercado, identidad e información base.
- Nombre y sector son obligatorios; los errores se muestran junto al campo.
- `Ver detalles` presenta todos los datos guardados sin entrar en modo edición.
- `Planeamiento` abre el portafolio de planes de la fase actual.
- No se puede crear un plan si todavía no existe una organización.
- El año final no puede ser anterior al inicial.
- Eliminar una organización informa cuántos planes vinculados también serán eliminados.
- Los datos se mantienen al cerrar y volver a abrir cuando IndexedDB está disponible.
- Reemplazar el EXE por una versión nueva no elimina los datos del perfil local de Windows.

## Cómo probar manualmente

1. Abrir `GestionControlEstrategicoIA.html` o `GestionControlEstrategicoIA.exe`.
2. Entrar en `Organización` y pulsar `Nueva organización`.
3. Intentar guardar vacío y comprobar las validaciones.
4. Registrar `AndesPack S.A.C.` con sector y algunos datos adicionales.
5. Usar el botón de consulta para revisar la ficha completa y luego editarla.
6. Entrar en `Planeamiento`, crear un plan y marcarlo como Activo.
7. Filtrar el listado por organización y editar el periodo o estado.
8. Volver a Inicio y confirmar que los contadores cambiaron.
9. Cerrar y volver a abrir para comprobar persistencia.
10. Probar la eliminación de un plan y la eliminación controlada de una organización con planes.

## Archivos principales creados o modificados

- `frontend/src/types/models.ts`
- `frontend/src/storage/StorageProvider.ts`
- `frontend/src/storage/IndexedDbStorageProvider.ts`
- `frontend/src/storage/InMemoryStorageProvider.ts`
- `frontend/src/services/workspaceService.ts`
- `frontend/src/hooks/useStrategicWorkspace.ts`
- `frontend/src/pages/OrganizationsPage.tsx`
- `frontend/src/pages/PlansPage.tsx`
- `frontend/src/components/OrganizationFormModal.tsx`
- `frontend/src/components/OrganizationDetailsModal.tsx`
- `frontend/src/components/PlanFormModal.tsx`
- `frontend/src/components/Modal.tsx`
- `frontend/src/components/ConfirmDialog.tsx`
- `frontend/src/test/App.test.tsx`
- `frontend/src/test/InMemoryStorageProvider.test.ts`
- `frontend/src/test/workspaceService.test.ts`
- `desktop/main.cjs`

## Pruebas ejecutadas

- Lint de React/TypeScript sin advertencias.
- 3 archivos de prueba y 7 pruebas automatizadas aprobadas.
- Prueba de creación de organización y plan mediante la interfaz.
- Prueba de validaciones y conversión de listas.
- Prueba de persistencia en memoria y eliminación en cascada.
- Build TypeScript y HTML autocontenido correcto.
- Smoke test del EXE para Inicio, Organizaciones, Planes e IndexedDB.

## Problemas encontrados y soluciones

- La primera prueba buscaba un mensaje con puntuación ambigua para nombres terminados en punto. Se normalizaron los mensajes para no duplicar signos.
- El navegador integrado del entorno bloqueó la URL de desarrollo local. La interfaz quedó cubierta con Testing Library y el build de escritorio se valida mediante su smoke test interno.
- Los formularios reinicializaban estado desde efectos. La revisión de React llevó a montarlos con estado inicial perezoso, eliminando renders encadenados y advertencias del lint.
- El smoke test heredaba la última sección guardada y podía producir un falso fallo de Inicio. Ahora espera a que React cargue y navega explícitamente por cada módulo antes de evaluarlo.

## Decisiones técnicas

- Se mantiene IndexedDB para HTML y para el prototipo Electron porque ya está validado y evita introducir SQLite antes de que resulte necesario.
- La interfaz usa tipos de entrada separados de las entidades persistidas para proteger identificadores y fechas de auditoría.
- Los planes se eliminan individualmente; eliminar una organización aplica cascada únicamente después de una confirmación que explica el impacto.
- No se añadieron datos demo automáticos para no mezclar información del proyecto con datos del usuario.
- No se implementaron diagnóstico, Gemini, BSC, Excel ni simulaciones porque pertenecen a fases posteriores.

## Estado final

Fase 3 completada. Organizaciones y planes funcionan localmente y preservan las funcionalidades de las fases anteriores. El avance a la Fase 4 requiere autorización explícita.
