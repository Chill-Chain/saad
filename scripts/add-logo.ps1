<#
  إضافة اللوقو على أي فيديو (مثلاً فيديو مصدّر من برنامج ثاني)
  .\scripts\add-logo.ps1 "raw footage\clip.mp4"
  المكان والحجم والشفافية من brand\brand.json
#>
param([Parameter(Mandatory)][string]$In, [string]$Out)
. "$PSScriptRoot\_common.ps1"
$Out = Resolve-Out $In $Out 'branded' '.mp4'
Invoke-Ff -i $In -c copy $Out
Add-Logo $Out
Write-Host "Done -> $Out"
