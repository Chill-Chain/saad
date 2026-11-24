<#
  فصل الصوت البشري عن الموسيقى (Demucs) — لإزالة موسيقى الخلفية أو أخذ الموسيقى بدون صوت
  .\scripts\separate-voice.ps1 "raw footage\clip.mp4"
  يطلع: <اسم>_voice.wav و <اسم>_music.wav في Final videos
  -ReplaceAudio  يرجّع الفيديو بالصوت البشري فقط
#>
param([Parameter(Mandatory)][string]$In, [switch]$ReplaceAudio, [switch]$NoLogo)
. "$PSScriptRoot\_common.ps1"
$item = Get-Item -LiteralPath $In
$dest = Join-Path $Root 'Final videos'
$tmp = Join-Path $env:TEMP "hi_demucs_$PID"
New-Item -ItemType Directory -Force $tmp | Out-Null
try {
  Invoke-Ff -i $item.FullName -vn -ac 2 -ar 44100 "$tmp\a.wav"
  & python -m demucs --two-stems=vocals -n htdemucs -o $tmp "$tmp\a.wav"
  if ($LASTEXITCODE) { throw "demucs failed" }
  $voice = Join-Path $dest ($item.BaseName + '_voice.wav')
  $music = Join-Path $dest ($item.BaseName + '_music.wav')
  Copy-Item "$tmp\htdemucs\a\vocals.wav" $voice -Force
  Copy-Item "$tmp\htdemucs\a\no_vocals.wav" $music -Force
  Write-Host "Voice -> $voice`nMusic -> $music"
  if ($ReplaceAudio) {
    $Out = Resolve-Out $In '' 'voiceonly' '.mp4'
    Invoke-Ff -i $item.FullName -i $voice -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest $Out
    if (-not $NoLogo) { Add-Logo $Out }
    Write-Host "Done -> $Out"
  }
} finally { Remove-Item $tmp -Recurse -Force }
