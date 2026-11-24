<#
  تحليل فيديو مرجعي واستخراج أسلوبه
  .\scripts\analyze-reference.ps1 "Refrences\video.mp4"
  يطلع مجلد في Refrences\_analysis\<الاسم> فيه:
    report.md        تقرير: المقاس، المدة، إيقاع القص، مستوى الصوت، السكتات، الألوان السائدة
    sheet_*.jpg      صور مصغرة كل ثانية عليها الوقت (لمراجعة الأسلوب بصرياً)
    scenes.csv       أوقات كل مشهد
    transcript.srt   تفريغ الكلام (whisper.cpp)
    palette.png      الألوان السائدة
  -Lang ar|en   -Model large-v3-turbo|base   -NoTranscript
#>
param([Parameter(Mandatory)][string]$In, [string]$Lang = 'ar', [string]$Model = 'large-v3-turbo', [switch]$NoTranscript)
. "$PSScriptRoot\_common.ps1"
$item = Get-Item -LiteralPath $In
# ffmpeg/scenedetect write normal progress to stderr; in Windows PowerShell 5.1 'Stop' turns that into a crash
$ErrorActionPreference = 'Continue'
$name = ($item.BaseName -replace '[^\w\u0600-\u06FF-]', '_')
$out = Join-Path $Root "Refrences\_analysis\$name"
New-Item -ItemType Directory -Force $out | Out-Null

# Work in an ASCII-only temp folder: whisper.cpp and ffmpeg filters choke on Arabic paths
$tmp = Join-Path $env:TEMP "hi_ref_$PID"
New-Item -ItemType Directory -Force $tmp | Out-Null
Copy-Item -LiteralPath $item.FullName "$tmp\in$($item.Extension)"
$src = "$tmp\in$($item.Extension)"

try {
  Push-Location $tmp
  # 1) Basics
  $probe = & ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of json $src | ConvertFrom-Json
  $vs = $probe.streams | Where-Object codec_type -eq 'video' | Select-Object -First 1
  $dur = [double]$probe.format.duration
  $n, $d = $vs.r_frame_rate -split '/'; $fps = [math]::Round([double]$n / [double]$d, 2)
  $aspect = if ($vs.height -gt $vs.width) { 'طولي (9:16)' } elseif ($vs.height -eq $vs.width) { 'مربع' } else { 'عرضي (16:9)' }

  # 2) Cut rhythm
  & scenedetect -q -i $src -o $tmp detect-adaptive -t 2.5 list-scenes -f scenes.csv 2>$null | Out-Null
  $scenes = @()
  if (Test-Path "$tmp\scenes.csv") {
    $scenes = Get-Content "$tmp\scenes.csv" | Select-Object -Skip 2 | ForEach-Object { $c = $_ -split ','; [pscustomobject]@{ n = $c[0]; start = [double]$c[3]; len = [double]$c[9] } }
    Copy-Item "$tmp\scenes.csv" $out -Force
  }
  $avgShot = if ($scenes.Count) { [math]::Round(($scenes | Measure-Object len -Average).Average, 2) } else { $dur }

  # 3) Audio: loudness + silences
  $eb = & ffmpeg -hide_banner -i $src -af ebur128 -f null - 2>&1 | Out-String
  $lufs = if ($eb -match '(?s)Summary:.*?I:\s+(-?[\d.]+) LUFS') { $Matches[1] } else { '?' }
  $lra  = if ($eb -match '(?s)Summary:.*?LRA:\s+([\d.]+) LU') { $Matches[1] } else { '?' }
  $sil = & ffmpeg -hide_banner -i $src -af "silencedetect=n=-35dB:d=0.4" -f null - 2>&1 | Select-String 'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)' | ForEach-Object { "- سكتة $([math]::Round([double]$_.Matches[0].Groups[2].Value,2))ث تنتهي عند $([math]::Round([double]$_.Matches[0].Groups[1].Value,2))ث" }

  # 4) Contact sheets (1 frame/sec, timestamped) + palette
  $fontDir = 'C:/Windows/Fonts'
  Copy-Item "$fontDir/arial.ttf" "$tmp\f.ttf"
  & ffmpeg -hide_banner -loglevel error -y -i $src -vf "fps=1,scale=300:-1,drawtext=fontfile=f.ttf:text='%{pts\:hms}':x=6:y=6:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=7x3" "sheet_%d.jpg"
  & ffmpeg -hide_banner -loglevel error -y -i $src -vf "fps=2,scale=160:-1,palettegen=max_colors=8:stats_mode=full" -frames:v 1 palette.png
  Copy-Item sheet_*.jpg, palette.png $out -Force

  # 5) Transcript
  $transcript = ''
  if (-not $NoTranscript) {
    $model = Join-Path $Tools "whisper-cpp\ggml-$Model.bin"
    & ffmpeg -hide_banner -loglevel error -y -i $src -vn -ac 1 -ar 16000 -c:a pcm_s16le a.wav
    if (Test-Path $model) {
      # whisper.cpp can't open non-ASCII paths: hard-link (or copy) the model into the temp folder
      try { New-Item -ItemType HardLink -Path m.bin -Target $model -ErrorAction Stop | Out-Null } catch { Copy-Item $model m.bin }
      & whisper-cli -m m.bin -l $Lang -f a.wav -osrt -of transcript -t ([Environment]::ProcessorCount) -np 2>$null
      if (Test-Path transcript.srt) { Copy-Item transcript.srt $out -Force; $transcript = Get-Content transcript.srt -Raw -Encoding UTF8 }
    }
  }
  Pop-Location

  # 6) Report
  $words = if ($transcript) { (($transcript -split "`n" | Where-Object { $_ -and $_ -notmatch '^\d+\s*$' -and $_ -notmatch '-->' }) -join ' ' -split '\s+' | Where-Object { $_ }).Count } else { 0 }
  $wpm = if ($words) { [math]::Round($words / ($dur / 60)) } else { '-' }
  $sceneRows = ($scenes | ForEach-Object { "| $($_.n) | $([math]::Round($_.start,2))ث | $([math]::Round($_.len,2))ث |" }) -join "`n"
  @"
# تحليل: $($item.Name)

| | |
|---|---|
| المقاس | $($vs.width)x$($vs.height) — $aspect |
| المدة | $([math]::Round($dur,1)) ثانية |
| الإطارات | $fps fps |
| عدد المشاهد | $($scenes.Count) |
| متوسط طول اللقطة | $avgShot ثانية |
| مستوى الصوت | $lufs LUFS (تفاوت $lra LU) |
| سرعة الكلام | $wpm كلمة/دقيقة |

## المشاهد
| # | البداية | الطول |
|---|---|---|
$sceneRows

## السكتات
$($sil -join "`n")

## الكلام
``````
$transcript
``````

## الملفات
- sheet_*.jpg — لقطة كل ثانية
- palette.png — الألوان السائدة
"@ | Set-Content (Join-Path $out 'report.md') -Encoding UTF8
  Write-Host "Done -> $out"
} finally { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
