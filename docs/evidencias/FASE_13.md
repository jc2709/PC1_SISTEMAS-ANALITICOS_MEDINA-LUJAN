# Fase 13: documentación y empaquetado final

## Alcance

- Entrega Windows portable autocontenida con `electron-builder --win portable --x64`.
- HTML autocontenido validado para uso local.
- Respaldo técnico `win-unpacked` separado de la entrega principal.
- Smoke test que copia solo el EXE a otra carpeta y verifica IndexedDB, Inicio, Organizaciones, Planeamiento, Dashboard y Reportes.
- Manifiesto con SHA-256 para verificar los dos archivos finales.

## Comando de entrega

```bash
npm run package:final
```

El comando ejecuta calidad, pruebas, construcción del EXE portable, construcción de `win-unpacked`, smoke test aislado y genera:

```text
release/final/GestionControlEstrategicoIA.exe
release/final/GestionControlEstrategicoIA.html
release/GestionControlEstrategicoIA-entrega.zip
release/manifest-entrega-final.json
```

## Observaciones de seguridad

El ejecutable no está firmado con un certificado comercial. Una advertencia de reputación de Windows puede aparecer en equipos nuevos. La validación debe hacerse mediante el origen oficial y el SHA-256 del manifiesto. No se desactiva SmartScreen ni otra protección de Windows.
