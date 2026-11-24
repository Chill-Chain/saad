<#
  تثبيت الفيديو المهزوز (تصوير باليد)
  .\scripts\stabilize.ps1 "raw footage\clip.mp4" -Smoothing 15
#>
param([Parameter(Mandatory)][string]$In, [string]$Out, [int]$Smoothing = 15, [int]$Shakiness = 6, [switch]$NoLogo)
. "$PSScriptRoot\_common.ps1"
$Out = Resolve-Out $In $Out 'stable' '.mp4'
$full = (Resolve-Path -LiteralPath $In).Path
Push-Location $env:TEMP
try {
  Invoke-Ff -i $full -vf "vidstabdetect=shakiness=$($Shakiness):accuracy=15:result=hi_vs_$PID.trf" -f null -
  Invoke-Ff -i $full -vf "vidstabtransform=input=hi_vs_$PID.trf:smoothing=$($Smoothing):zoom=0:optzoom=1,unsharp=5:5:0.8:3:3:0.4" -c:v libx264 -crf 18 -preset medium -c:a copy $Out
} finally { Remove-Item "hi_vs_$PID.trf" -ErrorAction SilentlyContinue; Pop-Location }
if (-not $NoLogo) { Add-Logo $Out }
Write-Host "Done -> $Out"
