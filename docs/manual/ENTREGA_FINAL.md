# Entrega final

La distribución principal contiene dos archivos en `release/final/`:

- `GestionControlEstrategicoIA.exe`: aplicación Windows portable de archivo único.
- `GestionControlEstrategicoIA.html`: versión web autocontenida para abrir localmente en un navegador moderno.

También se genera `release/GestionControlEstrategicoIA-entrega.zip` con ambos archivos y `release/manifest-entrega-final.json` con sus hashes SHA-256.

## Uso del EXE

Copie solamente `GestionControlEstrategicoIA.exe` a cualquier carpeta de Windows y ábralo con doble clic. No requiere Node.js, npm, Python ni una instalación adicional. El respaldo técnico `release/exe/win-unpacked/` no debe entregarse al usuario final.

Windows puede mostrar una advertencia de reputación porque el archivo no cuenta con firma digital comercial. No desactive SmartScreen. Verifique que el archivo provenga de la entrega oficial y que su hash coincida con el manifiesto antes de ejecutarlo.

El EXE incluye como URL inicial del backend `https://pc1-medina-lujan.vercel.app`. La clave Gemini permanece únicamente en Vercel. Si se migra el backend a otra URL, puede cambiarse desde Configuración sin volver a instalar la aplicación.

## Uso del HTML

Abra `GestionControlEstrategicoIA.html` con doble clic. La IA que usa el backend de Vercel requiere internet y las variables configuradas en Vercel. El resto de los módulos funciona localmente.

## Datos y actualizaciones

Cada instalación guarda sus organizaciones, planes, KPI, iniciativas, simulaciones y narrativas aprobadas en el almacenamiento local del equipo. Los datos no quedan dentro del EXE y no se comparten automáticamente entre equipos. Exporte los reportes o registre los datos antes de cambiar de PC.

El EXE no se actualiza solo. Para publicar una nueva versión se modifica el proyecto y se vuelve a generar la entrega con `npm run package:final`.

## Validación antes de entregar

1. Copie únicamente el EXE a una carpeta diferente y ejecútelo.
2. Genere Excel, PowerPoint y PDF desde Reportes. Excel y PowerPoint deben abrirse sin reparar contenido.
3. Abra el HTML local y verifique Inicio, Organizaciones, Planeamiento, Dashboard y Reportes.
4. Si es posible, repita la prueba del EXE en otra PC Windows sin instalar dependencias.
