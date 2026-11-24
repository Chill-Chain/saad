<#
  تلوين سينمائي جاهز
  .\scripts\color-grade.ps1 "raw footage\clip.mp4" -Preset cinematic
  Presets: cinematic | warm | cool | vivid | moody | bw | clean
  -Lut "Refrences\my.cube"   استخدم ملف LUT خاص فيك بدل الإعداد الجاهز
  -Sharpen                   حدّة خفيفة   -Vignette   تعتيم الأطراف
#>
param(
  [Parameter(Mandatory)][string]$In, [string]$Out,
  [ValidateSet('cinematic','warm','cool','vivid','moody','bw','clean')][string]$Preset = 'cinematic',
  [string]$Lut, [switch]$Sharpen, [switch]$Vignette, [switch]$NoLogo
)
. "$PSScriptRoot\_common.ps1"
$presets = @{
  cinematic = "eq=contrast=1.08:saturation=0.92:gamma=0.97,colorbalance=rs=-0.04:bs=0.06:rh=0.06:bh=-0.04,curves=master='0/0.03 0.5/0.48 1/0.97'"
  warm      = "colortemperature=temperature=5200,eq=contrast=1.05:saturation=1.08"
  cool      = "colortemperature=temperature=7800,eq=contrast=1.06:saturation=0.95"
  vivid     = "eq=contrast=1.1:saturation=1.35:brightness=0.01,unsharp=5:5:0.5"
  moody     = "eq=contrast=1.15:saturation=0.75:brightness=-0.03,colorbalance=bs=0.08:bm=0.04,curves=master='0/0.05 0.6/0.55 1/0.92'"
  bw        = "hue=s=0,eq=contrast=1.2,curves=master='0/0 0.25/0.18 0.75/0.82 1/1'"
  clean     = "eq=contrast=1.04:saturation=1.05,unsharp=3:3:0.3"
}
$chain = @()
if ($Lut) {
  $lutTmp = Join-Path $env:TEMP "hi_lut_$PID.cube"; Copy-Item -LiteralPath $Lut $lutTmp
  Push-Location $env:TEMP; $chain += "lut3d=hi_lut_$PID.cube"
} else { $chain += $presets[$Preset] }
if ($Sharpen)  { $chain += 'unsharp=5:5:0.6' }
if ($Vignette) { $chain += 'vignette=PI/5' }
$Out = Resolve-Out $In $Out $(if ($Lut) { 'lut' } else { $Preset }) '.mp4'
try { Invoke-Ff -i (Resolve-Path -LiteralPath $In).Path -vf ($chain -join ',') -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a copy $Out }
finally { if ($Lut) { Pop-Location; Remove-Item $lutTmp } }
if (-not $NoLogo) { Add-Logo $Out }
Write-Host "Done -> $Out"
