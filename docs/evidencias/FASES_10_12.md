# Fases 10–12 — Copiloto ejecutivo, reportes y pruebas integrales

## Estado

COMPLETADAS — versión 0.12.0.

## Fase 10 · Copiloto y narrativa IA

- Se añadió el endpoint seguro `POST /api/ai/explain-dashboard`.
- La solicitud envía únicamente el contexto del plan y el resumen necesario del dashboard.
- Gemini devuelve JSON validado con cuatro bloques separados: `DATO`, `INFERENCIA`, `PRONÓSTICO` y `RECOMENDACIÓN`.
- La respuesta se registra dentro del espacio de control del plan con modelo, prompt, respuesta, fecha, estado y confianza.
- El usuario puede editar, aprobar o rechazar la propuesta. Solo una narrativa aprobada se incorpora a los reportes.
- La función utiliza la misma estrategia de modelos de contingencia de la integración existente.
- Si la IA no está disponible, el BSC, las iniciativas, el simulador, el dashboard y los reportes locales continúan funcionando.

## Fase 11 · Excel, PowerPoint y reportes

Se creó el módulo **Reportes** con selección explícita de plan.

Funciones disponibles:

1. Descargar una plantilla `.xlsx` con los KPI e iniciativas del plan.
2. Importar esa plantilla y previsualizar el resultado antes de guardar.
3. Informar errores mediante hoja, fila, columna, campo y motivo.
4. Bloquear la aplicación de una importación que contiene errores.
5. Actualizar valores real, meta, trayectoria, forecast y calidad de KPI.
6. Actualizar avance y estado de iniciativas.
7. Exportar un libro Excel con resumen, objetivos, KPI, iniciativas y simulaciones.
8. Exportar una presentación PowerPoint editable con cinco diapositivas.
9. Generar un informe PDF con resultados, ejecución y narrativa aprobada.

Los archivos Office se generan localmente mediante OOXML y no se transmiten a terceros. La lectura Excel está limitada a 5 MB y a la estructura controlada de la plantilla.

## Fase 12 · Pruebas integrales

La cobertura automatizada incluye:

- creación y navegación base;
- organizaciones y planes;
- integración y decisión humana de IA;
- planeamiento, BSC, KPI, iniciativas, simulación y dashboard;
- validación y aplicación atómica de importaciones;
- detalle de errores de Excel;
- estructura mínima de paquetes XLSX y PPTX;
- seguridad y validación del endpoint de narrativa ejecutiva;
- ausencia de secretos en respuestas del backend.

## Comandos ejecutados

```powershell
npm run lint
npm test
npm run build
npm audit --json
```

Resultado de la primera validación completa:

- lint y TypeScript: OK;
- frontend: 7 archivos y 23 pruebas aprobadas;
- API: 2 archivos y 9 pruebas aprobadas;
- build HTML autocontenido: OK;
- auditoría npm: 0 vulnerabilidades conocidas.

## Prueba manual

1. Ejecutar `npm run dev` y abrir la dirección indicada por Vite.
2. Seleccionar un plan con datos en **Dashboard**.
3. En **Narrativa del dashboard**, escribir un enfoque y generar una propuesta.
4. Verificar que se muestran por separado Dato, Inferencia, Pronóstico y Recomendación.
5. Editar la propuesta, guardarla y aprobarla.
6. Abrir **Reportes** y descargar la plantilla Excel.
7. Modificar valores sin cambiar los nombres de KPI o iniciativas.
8. Seleccionar el archivo; confirmar que aparece la prevalidación y aplicar la importación.
9. Probar un valor inválido para comprobar el detalle de hoja, fila, columna, campo y motivo.
10. Descargar Excel, PowerPoint y PDF y abrirlos en sus aplicaciones correspondientes.
11. Regresar al dashboard y comprobar que los valores importados actualizan los semáforos.

## Decisiones técnicas

- Se mantuvo IndexedDB como persistencia local y no se creó una base remota.
- Se usó generación OOXML propia y acotada para XLSX/PPTX, evitando paquetes con vulnerabilidades conocidas detectadas durante la fase.
- `jsPDF` se carga dinámicamente solo cuando el usuario genera el PDF.
- No se regeneró el EXE durante estas fases, conforme a la decisión de reservar el empaquetado final para la Fase 13.
