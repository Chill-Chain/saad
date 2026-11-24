<#
  تجميل شامل بأمر واحد: تنعيم تشويش الصورة + تلوين + حدّة + تنظيف الصوت وتوحيده
  .\scripts\polish.ps1 "raw footage\clip.mp4" -Preset cinematic
  -Vertical   يحوّله كمان لـ 9:16
  -Subtitles  يضيف ترجمة محروقة (عربي)
#>
param(
  [Parameter(Mandatory)][string]$In, [string]$Out,
  [ValidateSet('cinematic','warm','cool','vivid','moody','bw','clean')][string]$Preset = 'cinematic',
  [switch]$Vertical, [switch]$Subtitles, [switch]$NoLogo
)
. "$PSScriptRoot\_common.ps1"
$Out = Resolve-Out $In $Out 'polished' '.mp4'
$tmp = Join-Path $env:TEMP "hi_polish_$PID"
New-Item -ItemType Directory -Force $tmp | Out-Null
$env:HI_NO_LOGO = '1'   # inner steps skip the logo; it's stamped once at the end
try {
  $step = "$tmp\1.mp4"
  & "$PSScriptRoot\color-grade.ps1" -In $In -Out $step -Preset $Preset -Sharpen
  $denoised = "$tmp\2.mp4"
  Invoke-Ff -i $step -vf "hqdn3d=1.5:1.5:6:6" -c:v libx264 -crf 18 -preset medium -c:a copy $denoised
  $step = "$tmp\3.mp4"
  & "$PSScriptRoot\clean-audio.ps1" -In $denoised -Out $step
  if ($Vertical)  { $v = "$tmp\4.mp4"; & "$PSScriptRoot\vertical.ps1" -In $step -Out $v; $step = $v }
  if ($Subtitles) { $s = "$tmp\5.mp4"; & "$PSScriptRoot\subtitles.ps1" -In $step -Burn -Out $s -Position $(if ($Vertical) { 'middle' } else { 'bottom' }); $step = $s }
  Move-Item $step $Out -Force
} finally { Remove-Item $tmp -Recurse -Force; Remove-Item Env:\HI_NO_LOGO -ErrorAction SilentlyContinue }
if (-not $NoLogo) { Add-Logo $Out }
Write-Host "Done -> $Out"
