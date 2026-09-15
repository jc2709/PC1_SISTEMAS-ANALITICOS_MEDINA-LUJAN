# Evidencia — Fases 6 a 9: Control estratégico integrado

## Alcance autorizado

Por solicitud expresa del usuario, las fases 6, 7, 8 y 9 se implementaron y validaron como un único bloque continuo. El objetivo fue evitar módulos aislados y construir una trazabilidad directa entre objetivo, KPI, iniciativa, simulación y dashboard.

## Fase 6 — Balanced Scorecard

- Cuatro perspectivas: Financiera, Clientes, Procesos internos y Aprendizaje y crecimiento.
- CRUD de objetivos con descripción, responsable y prioridad.
- Mapa estratégico organizado por perspectiva.
- Relaciones causa → efecto con descripción, confianza y aprobación humana.
- Fichas KPI con nombre, descripción, propósito, fórmula, unidad, dirección, fuente, frecuencia, línea base, meta, trayectoria, real, forecast, responsable, acción ante desvío, calidad y riesgo.
- Semáforo determinístico Verde, Ámbar, Rojo o Gris; Gris representa datos faltantes.
- Estado de cada objetivo calculado a partir de sus KPI.

## Fase 7 — Iniciativas y Gantt

- CRUD de iniciativas vinculadas a un objetivo y opcionalmente a un KPI.
- Responsable, fechas, presupuesto, beneficio esperado, riesgo, estado, avance y dependencias.
- Estados `PLANNED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED` y `CANCELLED`.
- Gantt generado desde las fechas registradas.
- Visualización de dependencias y detección de iniciativas retrasadas.
- Aprobación explícita del cronograma; cualquier modificación invalida la aprobación previa.

## Fase 8 — Simulación

- Escenarios Base, Protección, Expansión y Personalizado.
- Periodo libre para análisis anual, trimestral u otro esquema.
- Variables: ventas, EBIT, tasa fiscal, WACC, capital invertido, OTIF, WAPE y OEE.
- Cálculos locales: `NOPAT = EBIT × (1 − tasa)`, `ROIC = NOPAT / capital invertido` y `EVA = NOPAT − (WACC × capital invertido)`.
- Comparación Base contra valor modificado con diferencia absoluta y porcentual.
- Historial multiperiodo y multiescenario con resultados guardados.
- Funcionamiento completamente determinístico y sin dependencia de Internet o Gemini.

## Fase 9 — Dashboard y seguimiento

- Tarjetas de EVA, ventas, EBIT, NOPAT, ROIC, OTIF, WAPE, OEE y KPI certificados.
- Conteo de objetivos por semáforo.
- Estado de iniciativas completadas, en ejecución, planificadas y retrasadas.
- Cockpit por KPI con objetivo, real, meta, trayectoria, estado, forecast y acción ante desvío.
- Integración con la simulación guardada más reciente y los valores reales del BSC.
- Resumen de Inicio actualizado con cantidades reales de objetivos, KPI e iniciativas.

## Persistencia y trazabilidad

- Nuevo modelo `ControlWorkspace`, único por plan.
- Migración de IndexedDB a versión 5 mediante el almacén `controlWorkspaces`.
- Persistencia equivalente en memoria si IndexedDB no está disponible.
- Eliminación en cascada cuando se elimina la organización o el plan.
- Eliminación controlada de relaciones, KPI e iniciativas cuando desaparece su objetivo.
- Los datos permanecen en el navegador y dispositivo del usuario; no se sincronizan con GitHub.

## Qué puedes usar

1. Crear objetivos y KPI en `Balanced Scorecard`.
2. Relacionar objetivos para formar el mapa estratégico.
3. Crear iniciativas desde `Iniciativas` y aprobar su Gantt.
4. Guardar uno o varios escenarios y periodos desde `Simulación`.
5. Consultar resultados consolidados desde `Dashboard`.

## Cómo debe funcionar

- Todos los módulos seleccionan el mismo plan y muestran solamente sus datos.
- Un KPI sin valor real, meta o calidad disponible aparece Gris.
- El semáforo se recalcula inmediatamente al editar un KPI.
- Una iniciativa vencida y no completada/cancelada aparece Retrasada.
- Protección y Expansión aplican supuestos reproducibles; Personalizado permite editar todas las variables.
- Guardar una simulación no sobrescribe los KPI reales ni modifica el plan.
- El dashboard lee el último escenario guardado y el estado vigente de KPI e iniciativas.
- La caída de Gemini no afecta BSC, Gantt, simulaciones ni dashboard.

## Archivos principales

- `frontend/src/pages/BSCPage.tsx`
- `frontend/src/pages/InitiativesPage.tsx`
- `frontend/src/pages/SimulationPage.tsx`
- `frontend/src/pages/ExecutiveDashboardPage.tsx`
- `frontend/src/components/PlanContextSelector.tsx`
- `frontend/src/services/controlService.ts`
- `frontend/src/types/models.ts`
- `frontend/src/hooks/useStrategicWorkspace.ts`
- `frontend/src/storage/IndexedDbStorageProvider.ts`

## Pruebas de cierre

- Fórmulas financieras y escenarios determinísticos.
- Semáforo KPI y tratamiento de datos faltantes.
- Detección de retrasos.
- Borrado en cascada y persistencia.
- Flujo completo de interfaz desde objetivo hasta dashboard.
- Lint, TypeScript, pruebas unitarias y build de producción.
- No se regenera el EXE ni el entregable HTML en este bloque, por acuerdo con el usuario.
- 20 pruebas de frontend aprobadas y 6 pruebas del endpoint aprobadas.
- Build de producción y lint completados sin errores ni advertencias.
- Servidor local y módulo BSC verificados con HTTP 200.
- Commit funcional `63799c1` publicado en GitHub.
- Producción verificada con HTTP 200 y presencia de BSC, Gantt, Simulación y Dashboard.
- Backend de Gemini verificado después del despliegue con HTTP 200 y estado `ready`.

## Versión

Versión funcional `0.9.0`. No se creó ningún tag automáticamente.

## Estado final

Fases 6, 7, 8 y 9 implementadas, probadas y desplegadas como un único bloque integrado.
