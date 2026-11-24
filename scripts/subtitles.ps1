<#
  ترجمة تلقائية (تفريغ الكلام) عبر whisper.cpp — أسرع من Whisper العادي على المعالج
  .\scripts\subtitles.ps1 "raw footage\clip.mp4"            -> ملف SRT فقط
  .\scripts\subtitles.ps1 "raw footage\clip.mp4" -Burn      -> يحرق الترجمة على الفيديو
  -Lang ar|en|auto   -Model large-v3-turbo (أدق) | base (أسرع)
  -FontSize 22  -Font "Segoe UI"  -Position bottom|middle
#>
param(
  [Parameter(Mandatory)][string]$In, [string]$Lang = 'ar', [string]$Model = 'large-v3-turbo',
  [switch]$Burn, [string]$Out, [int]$FontSize = 22, [string]$Font = 'Segoe UI',
  [ValidateSet('bottom','middle')][string]$Position = 'bottom', [switch]$NoLogo
)
. "$PSScriptRoot\_common.ps1"
$item = Get-Item -LiteralPath $In
$modelFile = Join-Path $Tools "whisper-cpp\ggml-$Model.bin"
if (-not (Test-Path $modelFile)) { throw "Model not found: $modelFile" }

$tmp = Join-Path $env:TEMP "hi_subs_$PID"
New-Item -ItemType Directory -Force $tmp | Out-Null
Invoke-Ff -i $item.FullName -vn -ac 1 -ar 16000 -c:a pcm_s16le "$tmp\a.wav"
# whisper.cpp can't open non-ASCII paths: hard-link (or copy) the model into the ASCII temp folder
try { New-Item -ItemType HardLink -Path "$tmp\m.bin" -Target $modelFile -ErrorAction Stop | Out-Null } catch { Copy-Item $modelFile "$tmp\m.bin" }
Push-Location $tmp
$ErrorActionPreference = 'Continue'
try { & whisper-cli -m m.bin -l $Lang -f a.wav -osrt -of subs -ml 42 -sow -t ([Environment]::ProcessorCount) -np 2>$null }
finally { Pop-Location; $ErrorActionPreference = 'Stop' }
if (-not (Test-Path "$tmp\subs.srt")) { throw "whisper-cli failed" }

$srt = Join-Path $item.DirectoryName ($item.BaseName + '.srt')
Copy-Item "$tmp\subs.srt" $srt -Force
Write-Host "Subtitles -> $srt"

if ($Burn) {
  $Out = Resolve-Out $In $Out 'subtitled' '.mp4'
  $align = if ($Position -eq 'middle') { 10 } else { 2 }
  $style = "FontName=$Font,FontSize=$FontSize,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,Alignment=$align,MarginV=40"
  Push-Location $tmp   # relative path avoids Windows drive-colon escaping in the filter
  try { Invoke-Ff -i $item.FullName -vf "subtitles=subs.srt:force_style='$style'" -c:v libx264 -crf 18 -preset medium -c:a copy $Out }
  finally { Pop-Location }
  if (-not $NoLogo) { Add-Logo $Out }
  Write-Host "Done -> $Out"
}
Remove-Item $tmp -Recurse -Force
