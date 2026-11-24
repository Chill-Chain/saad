<#
  تعليق صوتي سعودي من ملف نص (سطر = جملة = مشهد)
  .\scripts\voiceover.ps1 "projects\fatigue-ad\vo.txt"                     -> صوت نسائي (افتراضي)
  .\scripts\voiceover.ps1 "projects\fatigue-ad\vo.txt" -Gender male
  .\scripts\voiceover.ps1 "projects\fatigue-ad\vo.txt" -Provider elevenlabs -Voice <voice_id>
  المخرجات بجانب الملف: voice.wav + timings.json (توقيت كل جملة) + voice.srt
  ElevenLabs: أفضل لهجة سعودية طبيعية — ضع المفتاح مرة وحدة:
    [Environment]::SetEnvironmentVariable('ELEVENLABS_API_KEY','...','User')
#>
param(
  [Parameter(Mandatory)][string]$ScriptFile, [string]$OutDir,
  [ValidateSet('auto','edge','elevenlabs')][string]$Provider = 'auto',
  [ValidateSet('female','male')][string]$Gender = 'female',
  [string]$Voice = '', [string]$Rate = '-6%', [string]$Model = 'eleven_multilingual_v2'
)
. "$PSScriptRoot\_common.ps1"
$ErrorActionPreference = 'Continue'
$src = (Resolve-Path -LiteralPath $ScriptFile).Path
if (-not $OutDir) { $OutDir = Split-Path $src -Parent }
$args2 = @("$PSScriptRoot\py\voiceover.py", $src, $OutDir, '--provider', $Provider, '--gender', $Gender, "--rate=$Rate", '--model', $Model)
if ($Voice) { $args2 += @('--voice', $Voice) }
& python -I @args2
if ($LASTEXITCODE) { throw "voiceover failed" }
