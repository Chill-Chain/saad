# Shared setup: put the project's tools on PATH for this script run
$Root  = Split-Path $PSScriptRoot -Parent
$Tools = Join-Path $Root 'tools'
$env:PATH = @(
  (Join-Path $Root  '.venv\Scripts'),
  (Join-Path $Tools 'whisper-cpp\Release'),
  (Join-Path $Tools 'realesrgan'),
  (Join-Path $Tools 'rife'),
  $env:PATH
) -join ';'
$env:PYTHONUTF8 = '1'

# ffmpeg's subtitles/drawtext need a fontconfig file pointing at the Windows fonts
$fcDir = Join-Path $env:LOCALAPPDATA 'hi-video-fontconfig'
$fcFile = Join-Path $fcDir 'fonts.conf'
if (-not (Test-Path $fcFile)) {
  New-Item -ItemType Directory -Force $fcDir | Out-Null
  @"
<?xml version="1.0"?>
<fontconfig>
  <dir>C:/Windows/Fonts</dir>
  <dir>$($env:LOCALAPPDATA -replace '\\','/')/Microsoft/Windows/Fonts</dir>
  <cachedir>$($fcDir -replace '\\','/')/cache</cachedir>
</fontconfig>
"@ | Set-Content $fcFile -Encoding ascii
}
$env:FONTCONFIG_FILE = $fcFile
$ErrorActionPreference = 'Stop'

function Resolve-Out([string]$In, [string]$Out, [string]$Suffix, [string]$Ext = '') {
  if ($Out) { return $Out }
  $item = Get-Item -LiteralPath $In
  if (-not $Ext) { $Ext = $item.Extension }
  $dir = Join-Path $Root 'Final videos'
  return Join-Path $dir ($item.BaseName + "_$Suffix" + $Ext)
}

# Simple function (no param block) so ffmpeg flags like -i aren't parsed as PowerShell parameters
# PowerShell splits "-c:v" into "-c:" + "v" when calling a function — rejoin them before handing to ffmpeg
function Invoke-Ff {
  $a = New-Object System.Collections.Generic.List[string]
  for ($i = 0; $i -lt $args.Count; $i++) {
    $t = [string]$args[$i]
    if ($t -match '^-[\w]+:$' -and $i + 1 -lt $args.Count) { $a.Add($t + [string]$args[$i + 1]); $i++ } else { $a.Add($t) }
  }
  & ffmpeg -hide_banner -loglevel error -y $a
  if ($LASTEXITCODE) { throw "ffmpeg failed" }
}

# ── Brand logo: stamped on every finished video (settings in brand\brand.json) ──
# Skip with -NoLogo on a script, or $env:HI_NO_LOGO=1 (used by polish.ps1 for its inner steps)
function Add-Logo([string]$File) {
  if ($env:HI_NO_LOGO -eq '1') { return }
  $cfg = Get-Content (Join-Path $Root 'brand\brand.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  $logo = Join-Path $Root "brand\$($cfg.logo)"
  if (-not (Test-Path $logo)) { Write-Warning "Logo not found: $logo"; return }
  $vw = & ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 $File
  if (-not $vw) { return }
  $lw = [int]([int]$vw * $cfg.widthPercent / 100 / 2) * 2
  $m = "main_w*$($cfg.marginPercent)/100"
  $xy = switch ($cfg.position) {
    'top-left'     { "x=$($m):y=$m" }
    'bottom-left'  { "x=$($m):y=main_h-overlay_h-$m" }
    'bottom-right' { "x=main_w-overlay_w-$($m):y=main_h-overlay_h-$m" }
    default        { "x=main_w-overlay_w-$($m):y=$m" }
  }
  $fc = "[1]scale=$($lw):-1,format=rgba,colorchannelmixer=aa=$($cfg.opacity)[l];[0][l]overlay=$($xy):shortest=1:format=auto,format=yuv420p"
  $tmp = [IO.Path]::Combine([IO.Path]::GetDirectoryName($File), [IO.Path]::GetFileNameWithoutExtension($File) + '.logo' + [IO.Path]::GetExtension($File))
  Invoke-Ff -i $File -loop 1 -i $logo -filter_complex $fc -map 0:a? -shortest -c:v libx264 -crf 18 -preset medium -c:a copy $tmp
  Move-Item $tmp $File -Force
}

function Get-Fps([string]$In) {
  $r = & ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 $In
  return $r.Trim()
}
