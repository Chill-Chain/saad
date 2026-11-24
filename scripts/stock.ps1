<#
  لقطات سينمائية حقيقية (أشخاص، حياة يومية) من Pexels — مجانية للاستخدام التجاري
  مفتاح مجاني مرة وحدة من pexels.com/api ثم:
    [Environment]::SetEnvironmentVariable('PEXELS_API_KEY','...','User')
  .\scripts\stock.ps1 fatigue-ad "tired woman morning bed" -Orientation portrait -Count 3
  الناتج: projects\<name>\media\<query>-<n>.mp4 + credits.txt (للتوثيق)
#>
param(
  [Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][string]$Query,
  [ValidateSet('portrait','landscape','square')][string]$Orientation = 'portrait', [int]$Count = 3, [int]$MaxHeight = 2160
)
. "$PSScriptRoot\_common.ps1"
$key = $env:PEXELS_API_KEY
if (-not $key) { $key = [Environment]::GetEnvironmentVariable('PEXELS_API_KEY', 'User') }
if (-not $key) { throw "PEXELS_API_KEY is not set (free key: https://www.pexels.com/api/)" }
$media = Join-Path $Root "projects\$Name\media"
New-Item -ItemType Directory -Force $media | Out-Null
$q = [uri]::EscapeDataString($Query)
$res = Invoke-RestMethod -Headers @{ Authorization = $key } -Uri "https://api.pexels.com/videos/search?query=$q&orientation=$Orientation&per_page=$Count&size=large"
$slug = ($Query -replace '[^a-zA-Z0-9]+', '-').Trim('-').ToLower()
$n = 0
foreach ($v in $res.videos) {
  $n++
  $file = $v.video_files | Where-Object { $_.file_type -eq 'video/mp4' -and $_.height -le $MaxHeight -and $_.width -le $MaxHeight } | Sort-Object { $_.width * $_.height } -Descending | Select-Object -First 1
  if (-not $file) { continue }
  $out = Join-Path $media "$slug-$n.mp4"
  Invoke-WebRequest -Uri $file.link -OutFile $out -UseBasicParsing
  Add-Content (Join-Path $media 'credits.txt') "$slug-$n.mp4 | Pexels video $($v.id) by $($v.user.name) | $($v.url)" -Encoding UTF8
  Write-Host "  $slug-$n.mp4  $($file.width)x$($file.height)  $($v.duration)s"
}
Write-Host "Done -> $media"
