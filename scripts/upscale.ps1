<#
  رفع الجودة بالذكاء الاصطناعي (Real-ESRGAN) — يشتغل على كرت AMD عبر Vulkan
  .\scripts\upscale.ps1 "raw footage\old.mp4"              -> x2
  .\scripts\upscale.ps1 "raw footage\photo.jpg" -Scale 4   -> يشتغل على الصور بعد
  -Model realesr-animevideov3 (فيديو، سريع) | realesrgan-x4plus (صور واقعية، أبطأ)
  تنبيه: الفيديو بطيء — جرّبه على مقطع قصير أول
#>
param([Parameter(Mandatory)][string]$In, [string]$Out, [ValidateSet(2,3,4)][int]$Scale = 2, [string]$Model = 'realesr-animevideov3', [switch]$NoLogo)
. "$PSScriptRoot\_common.ps1"
$exe = Join-Path $Tools 'realesrgan\realesrgan-ncnn-vulkan.exe'
$modelDir = Join-Path $Tools 'realesrgan\models'
$item = Get-Item -LiteralPath $In

if ($item.Extension -match '^\.(jpg|jpeg|png|webp)$') {
  $Out = Resolve-Out $In $Out "x$Scale" '.png'
  if ($Model -eq 'realesr-animevideov3') { $Model = 'realesrgan-x4plus'; $Scale = 4 }
  & $exe -i $item.FullName -o $Out -n $Model -s $Scale -m $modelDir
  Write-Host "Done -> $Out"; return
}

$Out = Resolve-Out $In $Out "x$Scale" '.mp4'
$fps = Get-Fps $item.FullName
$tmp = Join-Path $env:TEMP "hi_up_$PID"
New-Item -ItemType Directory -Force "$tmp\in","$tmp\out" | Out-Null
try {
  Invoke-Ff -i $item.FullName -qscale:v 1 -qmin 1 -fps_mode passthrough "$tmp\in\%08d.jpg"
  & $exe -i "$tmp\in" -o "$tmp\out" -n "$Model-x$Scale" -s $Scale -m $modelDir -f png
  if ($LASTEXITCODE) { throw "realesrgan failed" }
  Invoke-Ff -framerate $fps -i "$tmp\out\%08d.png" -i $item.FullName -map 0:v -map 1:a? -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p -c:a copy -shortest $Out
} finally { Remove-Item $tmp -Recurse -Force }
if (-not $NoLogo) { Add-Logo $Out }
Write-Host "Done -> $Out"
