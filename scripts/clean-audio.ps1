<#
  تنظيف الصوت: إزالة الضجيج + إزالة الهمهمة المنخفضة + توحيد مستوى الصوت
  .\scripts\clean-audio.ps1 "raw footage\clip.mp4"
  -Loudness -14 (يوتيوب/إنستقرام) أو -16 (بودكاست)
  -Strong     إزالة ضجيج أقوى (نموذج noisereduce بالذكاء الاصطناعي)
#>
param([Parameter(Mandatory)][string]$In, [string]$Out, [int]$Loudness = -14, [switch]$Strong, [switch]$NoLogo)
. "$PSScriptRoot\_common.ps1"
$Out = Resolve-Out $In $Out 'clean'
$filters = "highpass=f=80,lowpass=f=14000,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=$($Loudness):TP=-1.5:LRA=11"

if ($Strong) {
  $tmp = Join-Path $env:TEMP "hi_audio_$PID"
  New-Item -ItemType Directory -Force $tmp | Out-Null
  Invoke-Ff -i $In -vn -ac 1 -ar 48000 "$tmp\a.wav"
  & python -I -c "import sys,soundfile as sf,noisereduce as nr; d,r=sf.read(sys.argv[1]); sf.write(sys.argv[2], nr.reduce_noise(y=d, sr=r, prop_decrease=0.85), r)" "$tmp\a.wav" "$tmp\b.wav"
  Invoke-Ff -i $In -i "$tmp\b.wav" -map 0:v? -map 1:a -c:v copy -af $filters -c:a aac -b:a 192k $Out
  Remove-Item $tmp -Recurse -Force
} else {
  Invoke-Ff -i $In -c:v copy -af $filters -c:a aac -b:a 192k $Out
}
if (-not $NoLogo) { Add-Logo $Out }
Write-Host "Done -> $Out"
