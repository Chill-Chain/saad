<#
  اعتماد صوت خارجي (ElevenLabs من الموصل، أو تسجيل بشري) لمشروع إعلان
  .\scripts\external-voice.ps1 tiktok-pop -Source "C:\path\take.mp3" [-Label "ElevenLabs Mansour"]
  - يعالج الصوت (نفس سلسلة voiceover.py) -> projects/<name>/voice.wav
  - يفرّغه بتوقيت كل كلمة (whisper.cpp) ويطابقه مع أسطر vo.txt -> timings.json (مع words) + voice.srt
  بعدها: .\scripts\hi-ad.ps1 <name> -SkipVoice   (أو رندر تركيبة Pop مباشرة)
#>
param([Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][string]$Source, [string]$Label = 'external')
. "$PSScriptRoot\_common.ps1"
$ErrorActionPreference = 'Continue'
$proj = Join-Path $Root "projects\$Name"
if (-not (Test-Path "$proj\vo.txt")) { throw "Missing $proj\vo.txt" }
$T = Join-Path $env:TEMP "hi_ext_$Name"; New-Item -ItemType Directory -Force $T | Out-Null
Copy-Item -LiteralPath $Source "$T\src$([IO.Path]::GetExtension($Source))" -Force
$src = Get-Item "$T\src*" | Select-Object -First 1
Copy-Item $src.FullName "$proj\voice-raw$($src.Extension)" -Force
& ffmpeg -hide_banner -loglevel error -y -i $src.FullName -af "silenceremove=start_periods=1:start_threshold=-50dB,adelay=350|350,highpass=f=75,equalizer=f=3200:t=q:w=1:g=2,equalizer=f=250:t=q:w=1:g=-1.5,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,loudnorm=I=-16:TP=-1.5:LRA=9,apad=pad_dur=0.6" -ar 48000 -ac 1 "$T\voice.wav"
& ffmpeg -hide_banner -loglevel error -y -i "$T\voice.wav" -ar 16000 -ac 1 "$T\v16.wav"
if (-not (Test-Path "$T\m.bin")) { cmd /c mklink /H "$T\m.bin" "$Tools\whisper-cpp\ggml-large-v3-turbo.bin" | Out-Null }
& whisper-cli -m "$T\m.bin" -f "$T\v16.wav" -l ar -ml 1 -sow -oj -of "$T\words" 2>&1 | Out-Null
$dur = [double](& ffprobe -v error -show_entries format=duration -of csv=p=0 "$T\voice.wav")
Copy-Item "$T\voice.wav" "$proj\voice.wav" -Force
Copy-Item "$proj\vo.txt" "$T\vo.txt" -Force
& python -I "$PSScriptRoot\py\align_vo.py" "$T\words.json" "$T\vo.txt" $dur $T $Label
Copy-Item "$T\timings.json", "$T\voice.srt" $proj -Force
# transcript for a pronunciation check
((Get-Content "$T\words.json" -Encoding utf8 | ConvertFrom-Json).transcription | ForEach-Object { $_.text.Trim() }) -join ' ' | Set-Content "$proj\transcript.txt" -Encoding utf8
Write-Host "Voice -> $proj (duration $([math]::Round($dur,2))s). Compare transcript.txt with vo.txt."
