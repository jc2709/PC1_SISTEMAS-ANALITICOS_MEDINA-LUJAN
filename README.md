# Gestión y Control Estratégico IA

Sistema local para formular, ejecutar y monitorear el planeamiento estratégico y el Balanced Scorecard de múltiples organizaciones, con asistencia de inteligencia artificial bajo control humano.

## Objetivo

Construir una aplicación ejecutiva que conecte organizaciones, planes, objetivos, KPI, metas, iniciativas, escenarios y resultados. Sus funciones principales operarán localmente incluso cuando la IA no esté disponible.

## Arquitectura prevista

- **Frontend compartido:** React, TypeScript, Vite y Tailwind CSS.
- **Visualización:** Recharts o Chart.js, cuando se incorporen indicadores reales.
- **Aplicación Windows:** prototipo portable validado con Electron.
- **Persistencia local:** abstracción común con IndexedDB; SQLite queda reservado para una fase posterior si el alcance lo requiere.
- **IA:** API propia desplegable en Vercel que protegerá la clave de Gemini. El frontend nunca contendrá secretos.

Hasta la Fase 2 hay frontend, persistencia mínima y entregables locales; todavía no hay backend ni conexión con Gemini.

## Estructura actual

```text
.
├── docs/
│   └── evidencias/       # Registro verificable de cada fase
├── desktop/              # Contenedor Electron para Windows
├── frontend/
│   ├── public/           # Recursos estáticos
│   └── src/
│       ├── components/   # Componentes reutilizables
│       ├── layouts/      # Estructura visual principal
│       ├── pages/        # Pantallas funcionales
│       ├── hooks/        # Estado y preferencias de la interfaz
│       ├── storage/      # Abstracción y proveedores de almacenamiento
│       ├── test/         # Configuración y pruebas
│       └── types/        # Modelos TypeScript iniciales
├── scripts/              # Construcción y verificación de entregables
├── .env.example          # Nombres de variables, nunca secretos
├── .gitignore
└── package.json          # Comandos del proyecto
```

Las carpetas de backend, persistencia, empaquetado y exportaciones se crearán únicamente cuando su fase las requiera.

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
| 3 | Organizaciones y planes | Pendiente |
| 4 | Integración Gemini y backend Vercel | Pendiente |
| 5 | Planeamiento estratégico | Pendiente |
| 6 | Balanced Scorecard | Pendiente |
| 7 | Iniciativas y Gantt | Pendiente |
| 8 | Simulación multiperiodo/multiescenario | Pendiente |
| 9 | Dashboard y seguimiento | Pendiente |
| 10 | Copiloto y narrativa IA | Pendiente |
| 11 | Excel, PPT y reportes | Pendiente |
| 12 | Pruebas integrales | Pendiente |
| 13 | Documentación y empaquetado final | Pendiente |

## Estado actual

**Fase 2 — HTML local y EXE:** el frontend genera un `index.html` autocontenido y un único `GestionControlEstrategicoIA.exe` portable basado en Electron. `win-unpacked` se conserva solo como respaldo técnico de desarrollo.

Consulte [docs/evidencias/FASE_02.md](docs/evidencias/FASE_02.md) para ver las decisiones, pruebas y modo de uso de esta entrega.

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
