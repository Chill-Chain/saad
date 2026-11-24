# Packs the skill for upload to claude.ai (zip entries use forward slashes)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
function New-Zip([string]$SrcDir, [string]$ZipPath, [string]$Prefix = '') {
  if (Test-Path $ZipPath) { Remove-Item $ZipPath }
  $zip = [IO.Compression.ZipFile]::Open($ZipPath, 'Create')
  try {
    Get-ChildItem $SrcDir -Recurse -File -Force | ForEach-Object {
      $rel = $Prefix + $_.FullName.Substring($SrcDir.Length + 1).Replace('\', '/')
      [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, 'Optimal')
    }
  } finally { $zip.Dispose() }
}
$sk = Join-Path $PSScriptRoot 'luxury-medical-motion-ads'
New-Zip $sk (Join-Path $PSScriptRoot 'luxury-medical-motion-ads-plugin.zip')
New-Zip (Join-Path $sk 'skills\luxury-medical-motion-ads') (Join-Path $PSScriptRoot 'luxury-medical-motion-ads-skill.zip') 'luxury-medical-motion-ads/'
$z = [IO.Compression.ZipFile]::OpenRead((Join-Path $PSScriptRoot 'luxury-medical-motion-ads-plugin.zip'))
$z.Entries | Select-Object -First 3 -ExpandProperty FullName
$z.Dispose()
