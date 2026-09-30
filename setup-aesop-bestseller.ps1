$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$img = Join-Path $root 'img'
New-Item -ItemType Directory -Force -Path $img | Out-Null
$assets = @{
  'aesop-best-pc.png'='https://www.figma.com/api/mcp/asset/576fc73d-dca9-474d-aa8f-515ad6d65ef8.png'
  'aesop-horizontal.png'='https://www.figma.com/api/mcp/asset/0b6b83db-2fb2-4988-95c8-1fc20f4d203d.png'
}
foreach($name in $assets.Keys){
  Write-Host "Downloading $name from Figma..." -ForegroundColor Cyan
  Invoke-WebRequest -Uri $assets[$name] -OutFile (Join-Path $img $name) -UseBasicParsing
}
Write-Host 'AESOP Best Seller assets refreshed.' -ForegroundColor Green
