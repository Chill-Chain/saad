<#
  إنتاج إعلان الأثر الخفي كامل بأمر واحد
  .\scripts\hi-ad.ps1 fatigue-ad                         -> صوت + رندر 9:16 و 16:9 و 1:1
  .\scripts\hi-ad.ps1 fatigue-ad -Aspects 9x16 -UHD      -> 9:16 بدقة 4K
  .\scripts\hi-ad.ps1 fatigue-ad -Gender male -Provider elevenlabs -Voice <id>

  المتطلبات لكل مشروع projects\<name>\:
    vo.txt        نص التعليق الصوتي (سطر = مشهد)
    brief.md      خطة الإنتاج (إلزامية قبل التنفيذ)
    media\        لقطات/صور المشروع (تُنسخ تلقائياً إلى Remotion)
  + خطة المشاهد في remotion-studio\src\HiStudio\productions\<name>.ts ومسجّلة في Root.tsx
  المخرجات: Final videos\<name>\<name>-<aspect>.mp4
#>
param(
  [Parameter(Mandatory)][string]$Name,
  [string]$Aspects = '9x16,16x9,1x1', [switch]$UHD, [switch]$SkipVoice,
  [ValidateSet('auto','edge','elevenlabs')][string]$Provider = 'auto',
  [ValidateSet('female','male')][string]$Gender = 'female', [string]$Voice = ''
)
. "$PSScriptRoot\_common.ps1"
$ErrorActionPreference = 'Continue'
$proj = Join-Path $Root "projects\$Name"
$studio = Join-Path $Root 'remotion-studio'
$pub = Join-Path $studio "public\projects\$Name"
if (-not (Test-Path "$proj\vo.txt")) { throw "Missing $proj\vo.txt — write the voice-over script first" }
if (-not (Test-Path "$proj\brief.md")) { Write-Warning "No brief.md — the production plan is mandatory (see the skill's brief template)" }

# 1) Voice-over (regenerated when vo.txt changed)
$timings = "$proj\timings.json"
if (-not $SkipVoice -and (-not (Test-Path $timings) -or (Get-Item "$proj\vo.txt").LastWriteTime -gt (Get-Item $timings).LastWriteTime)) {
  & "$PSScriptRoot\voiceover.ps1" -ScriptFile "$proj\vo.txt" -Provider $Provider -Gender $Gender -Voice $Voice
}
if (-not (Test-Path "$proj\voice.wav")) { throw "No voice.wav — the voice-over track is required for every ad" }

# 2) Sync assets into Remotion
New-Item -ItemType Directory -Force $pub | Out-Null
Copy-Item "$proj\voice.wav", $timings $pub -Force
if (Test-Path "$proj\media") { Copy-Item "$proj\media\*" $pub -Recurse -Force }

# 3) Render every aspect
$dest = Join-Path $Root "Final videos\$Name"
New-Item -ItemType Directory -Force $dest | Out-Null
Push-Location $studio
try {
  foreach ($a in ($Aspects -split ',')) {
    $id = "$Name-$($a.Trim())"
    $file = Join-Path $dest ("$id" + $(if ($UHD) { '-4k' } else { '' }) + '.mp4')
    Write-Host "Rendering $id ..."
    $r = @('remotion', 'render', $id, $file, '--crf=18', '--audio-codec=aac', '--audio-bitrate=192k')
    if ($UHD) { $r += '--scale=2' }
    & npx @r 2>&1 | Select-String -NotMatch 'Rendered|Encoded' | Select-Object -Last 3
    if (-not (Test-Path $file)) { throw "Render failed: $id" }
    # 4) Final loudness check (target −14 LUFS for social)
    $eb = & ffmpeg -hide_banner -i $file -af ebur128 -f null - 2>&1 | Out-String
    $lufs = if ($eb -match '(?s)Summary:.*?I:\s+(-?[\d.]+) LUFS') { [double]$Matches[1] } else { $null }
    if ($null -ne $lufs -and [math]::Abs($lufs + 14) -gt 1.5) {
      $fixed = $file -replace '\.mp4$', '.norm.mp4'
      & ffmpeg -hide_banner -loglevel error -y -i $file -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=9" -c:a aac -b:a 192k $fixed
      Move-Item $fixed $file -Force
      Write-Host "  loudness $lufs -> normalized to -14 LUFS"
    }
    Write-Host "  -> $file"
  }
} finally { Pop-Location }
Copy-Item "$proj\voice.srt" $dest -Force -ErrorAction SilentlyContinue
Write-Host "Done -> $dest"
