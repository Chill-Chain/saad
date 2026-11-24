<#
  تحويل فيديو عرضي إلى طولي 9:16 (ريلز / تيك توك / شورتس)
  .\scripts\vertical.ps1 "raw footage\clip.mp4"            -> خلفية مموهة + الفيديو كامل بالنص
  .\scripts\vertical.ps1 "raw footage\clip.mp4" -Crop      -> قص من المنتصف يملأ الشاشة
#>
param([Parameter(Mandatory)][string]$In, [string]$Out, [switch]$Crop, [switch]$NoLogo)
. "$PSScriptRoot\_common.ps1"
$Out = Resolve-Out $In $Out 'vertical' '.mp4'
$vf = if ($Crop) {
  "scale=-2:1920,crop=1080:1920,setsar=1"
} else {
  "split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.08[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1"
}
Invoke-Ff -i $In -filter_complex $vf -c:v libx264 -crf 19 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k $Out
if (-not $NoLogo) { Add-Logo $Out }
Write-Host "Done -> $Out"
