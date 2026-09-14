$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$executablePath = Join-Path $repositoryRoot 'release\exe\win-unpacked\GestionControlEstrategicoIA.exe'
$resultPath = Join-Path $repositoryRoot 'release\exe\smoke-result.json'

if (-not (Test-Path -LiteralPath $executablePath)) {
    throw 'No existe el EXE. Ejecute primero npm run build:exe.'
}

if (Test-Path -LiteralPath $resultPath) {
    Remove-Item -LiteralPath $resultPath -Force
}

$process = Start-Process -FilePath $executablePath -ArgumentList "--smoke-test=$resultPath" -PassThru
if (-not $process.WaitForExit(30000)) {
    Stop-Process -Id $process.Id -Force
    throw 'El EXE no terminó su prueba en 30 segundos.'
}

if (-not (Test-Path -LiteralPath $resultPath)) {
    throw 'El EXE no generó el resultado de la prueba.'
}

$result = Get-Content -Raw -LiteralPath $resultPath | ConvertFrom-Json
if (-not $result.ok) {
    throw "El smoke test del EXE falló: $(Get-Content -Raw -LiteralPath $resultPath)"
}

Write-Output (Get-Content -Raw -LiteralPath $resultPath)
