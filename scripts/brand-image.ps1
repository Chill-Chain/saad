<#
  إضافة شعار الأثر الخفي على صورة أو تصميم (PNG/JPG/WebP)
  .\scripts\brand-image.ps1 "Final videos\post.png"            -> post_branded.png
  .\scripts\brand-image.ps1 "x.jpg" -Position bottom-left -Width 14
  الافتراضي من brand\brand.json. الشعار يوضع داخل دائرة بيضاء (خلفيته الأصلية) ولا يُعدّل.
#>
param([Parameter(Mandatory)][string]$In, [string]$Out, [string]$Position, [double]$Width = 0)
. "$PSScriptRoot\_common.ps1"
$cfg = Get-Content (Join-Path $Root 'brand\brand.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $Position) { $Position = $cfg.position }
if ($Width -le 0) { $Width = $cfg.widthPercent }
$item = Get-Item -LiteralPath $In
$Out = Resolve-Out $In $Out 'branded' $item.Extension
$iw = [int](& ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 $item.FullName)
$lw = [int]($iw * $Width / 100 / 2) * 2
$m = "main_w*$($cfg.marginPercent)/100"
$xy = switch ($Position) {
  'top-left'     { "x=$($m):y=$m" }
  'bottom-left'  { "x=$($m):y=main_h-overlay_h-$m" }
  'bottom-right' { "x=main_w-overlay_w-$($m):y=main_h-overlay_h-$m" }
  default        { "x=main_w-overlay_w-$($m):y=$m" }
}
Invoke-Ff -i $item.FullName -i (Join-Path $Root "brand\$($cfg.logo)") -filter_complex "[1]scale=$($lw):-1[l];[0][l]overlay=$($xy):format=auto" -frames:v 1 -update 1 $Out
Write-Host "Done -> $Out"
