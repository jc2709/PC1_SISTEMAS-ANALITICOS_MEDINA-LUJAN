# Gestión y Control Estratégico IA

Sistema local para formular, ejecutar y monitorear el planeamiento estratégico y el Balanced Scorecard de múltiples organizaciones, con asistencia de inteligencia artificial bajo control humano.

Aplicación web: https://pc1-medina-lujan.vercel.app

## Objetivo

Construir una aplicación ejecutiva que conecte organizaciones, planes, objetivos, KPI, metas, iniciativas, escenarios y resultados. Sus funciones principales operarán localmente incluso cuando la IA no esté disponible.

## Arquitectura prevista

- **Frontend compartido:** React, TypeScript, Vite y Tailwind CSS.
- **Visualización:** Recharts o Chart.js, cuando se incorporen indicadores reales.
- **Aplicación Windows:** prototipo portable validado con Electron.
- **Persistencia local:** abstracción común con IndexedDB; SQLite queda reservado para una fase posterior si el alcance lo requiere.
- **IA:** API propia desplegable en Vercel que protege la clave de Gemini, valida respuestas estructuradas y mantiene cada propuesta bajo decisión humana.

Hasta la Fase 9 existe un flujo integrado desde la formulación hasta el control: organizaciones, planes, diagnóstico asistido, planeamiento, mapa estratégico, KPI, iniciativas, Gantt, simulaciones financieras y dashboard ejecutivo. Todo el contenido funcional se conserva localmente por plan; Gemini sigue operando mediante el backend seguro desplegado en Vercel.

## Estructura actual

```text
.
├── docs/
│   └── evidencias/       # Registro verificable de cada fase
├── desktop/              # Contenedor Electron para Windows
├── api/                  # Funciones seguras de IA para Vercel
├── frontend/
│   ├── public/           # Recursos estáticos
│   └── src/
│       ├── components/   # Componentes reutilizables
│       ├── layouts/      # Estructura visual principal
│       ├── pages/        # Pantallas funcionales
│       ├── hooks/        # Estado y preferencias de la interfaz
│       ├── services/     # Validación y reglas de aplicación
│       ├── storage/      # Abstracción y proveedores de almacenamiento
│       ├── test/         # Configuración y pruebas
│       └── types/        # Modelos TypeScript iniciales
├── scripts/              # Construcción y verificación de entregables
├── vercel.json           # Build web y configuración de funciones
├── .env.example          # Nombres de variables, nunca secretos
├── .gitignore
└── package.json          # Comandos del proyecto
```

Las carpetas de backend y exportaciones se crearán únicamente cuando su fase las requiera.

## Desarrollo local

Requisitos: Node.js 22.12 o superior y npm.

```bash
npm install
npm run dev
```

Vite mostrará la URL local de desarrollo. Para controles de calidad:

```bash
npm run lint
npm test
npm run build
```

El resultado de producción queda en `frontend/dist/`. La apertura directa mediante `file://` y el ejecutable Windows fueron validados en la Fase 2.

## Fases

| Fase | Alcance | Estado |
| --- | --- | --- |
| 0 | Fundación del repositorio | Completada |
| 1 | Shell visual y almacenamiento mínimo | Completada |
| 2 | Prototipo HTML local y prototipo EXE | Completada con observación |
| 3 | Organizaciones y planes | Completada |
| 4 | Integración Gemini y backend Vercel | Completada |
| 5 | Planeamiento estratégico | Completada |
| 6 | Balanced Scorecard | Completada |
| 7 | Iniciativas y Gantt | Completada |
| 8 | Simulación multiperiodo/multiescenario | Completada |
| 9 | Dashboard y seguimiento | Completada |
| 10 | Copiloto y narrativa IA | Pendiente |
| 11 | Excel, PPT y reportes | Pendiente |
| 12 | Pruebas integrales | Pendiente |
| 13 | Documentación y empaquetado final | Pendiente |

## Estado actual

**Fases 6–9 — Control estratégico integrado:** el Balanced Scorecard administra objetivos, relaciones causa–efecto y KPI con semáforo; las iniciativas alimentan un Gantt aprobable; el simulador compara escenarios y calcula NOPAT, ROIC y EVA; el dashboard consolida resultados, calidad de datos y estado de ejecución.

Consulte [docs/evidencias/FASES_06_09.md](docs/evidencias/FASES_06_09.md) para ver las decisiones y pruebas, y [docs/manual/CONFIGURACION_GEMINI.md](docs/manual/CONFIGURACION_GEMINI.md) para revisar la conexión sin exponer secretos.

## Backend Gemini

El endpoint disponible es `GET/POST /api/ai/strategic-analysis`. `GET` informa si el proveedor está configurado y `POST` recibe una organización, un plan vinculado y un enfoque opcional. La respuesta se limita a un esquema JSON validado.

Variables privadas del backend:

```text
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
AI_ALLOWED_ORIGINS=http://localhost:4173,http://127.0.0.1:4173
AI_ALLOW_LOCAL_APP=false
```

Nunca utilice el prefijo `VITE_` para la clave. La única variable pública opcional es `VITE_AI_API_BASE_URL`, que contiene la URL de Vercel y no un secreto.

## Generar HTML y aplicación Windows

```bash
npm run build:html
npm run build:exe
npm run verify:exe
```

- HTML autocontenido: `frontend/dist/index.html`.
- Aplicación Windows principal: `release/exe/GestionControlEstrategicoIA.exe`.
- Respaldo técnico: `release/exe/win-unpacked/GestionControlEstrategicoIA.exe`.

El EXE principal puede copiarse por sí solo a otra carpeta o PC. No requiere instalar Node.js, npm o Python. El respaldo `win-unpacked` no forma parte de la distribución principal.
