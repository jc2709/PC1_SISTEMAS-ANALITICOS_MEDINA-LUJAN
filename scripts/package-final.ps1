$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$releaseRoot = Join-Path $repositoryRoot 'release'
$finalDirectory = Join-Path $releaseRoot 'final'
$sourceExecutable = Join-Path $releaseRoot 'exe\GestionControlEstrategicoIA.exe'
$sourceHtml = Join-Path $repositoryRoot 'frontend\dist\index.html'
$finalExecutable = Join-Path $finalDirectory 'GestionControlEstrategicoIA.exe'
$finalHtml = Join-Path $finalDirectory 'GestionControlEstrategicoIA.html'
$zipPath = Join-Path $releaseRoot 'GestionControlEstrategicoIA-entrega.zip'
$manifestPath = Join-Path $releaseRoot 'manifest-entrega-final.json'

function Invoke-NpmTask([string[]]$TaskArguments) {
    & npm @TaskArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Falló npm $($TaskArguments -join ' ') con código $LASTEXITCODE."
    }
}

Push-Location $repositoryRoot
try {
    Invoke-NpmTask @('run', 'lint')
    Invoke-NpmTask @('test')
    Invoke-NpmTask @('run', 'build:exe')
    Invoke-NpmTask @('run', 'build:exe:unpacked')
    Invoke-NpmTask @('run', 'verify:exe')
} finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $sourceExecutable)) {
    throw "No se generó el EXE portátil esperado: $sourceExecutable"
}
if (-not (Test-Path -LiteralPath $sourceHtml)) {
    throw "No se generó el HTML autocontenido esperado: $sourceHtml"
}

New-Item -ItemType Directory -Force -Path $finalDirectory | Out-Null
foreach ($path in @($finalExecutable, $finalHtml, $zipPath, $manifestPath)) {
    if (Test-Path -LiteralPath $path) {
        Remove-Item -LiteralPath $path -Force
    }
}

Copy-Item -LiteralPath $sourceExecutable -Destination $finalExecutable
Copy-Item -LiteralPath $sourceHtml -Destination $finalHtml

$deliveredFiles = Get-ChildItem -LiteralPath $finalDirectory -File
if ($deliveredFiles.Count -ne 2 -or @($deliveredFiles.Name | Sort-Object) -join '|' -ne 'GestionControlEstrategicoIA.exe|GestionControlEstrategicoIA.html') {
    throw 'La carpeta de entrega final debe contener únicamente el EXE y el HTML solicitados.'
}

Compress-Archive -LiteralPath @($finalExecutable, $finalHtml) -DestinationPath $zipPath -CompressionLevel Optimal
$manifest = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    portableExe = [ordered]@{ file = 'final/GestionControlEstrategicoIA.exe'; bytes = (Get-Item -LiteralPath $finalExecutable).Length; sha256 = (Get-FileHash -LiteralPath $finalExecutable -Algorithm SHA256).Hash }
    selfContainedHtml = [ordered]@{ file = 'final/GestionControlEstrategicoIA.html'; bytes = (Get-Item -LiteralPath $finalHtml).Length; sha256 = (Get-FileHash -LiteralPath $finalHtml -Algorithm SHA256).Hash }
    deliveryZip = [ordered]@{ file = 'GestionControlEstrategicoIA-entrega.zip'; bytes = (Get-Item -LiteralPath $zipPath).Length; sha256 = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash }
    validation = [ordered]@{ singleFileExeSmokeTest = 'passed'; htmlSelfContained = 'passed'; winUnpackedBackup = 'release/exe/win-unpacked' }
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding utf8

Write-Output "Entrega final lista: $finalDirectory"
Write-Output "ZIP de entrega: $zipPath"
Write-Output "Manifiesto SHA-256: $manifestPath"
