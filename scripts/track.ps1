<#
  تتبع حركة (Motion Tracking) لعنصر داخل لقطة — عشان التعليقات التوضيحية تلحقه
  .\scripts\track.ps1 "remotion-studio\public\projects\x\clip.mp4" -Box "0.42,0.30,0.12,0.10"
  -Box = x,y,عرض,ارتفاع للعنصر كنسبة من الإطار (عند الثانية -At)
  الناتج: clip.track.json بجانب اللقطة — استخدمه في callouts: { track: "projects/x/clip.track.json", label: "..." }
#>
param([Parameter(Mandatory)][string]$In, [Parameter(Mandatory)][string]$Box, [double]$At = 0, [string]$Out)
. "$PSScriptRoot\_common.ps1"
$item = Get-Item -LiteralPath $In
if (-not $Out) { $Out = Join-Path $item.DirectoryName ($item.BaseName + '.track.json') }
# OpenCV can't open non-ASCII paths on Windows: work on a temp copy
$tmp = Join-Path $env:TEMP "hi_track_$PID$($item.Extension)"
Copy-Item -LiteralPath $item.FullName $tmp
try {
  & python -I "$PSScriptRoot\py\track.py" $tmp "$env:TEMP\hi_track_$PID.json" --box $Box --at $At
  if ($LASTEXITCODE) { throw "tracking failed" }
  Move-Item "$env:TEMP\hi_track_$PID.json" $Out -Force
} finally { Remove-Item $tmp -ErrorAction SilentlyContinue }
Write-Host "Done -> $Out"
