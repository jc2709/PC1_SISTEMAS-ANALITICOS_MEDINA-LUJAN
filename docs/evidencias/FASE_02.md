# Evidencia — Fase 2: Prototipo HTML local y prototipo EXE

## Objetivo

Demostrar temprano que la interfaz compartida puede abrirse como un único archivo HTML y como aplicación ejecutable de Windows sin servidores ni herramientas manuales para el usuario final.

## Cambios realizados

- Build Vite autocontenido mediante `vite-plugin-singlefile`.
- Rutas relativas y favicon embebido para uso local.
- Verificador que rechaza scripts, CSS o rutas `/assets` externas.
- Contenedor Electron con aislamiento de contexto, sandbox y Node.js deshabilitado en el renderer.
- Bloqueo de ventanas nuevas y navegación externa desde el contenedor.
- Empaquetado Windows x64 con `electron-builder`.
- Smoke test interno del EXE para validar título, dashboard, estado local e IndexedDB.
- Scripts PowerShell reproducibles para construir y verificar ambos formatos.

## Qué puedes usar en esta fase

### HTML local

El archivo `GestionControlEstrategicoIA.html`. Se abre con doble clic en un navegador moderno y contiene toda la interfaz, CSS, JavaScript e iconos necesarios.

### Aplicación Windows

El paquete `GestionControlEstrategicoIA-Windows.zip`. Después de extraerlo, se abre `GestionControlEstrategicoIA.exe`; no requiere Node.js, npm, Python, servidor, terminal ni instalación.

## Cómo debe funcionar

- Ambos formatos muestran el mismo Inicio, Configuración, sidebar y estado de almacenamiento.
- La versión HTML usa IndexedDB del navegador cuando `file://` lo permite; si el navegador lo restringe, la aplicación continúa en modo temporal con una advertencia.
- El EXE abre una ventana independiente titulada `Gestión y Control Estratégico IA`.
- El EXE conserva las preferencias locales entre ejecuciones mediante IndexedDB de Electron.
- Cerrar la ventana termina la aplicación.
- No se conecta a Gemini ni almacena claves.

## Cómo probar manualmente

### HTML

1. Abrir `GestionControlEstrategicoIA.html` con doble clic.
2. Confirmar que aparece el dashboard, no una página en blanco.
3. Entrar a Configuración, activar la navegación compacta y recargar.
4. Confirmar que la interfaz continúa operativa. La persistencia puede variar según las políticas `file://` del navegador.

### Windows

1. Extraer completamente `GestionControlEstrategicoIA-Windows.zip`.
2. No mover únicamente el EXE fuera de su carpeta.
3. Abrir `GestionControlEstrategicoIA.exe`.
4. Confirmar el dashboard y `Datos locales: Listos`.
5. Cambiar la navegación compacta, cerrar y volver a abrir para comprobar persistencia.

## Archivos principales creados o modificados

- `desktop/main.cjs`
- `frontend/vite.config.ts`
- `frontend/index.html`
- `scripts/build-html/build.ps1`
- `scripts/build-html/verify.mjs`
- `scripts/build-exe/build.ps1`
- `scripts/build-exe/verify.ps1`
- `package.json`
- `README.md`

## Pruebas ejecutadas

- `npm run build:html`: correcto; HTML único de aproximadamente 272 KiB.
- Verificación de autocontenido: correcta, sin referencias CSS/JS externas.
- `npm run build:exe`: correcto; carpeta portable Windows x64 generada.
- Smoke test del EXE: `ok: true`; título, dashboard, estado local e IndexedDB correctos.
- Ejecución normal del EXE en carpeta: ventana visible, título correcto y proceso respondiendo.
- Lint, pruebas unitarias y build TypeScript: correctos.

## Problemas encontrados y soluciones

- Python no estaba instalado. Se eligió Electron porque empaqueta el runtime y reutiliza el frontend sin exigir dependencias al usuario.
- La compresión del ejecutable autocontenido era muy lenta en este equipo. Se validó con compresión `store`.
- Microsoft SmartScreen bloqueó el envoltorio EXE autocontenido por no tener un certificado de firma de código. No se desactivó ni eludió la protección. La entrega recomendada es la carpeta portable dentro de un ZIP.
- El smoke test se ejecutaba antes de terminar la inicialización de React; ahora espera el estado local hasta cinco segundos y usa un perfil aislado.
- Se mantuvo una referencia global de `BrowserWindow` para asegurar su ciclo de vida.

## Decisiones técnicas

- Electron queda validado para el prototipo, pero la elección definitiva podrá reevaluarse antes del empaquetado final.
- Los recursos se distribuyen expandidos dentro de la carpeta portable: evita un fallo de carga observado con ASAR y no cambia la experiencia del usuario, que recibe un único ZIP.
- No se incluye un certificado autofirmado porque no elimina correctamente SmartScreen y obligaría al usuario a confiar manualmente en él.
- Los binarios generados están ignorados por Git y se distribuyen como artefactos, no como código fuente.
- No se implementó SQLite ni lógica funcional de organizaciones, conforme al alcance.

## Estado final

Fase 2 completada con observación: el HTML y el EXE en carpeta funcionan; el EXE autocontenido sin firma es bloqueado por SmartScreen en este equipo. El avance a la Fase 3 requiere autorización explícita.
