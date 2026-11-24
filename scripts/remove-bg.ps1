<#
  إزالة الخلفية
  صورة:  .\scripts\remove-bg.ps1 "Refrences\person.jpg"   -> PNG شفاف (rembg)
  فيديو: .\scripts\remove-bg.ps1 "raw footage\talk.mp4"   -> WebM شفاف (HyperFrames)
#>
param([Parameter(Mandatory)][string]$In, [string]$Out, [string]$Model = "u2net")
. "$PSScriptRoot\_common.ps1"
$item = Get-Item -LiteralPath $In
if ($item.Extension -match '^\.(jpg|jpeg|png|webp)$') {
  $Out = Resolve-Out $In $Out 'nobg' '.png'
  & python -I "$PSScriptRoot\py\remove_bg.py" $item.FullName $Out $Model   # Model: u2net | isnet-general-use | u2net_human_seg
} else {
  $Out = Resolve-Out $In $Out 'nobg' '.webm'
  & npx --yes hyperframes@0.9.80 remove-background $item.FullName -o $Out
}
if ($LASTEXITCODE) { throw "remove-bg failed" }
Write-Host "Done -> $Out"
