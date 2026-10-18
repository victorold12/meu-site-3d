$ErrorActionPreference = 'Stop'
$studyRoot = Split-Path $PSScriptRoot -Parent
$upstreamRoot = Join-Path $studyRoot 'upstream'
$commit = '41046b57eeed8d156d9c3fd7fa259900baef7816'
if (-not (Test-Path -LiteralPath $upstreamRoot)) {
    git clone --filter=blob:none --no-checkout https://github.com/brunosimon/folio-2025.git $upstreamRoot
    if ($LASTEXITCODE -ne 0) { throw 'Falha no clone.' }
    git -C $upstreamRoot sparse-checkout init --cone
    git -C $upstreamRoot sparse-checkout set sources scripts static
    git -C $upstreamRoot checkout --detach $commit
    if ($LASTEXITCODE -ne 0) { throw 'Falha no checkout fixado.' }
}
$actualCommit = (git -C $upstreamRoot rev-parse HEAD).Trim()
if ($actualCommit -ne $commit) { throw "Upstream diferente: $actualCommit. Preservado sem reset." }
Push-Location $upstreamRoot
try {
    npm.cmd ci --ignore-scripts --legacy-peer-deps --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar runtime.' }
} finally { Pop-Location }
Push-Location $studyRoot
try {
    npm.cmd ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar host.' }
} finally { Pop-Location }
