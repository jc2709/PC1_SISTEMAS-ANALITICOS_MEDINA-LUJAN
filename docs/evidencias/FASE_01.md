# Evidencia — Fase 1: Shell visual y almacenamiento mínimo

## Objetivo

Convertir la base visual en una shell funcional y demostrar almacenamiento local persistente sin adelantar el CRUD de organizaciones y planes.

## Cambios realizados

- Contrato `StorageProvider` desacoplado del mecanismo de persistencia.
- `IndexedDbStorageProvider` para preferencias locales en la versión HTML.
- `InMemoryStorageProvider` como alternativa segura cuando IndexedDB no está disponible.
- Inicialización controlada con pantalla de carga y advertencia no bloqueante ante fallos.
- Persistencia de la última sección visitada y de la preferencia de navegación compacta.
- Pantalla Configuración funcional con información clara de privacidad local.
- Indicador `Datos locales: Listos` o `Datos locales: Temporales`.
- Ajuste responsive del sidebar compacto y menú móvil completo.

## Qué puedes usar en esta fase

- La pantalla Inicio y su navegación lateral.
- La pantalla Configuración.
- El interruptor `Navegación compacta` en equipos de escritorio.
- El indicador de disponibilidad del almacenamiento local.
- La restauración automática de la última sección al volver a abrir o recargar la aplicación.

Los módulos Organización, Planeamiento, Balanced Scorecard, Simulación, Dashboard e IA todavía muestran un aviso de próxima fase y no guardan datos de negocio.

## Cómo usarlo

1. Ejecutar `npm install` y después `npm run dev` desde la raíz.
2. Abrir la URL indicada por Vite.
3. Entrar a **Configuración** desde la barra lateral.
4. Activar **Navegación compacta** para reducir la barra en pantallas grandes.
5. Recargar la página: Configuración debe continuar abierta y el modo compacto debe mantenerse.
6. Desactivar el interruptor para recuperar la barra completa.

## Cómo debe funcionar

- Al iniciar, se muestra brevemente una pantalla de preparación mientras abre el almacenamiento local.
- Con IndexedDB disponible aparece `Datos locales: Listos`.
- Cada cambio del interruptor se refleja inmediatamente y se guarda en este navegador.
- En móvil, el menú continúa mostrando textos completos aunque el modo compacto esté activado.
- Si IndexedDB falla, la aplicación no se cierra: usa memoria temporal, muestra `Datos locales: Temporales` y explica que los cambios no sobrevivirán al cierre.
- Ninguna preferencia se envía a GitHub, Gemini ni otro servicio externo.

## Archivos principales creados o modificados

- `frontend/src/storage/StorageProvider.ts`
- `frontend/src/storage/IndexedDbStorageProvider.ts`
- `frontend/src/storage/InMemoryStorageProvider.ts`
- `frontend/src/storage/createStorageProvider.ts`
- `frontend/src/hooks/useAppPreferences.ts`
- `frontend/src/pages/SettingsPage.tsx`
- `frontend/src/components/StorageBadge.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/App.tsx`
- `frontend/src/test/InMemoryStorageProvider.test.ts`
- `README.md`

## Pruebas ejecutadas

- `npm run lint`: correcto, sin advertencias.
- `npm test`: 2 archivos y 2 pruebas aprobados.
- `npm run build`: correcto.
- `npm run dev`: servidor iniciado correctamente.
- Navegador de escritorio: IndexedDB disponible, cambio visual correcto y sin errores de consola.
- Recarga: última sección y modo compacto restaurados correctamente.
- Vista móvil de 390 × 844 px: configuración adaptable y menú completo correcto.

## Problemas encontrados y solución

- El revisor de React detectó estado derivado mediante un efecto y lectura de una referencia durante render. Se derivó la sección activa directamente desde las preferencias y se inicializó el proveedor dentro del efecto.
- El primer diseño compacto desbordaba el texto del estado IA. En escritorio compacto se conserva un indicador con título accesible; en móvil permanece el texto completo.
- La pantalla Inicio conservaba rótulos de la Fase 0. Se actualizaron para reflejar la disponibilidad real del almacenamiento.

## Decisiones técnicas

- IndexedDB guarda solo preferencias de shell en esta fase; los datos de organizaciones y planes pertenecen a la Fase 3.
- El contrato de almacenamiento no expone detalles de IndexedDB a los componentes React.
- La alternativa en memoria mantiene operativa la aplicación ante restricciones del navegador.
- No se añadió ninguna dependencia nueva.

## Estado final

Fase 1 completada. El avance a la Fase 2 requiere autorización explícita.
