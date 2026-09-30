$ErrorActionPreference = "Stop"
$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$img = Join-Path $base "img"
New-Item -ItemType Directory -Force -Path $img | Out-Null

$assets = @(
  @{ Name="popup-1.png"; Url="https://www.figma.com/api/mcp/asset/4d8bf92e-cc16-4892-ac73-a6b9d47ff322.png" },
  @{ Name="popup-2.png"; Url="https://www.figma.com/api/mcp/asset/1681f739-a101-4e6f-93bb-6a41e0ebb21e.png" },
  @{ Name="popup-3.png"; Url="https://www.figma.com/api/mcp/asset/74b3e254-a877-489e-a22a-dda7ebf433a9.png" },
  @{ Name="popup-4.png"; Url="https://www.figma.com/api/mcp/asset/57375f8a-5889-42aa-982f-bf02a64f6486.png" },
  @{ Name="popup-5.png"; Url="https://www.figma.com/api/mcp/asset/f4d5cbe6-70c3-4982-96a9-9846b12b2b84.png" },
  @{ Name="popup-6.png"; Url="https://www.figma.com/api/mcp/asset/bfc68a62-83f4-4944-97b7-1208380f52b0.png" }
)

foreach ($asset in $assets) {
  $out = Join-Path $img $asset.Name
  Write-Host "Downloading $($asset.Name)..."
  Invoke-WebRequest -Uri $asset.Url -OutFile $out -UseBasicParsing
  if ((Get-Item $out).Length -lt 1000) { throw "Download failed: $($asset.Name)" }
}
Write-Host "Popup assets ready." -ForegroundColor Green
