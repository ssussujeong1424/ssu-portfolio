$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$img = Join-Path $root 'img'
New-Item -ItemType Directory -Force -Path $img | Out-Null

$posters = @{
  'poster-chanel.png' = 'https://www.figma.com/api/mcp/asset/be9ebacd-8078-46a2-a25e-3276eda63b41.png'
  'poster-chair.png'  = 'https://www.figma.com/api/mcp/asset/6f805228-4d03-488f-847f-4309668c9d81.png'
  'poster-light.png'  = 'https://www.figma.com/api/mcp/asset/482886fd-1709-4675-a9b3-07caabd6bf0d.png'
  'poster-aircon.png' = 'https://www.figma.com/api/mcp/asset/ea06f269-20f5-4609-91e4-04d20fa971e1.png'
}

Write-Host 'Poster assets download start...' -ForegroundColor Cyan
foreach ($name in $posters.Keys) {
  $target = Join-Path $img $name
  Write-Host "Downloading $name"
  Invoke-WebRequest -Uri $posters[$name] -OutFile $target -UseBasicParsing
}

Write-Host 'Done. Poster images are ready.' -ForegroundColor Green
