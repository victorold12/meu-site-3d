param([int]$Port = 3077)
$ErrorActionPreference = 'Stop'
$studyRoot = Split-Path $PSScriptRoot -Parent
if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
    throw "Porta $Port já está em uso. Nenhum processo foi encerrado."
}
$node = (Get-Command node.exe).Source
$next = Join-Path $studyRoot 'node_modules\next\dist\bin\next'
Start-Process -FilePath $node -ArgumentList @('"' + $next + '"', 'start', '--hostname', '127.0.0.1', '--port', $Port) -WorkingDirectory $studyRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $studyRoot 'reference\server.log') -RedirectStandardError (Join-Path $studyRoot 'reference\server-error.log') -PassThru | Select-Object Id
