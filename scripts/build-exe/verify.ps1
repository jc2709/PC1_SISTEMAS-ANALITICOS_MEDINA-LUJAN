$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$sourceExecutablePath = Join-Path $repositoryRoot 'release\exe\GestionControlEstrategicoIA.exe'
$isolatedDirectory = Join-Path $repositoryRoot 'release\single-file-smoke'
$executablePath = Join-Path $isolatedDirectory 'GestionControlEstrategicoIA.exe'
$resultPath = Join-Path $repositoryRoot 'release\exe\smoke-portable-result.json'

if (-not (Test-Path -LiteralPath $sourceExecutablePath)) {
    throw 'No existe el EXE portátil. Ejecute primero npm run build:exe.'
}

New-Item -ItemType Directory -Force -Path $isolatedDirectory | Out-Null
if (Test-Path -LiteralPath $executablePath) {
    Remove-Item -LiteralPath $executablePath -Force
}
if (Test-Path -LiteralPath $resultPath) {
    Remove-Item -LiteralPath $resultPath -Force
}
Copy-Item -LiteralPath $sourceExecutablePath -Destination $executablePath

$unexpectedFiles = Get-ChildItem -LiteralPath $isolatedDirectory -Force |
    Where-Object { $_.Name -ne 'GestionControlEstrategicoIA.exe' }
if ($unexpectedFiles) {
    throw "La carpeta de prueba aislada contiene archivos auxiliares: $($unexpectedFiles.Name -join ', ')"
}

$process = Start-Process -FilePath $executablePath -ArgumentList "--smoke-test=$resultPath" -PassThru
$deadline = (Get-Date).AddSeconds(90)
while (-not (Test-Path -LiteralPath $resultPath) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 250
}

if (-not (Test-Path -LiteralPath $resultPath)) {
    if (-not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
    }
    throw 'El EXE no generó el resultado de la prueba.'
}

$result = Get-Content -Raw -LiteralPath $resultPath | ConvertFrom-Json
if (-not $result.ok) {
    throw "El smoke test del EXE falló: $(Get-Content -Raw -LiteralPath $resultPath)"
}

$remainingFiles = Get-ChildItem -LiteralPath $isolatedDirectory -Force
if ($remainingFiles.Count -ne 1 -or $remainingFiles[0].Name -ne 'GestionControlEstrategicoIA.exe') {
    throw 'El EXE portátil creó archivos auxiliares visibles junto a sí mismo.'
}

Write-Output (Get-Content -Raw -LiteralPath $resultPath)
