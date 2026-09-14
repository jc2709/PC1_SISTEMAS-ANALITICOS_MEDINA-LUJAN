# Evidencia — Fase 0: Fundación del proyecto

## Objetivo

Preparar un repositorio profesional, ejecutable en desarrollo y listo para iniciar la implementación funcional por fases.

## Cambios realizados

- Inicialización de React, TypeScript y Vite.
- Configuración de Tailwind CSS mediante su integración oficial para Vite.
- Shell visual responsive con sidebar, cabecera y navegación accesible.
- Dashboard Inicio con cinco indicadores en cero y un estado explícito de IA no configurada.
- Modelos mínimos `Organization` y `StrategicPlan`, preparados para múltiples organizaciones y planes.
- Prueba de humo del dashboard y configuración de lint, build y test.
- Protección de secretos, bases locales, datos de usuario y artefactos mediante `.gitignore`.

## Archivos principales

- `package.json`, `.gitignore`, `.env.example` y `README.md`
- `frontend/src/App.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/StatCard.tsx`
- `frontend/src/layouts/AppShell.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/types/models.ts`
- `frontend/src/test/App.test.tsx`

## Pruebas automatizadas

```bash
npm run lint
npm test
npm run build
```

Resultados finales:

- `npm run lint`: correcto, sin diagnósticos.
- `npm test`: 1 archivo y 1 prueba aprobados.
- `npm run build`: correcto; TypeScript y Vite generaron el paquete de producción.
- `npm run dev`: servidor Vite iniciado correctamente.
- Revisión en navegador: escritorio y viewport móvil de 390 × 844 px correctos, navegación operativa y sin errores de consola.

## Prueba manual

1. Ejecutar `npm install` en la raíz.
2. Ejecutar `npm run dev`.
3. Abrir la URL indicada por Vite.
4. Verificar la marca, el subtítulo, cinco tarjetas con valor cero y `IA: No configurada`.
5. Reducir la ventana y comprobar que el botón de menú abre y cierra la navegación.
6. Seleccionar opciones futuras y confirmar que Inicio permanece como la única vista funcional.

## Problemas encontrados y solución

El repositorio remoto no contenía archivos. Se inicializó una estructura mínima y progresiva, evitando crear módulos correspondientes a fases futuras. La configuración inicial de pruebas pasaba `setupFiles` por línea de comandos, una opción no admitida por Vitest 5; se movió a `vitest.config.ts` y la prueba quedó aprobada.

## Decisiones técnicas

- Se usa un workspace npm raíz para ejecutar todos los comandos requeridos desde el directorio principal.
- Los iconos se empaquetan con `lucide-react`; no dependen de una CDN.
- La navegación futura comunica su estado sin crear pantallas vacías.
- No se implementó almacenamiento, backend, IA, BSC, simulación ni empaquetado, conforme al alcance.

## Estado final

La Fase 0 está lista para verificación. El avance a la Fase 1 requiere autorización explícita.
