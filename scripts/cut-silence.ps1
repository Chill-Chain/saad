<#
  قص الصمت والسكتات تلقائياً (auto-editor)
  .\scripts\cut-silence.ps1 "raw footage\talk.mp4"
  -Margin 0.2   الهامش قبل وبعد الكلام بالثواني
  -Threshold 4% حساسية الصمت
  -Premiere     يطلع ملف XML تفتحه في Premiere/DaVinci بدل فيديو
#>
param([Parameter(Mandatory)][string]$In, [string]$Out, [string]$Margin = '0.2', [string]$Threshold = '4%', [switch]$Premiere, [switch]$NoLogo)
. "$PSScriptRoot\_common.ps1"
$Out = Resolve-Out $In $Out 'tight' $(if ($Premiere) { '.xml' } else { '.mp4' })
$args2 = @($In, '--edit', "audio:threshold=$Threshold", '--margin', "$($Margin)sec", '-o', $Out, '--no-open')
if ($Premiere) { $args2 += @('--export', 'premiere') }
& auto-editor @args2
if ($LASTEXITCODE) { throw "auto-editor failed" }
if (-not $NoLogo -and -not $Premiere) { Add-Logo $Out }
Write-Host "Done -> $Out"
