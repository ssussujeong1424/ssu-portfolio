$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$img = Join-Path $root 'img'
New-Item -ItemType Directory -Force -Path $img | Out-Null

$assets = @{
  'work-banner-2.png'='https://www.figma.com/api/mcp/asset/e13eb930-e7c0-4cbd-91a9-c936b1592bfe/83f0a.png'
  'work-banner-3.png'='https://www.figma.com/api/mcp/asset/30708c26-cff0-4ebd-b93c-1a0a8c98c06f/aa524.png'
  'work-banner-4.png'='https://www.figma.com/api/mcp/asset/130b334b-0690-496a-bcdf-bcd74387fc34/8baea.png'
}

Write-Host "Banner assets download start..." -ForegroundColor Cyan
foreach($name in $assets.Keys){
  $target = Join-Path $img $name
  Write-Host "Downloading $name"
  Invoke-WebRequest -Uri $assets[$name] -OutFile $target -UseBasicParsing
}
Write-Host "Done. Refresh Live Server." -ForegroundColor Green
