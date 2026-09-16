# Configuración segura de Gemini

La aplicación nunca guarda ni envía `GEMINI_API_KEY` al navegador, al HTML local, al EXE, a IndexedDB o a GitHub. La clave existe únicamente como variable privada del backend desplegado en Vercel.

## 1. Preparar Gemini

1. Crear una clave en Google AI Studio.
2. No copiarla en archivos del repositorio ni en la pantalla de Configuración de la aplicación.
3. Usar inicialmente el modelo estable `gemini-2.5-flash` o reemplazarlo mediante `GEMINI_MODEL`.

Documentación oficial: <https://ai.google.dev/gemini-api/docs/api-key>

## 2. Desplegar el backend en Vercel

1. Importar en Vercel el repositorio `PC1_SISTEMAS-ANALITICOS_MEDINA-LUJAN`.
2. Mantener la raíz del proyecto en la raíz del repositorio. `vercel.json` ejecutará el build y publicará `frontend/dist`.
3. Crear estas variables de entorno en Vercel:

   - `GEMINI_API_KEY`: clave privada.
   - `GEMINI_MODEL`: `gemini-2.5-flash`.
   - `AI_ALLOWED_ORIGINS`: orígenes web permitidos separados por comas.
   - `AI_ALLOW_LOCAL_APP`: `true` únicamente para permitir el HTML/EXE local durante la demostración.

4. Desplegar y copiar solamente la URL pública, por ejemplo `https://mi-proyecto.vercel.app`.

Documentación oficial: <https://vercel.com/docs/environment-variables>

## 3. Conectar la aplicación

1. Las entregas oficiales incluyen por defecto `https://pc1-medina-lujan.vercel.app` como URL del backend.
2. Si se usa otro despliegue, abrir `Configuración` y pegar su URL pública en `URL del backend`.
3. Pulsar `Guardar URL`.
4. Entrar en `IA` y pulsar el botón de verificación.
5. El estado esperado es `IA: Conectada`.

La URL del backend no es un secreto y se guarda localmente. La aplicación enviará a Gemini, mediante el backend, únicamente la organización y el plan elegidos para cada análisis.

## Seguridad y alcance académico

- El endpoint valida método, origen, tamaño, relación organización-plan y formato de respuesta.
- No registra claves ni imprime el contenido estratégico en logs.
- `AI_ALLOW_LOCAL_APP=true` acepta el origen local `null`, necesario para una distribución abierta mediante `file://`; debe usarse solo para la demostración controlada.
- Antes de una publicación abierta deben añadirse autenticación y límites de consumo en Vercel. No forman parte de esta fase porque el proyecto todavía no incorpora cuentas de usuario.
- Si Gemini o Internet fallan, la aplicación mantiene organizaciones, planes y demás funciones locales.
