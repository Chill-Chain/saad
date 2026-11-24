<#
  Speed Ramping: سرعة عادية ← تبطيء ناعم عند لحظة مهمة ← رجوع للسرعة
  .\scripts\speed-ramp.ps1 "raw footage\clip.mp4" -At 2.0 -Hold 1.2 -Slow 0.35
  -At    بداية اللحظة البطيئة (ث)   -Hold  طولها في المصدر (ث)   -Slow  السرعة (0.35 = أبطأ ~3 مرات)
  -Fast  سرعة ما قبل وبعد (مثلاً 1.6 للإحساس السينمائي)
  الصوت يُحذف (اللقطات تُستخدم تحت التعليق الصوتي)
#>
param([Parameter(Mandatory)][string]$In, [string]$Out, [double]$At = 1.5, [double]$Hold = 1.0, [double]$Slow = 0.35, [double]$Fast = 1.0, [switch]$NoLogo)
. "$PSScriptRoot\_common.ps1"
$Out = Resolve-Out $In $Out 'ramp' '.mp4'
$e = $At + $Hold
$ci = [Globalization.CultureInfo]::InvariantCulture
$f = { param($v) $v.ToString($ci) }
# three segments, each retimed; short ease segments (0.25s) between them soften the ramp
$mid = (& $f ((1 / $Slow + 1 / $Fast) / 2))
$fc = @(
  "[0:v]trim=0:$(& $f ($At-0.25)),setpts=(PTS-STARTPTS)/$(& $f $Fast)[a]",
  "[0:v]trim=$(& $f ($At-0.25)):$(& $f $At),setpts=(PTS-STARTPTS)*$mid[b]",
  "[0:v]trim=$(& $f $At):$(& $f $e),setpts=(PTS-STARTPTS)/$(& $f $Slow)[c]",
  "[0:v]trim=$(& $f $e):$(& $f ($e+0.25)),setpts=(PTS-STARTPTS)*$mid[d]",
  "[0:v]trim=start=$(& $f ($e+0.25)),setpts=(PTS-STARTPTS)/$(& $f $Fast)[g]",
  "[a][b][c][d][g]concat=n=5:v=1,minterpolate=fps=30:mi_mode=blend,format=yuv420p[v]"
) -join ';'
Invoke-Ff -i $In -filter_complex $fc -map "[v]" -an -c:v libx264 -crf 18 -preset medium $Out
if (-not $NoLogo) { Add-Logo $Out }
Write-Host "Done -> $Out"
