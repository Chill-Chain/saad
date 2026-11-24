<#
  حركة ناعمة / سلو موشن بالذكاء الاصطناعي (RIFE) — يضاعف عدد الإطارات
  .\scripts\smooth-motion.ps1 "raw footage\clip.mp4"          -> 30fps يصير 60fps
  .\scripts\smooth-motion.ps1 "raw footage\clip.mp4" -Slowmo  -> نفس الإطارات لكن أبطأ مرتين (سلو موشن)
#>
param([Parameter(Mandatory)][string]$In, [string]$Out, [switch]$Slowmo, [switch]$NoLogo)
. "$PSScriptRoot\_common.ps1"
$exe = Join-Path $Tools 'rife\rife-ncnn-vulkan.exe'
$item = Get-Item -LiteralPath $In
$Out = Resolve-Out $In $Out $(if ($Slowmo) { 'slowmo' } else { 'smooth' }) '.mp4'
$fps = Get-Fps $item.FullName
$num, $den = $fps -split '/'; if (-not $den) { $den = 1 }
$outFps = if ($Slowmo) { $fps } else { "$([int]$num * 2)/$den" }
$tmp = Join-Path $env:TEMP "hi_rife_$PID"
New-Item -ItemType Directory -Force "$tmp\in","$tmp\out" | Out-Null
try {
  Invoke-Ff -i $item.FullName -fps_mode passthrough "$tmp\in\%08d.png"
  & $exe -i "$tmp\in" -o "$tmp\out" -m (Join-Path $Tools 'rife\rife-v4.6')
  if ($LASTEXITCODE) { throw "rife failed" }
  if ($Slowmo) {
    Invoke-Ff -framerate $outFps -i "$tmp\out\%08d.png" -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p $Out
  } else {
    Invoke-Ff -framerate $outFps -i "$tmp\out\%08d.png" -i $item.FullName -map 0:v -map 1:a? -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -c:a copy -shortest $Out
  }
} finally { Remove-Item $tmp -Recurse -Force }
if (-not $NoLogo) { Add-Logo $Out }
Write-Host "Done -> $Out"
