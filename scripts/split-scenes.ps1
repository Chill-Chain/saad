<#
  كشف تغيّر المشاهد وتقسيم الفيديو لمقاطع (PySceneDetect)
  .\scripts\split-scenes.ps1 "raw footage\long.mp4"
  -Threshold 27 (أقل = حساسية أعلى)   -ListOnly  يطبع أوقات المشاهد بدون تقسيم
#>
param([Parameter(Mandatory)][string]$In, [int]$Threshold = 27, [switch]$ListOnly)
. "$PSScriptRoot\_common.ps1"
$item = Get-Item -LiteralPath $In
$dest = Join-Path $Root ("raw footage\" + $item.BaseName + "_scenes")
New-Item -ItemType Directory -Force $dest | Out-Null
if ($ListOnly) {
  & scenedetect -i $item.FullName -o $dest detect-adaptive list-scenes
} else {
  & scenedetect -i $item.FullName -o $dest detect-adaptive split-video
}
if ($LASTEXITCODE) { throw "scenedetect failed" }
Write-Host "Done -> $dest"
