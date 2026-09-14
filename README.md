# Gestión y Control Estratégico IA

Sistema local para formular, ejecutar y monitorear el planeamiento estratégico y el Balanced Scorecard de múltiples organizaciones, con asistencia de inteligencia artificial bajo control humano.

## Objetivo

Construir una aplicación ejecutiva que conecte organizaciones, planes, objetivos, KPI, metas, iniciativas, escenarios y resultados. Sus funciones principales operarán localmente incluso cuando la IA no esté disponible.

## Arquitectura prevista

- **Frontend compartido:** React, TypeScript, Vite y Tailwind CSS.
- **Visualización:** Recharts o Chart.js, cuando se incorporen indicadores reales.
- **Aplicación Windows:** contenedor de escritorio por validar mediante un prototipo temprano.
- **Persistencia local:** una abstracción común con IndexedDB para HTML y SQLite para escritorio.
- **IA:** API propia desplegable en Vercel que protegerá la clave de Gemini. El frontend nunca contendrá secretos.

La Fase 0 solo implementa la base del frontend. No hay backend, persistencia ni conexión con Gemini todavía.

## Estructura actual

```text
.
├── docs/
│   └── evidencias/       # Registro verificable de cada fase
├── frontend/
│   ├── public/           # Recursos estáticos
│   └── src/
│       ├── components/   # Componentes reutilizables
│       ├── layouts/      # Estructura visual principal
│       ├── pages/        # Pantallas funcionales
│       ├── test/         # Configuración y pruebas
│       └── types/        # Modelos TypeScript iniciales
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

El resultado de producción queda en `frontend/dist/`. La apertura directa mediante `file://` y el ejecutable Windows se validarán en la Fase 2.

## Fases

| Fase | Alcance | Estado |
| --- | --- | --- |
| 0 | Fundación del repositorio | Completada |
| 1 | Shell visual y almacenamiento mínimo | Pendiente |
| 2 | Prototipo HTML local y prototipo EXE | Pendiente |
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

**Fase 0 — Fundación:** interfaz Inicio, navegación visual, modelos mínimos `Organization` y `StrategicPlan`, configuración de calidad y documentación. Los contadores son marcadores en cero y las opciones distintas de Inicio están señaladas como próximas funcionalidades.

Consulte [docs/evidencias/FASE_00.md](docs/evidencias/FASE_00.md) para ver las decisiones y verificaciones de esta entrega.
