<#
.SYNOPSIS
  Reports how much source code this repository holds per language.

.DESCRIPTION
  Counts the files git would track — everything committed plus new files that
  are not ignored — and skips those marked linguist-generated in .gitattributes.
  The result therefore matches the code that is actually written and reviewed
  here, and is the check behind the project's goal of a Java majority.

.EXAMPLE
  pwsh ./scripts/language-report.ps1

.EXAMPLE
  pwsh ./scripts/language-report.ps1 -Detailed
#>

[CmdletBinding()]
param(
  # List every counted file, largest first, grouped by language.
  [switch]$Detailed
)

$ErrorActionPreference = 'Stop'

$languagePatterns = [ordered]@{
  'Java'       = '\.java$'
  'TypeScript' = '\.(ts|tsx)$'
  'HTML'       = '\.html$'
  'CSS'        = '\.css$'
  'SQL'        = '\.sql$'
}

function Get-GeneratedPatterns {
  # Reads the linguist-generated declarations straight out of .gitattributes, which
  # is also what GitHub reads when it draws the language bar.
  if (-not (Test-Path -LiteralPath '.gitattributes')) { return @() }

  foreach ($line in Get-Content -LiteralPath '.gitattributes') {
    $statement = $line.Trim()
    if (-not $statement -or $statement.StartsWith('#')) { continue }

    $fields = $statement -split '\s+'
    if ($fields.Count -lt 2) { continue }

    $attributes = $fields[1..($fields.Count - 1)]
    if ($attributes -contains 'linguist-generated' -or $attributes -contains 'linguist-generated=true') {
      $fields[0]
    }
  }
}

function Test-Generated {
  param(
    [string]$Path,
    [string[]]$Patterns
  )

  foreach ($pattern in $Patterns) {
    # A pattern with a slash is anchored to the repository root, exactly as git reads it.
    $candidate = if ($pattern.Contains('/')) { $Path } else { Split-Path -Leaf $Path }
    if ($candidate -like $pattern) { return $true }
  }
  return $false
}

function Get-SourceFiles {
  # Committed files plus new, non-ignored ones, so a report run before a commit
  # still describes the code on disk. Deleted-but-committed paths drop out here.
  $paths = @(git ls-files --cached --others --exclude-standard) |
    Where-Object { $_ } |
    Sort-Object -Unique |
    Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }

  $interesting = $paths | Where-Object {
    $path = $_
    $languagePatterns.Values | Where-Object { $path -match $_ }
  }

  if (-not $interesting) { return @() }

  $generatedPatterns = @(Get-GeneratedPatterns)

  foreach ($path in $interesting) {
    if (Test-Generated -Path $path -Patterns $generatedPatterns) { continue }
    $language = $languagePatterns.Keys | Where-Object { $path -match $languagePatterns[$_] } | Select-Object -First 1
    $item = Get-Item -LiteralPath $path
    [pscustomobject]@{
      Language = $language
      Path     = $path
      Bytes    = $item.Length
      Lines    = @(Get-Content -LiteralPath $path).Count
    }
  }
}

$repositoryRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Push-Location $repositoryRoot
try {
  $files = @(Get-SourceFiles)
  if ($files.Count -eq 0) { throw 'No source files found. Is this a git repository?' }

  $byLanguage = $files |
    Group-Object Language |
    ForEach-Object {
      [pscustomobject]@{
        Language = $_.Name
        Files    = $_.Count
        Lines    = ($_.Group | Measure-Object -Property Lines -Sum).Sum
        Bytes    = ($_.Group | Measure-Object -Property Bytes -Sum).Sum
      }
    } |
    Sort-Object Bytes -Descending

  $total = ($byLanguage | Measure-Object -Property Bytes -Sum).Sum

  Write-Output ''
  Write-Output 'Source code by language (generated files excluded)'
  Write-Output '-------------------------------------------------'
  $byLanguage |
    Format-Table -AutoSize @(
      @{ Label = 'Language'; Expression = { $_.Language } }
      @{ Label = 'Files'; Expression = { $_.Files } }
      @{ Label = 'Lines'; Expression = { '{0:N0}' -f $_.Lines } }
      @{ Label = 'Bytes'; Expression = { '{0:N0}' -f $_.Bytes } }
      @{ Label = 'Share'; Expression = { '{0:P1}' -f ($_.Bytes / $total) } }
    ) | Out-String | Write-Output

  if ($Detailed) {
    foreach ($group in $byLanguage) {
      Write-Output "$($group.Language) files"
      $files |
        Where-Object Language -EQ $group.Language |
        Sort-Object Bytes -Descending |
        Format-Table -AutoSize Path, Lines, Bytes | Out-String | Write-Output
    }
  }

  $java = [long](($byLanguage | Where-Object Language -EQ 'Java').Bytes)
  $typescript = [long](($byLanguage | Where-Object Language -EQ 'TypeScript').Bytes)
  $lead = $java - $typescript

  if ($lead -gt 0) {
    Write-Output ('Java leads TypeScript by {0:N0} bytes ({1:N2}x).' -f $lead, ($java / [Math]::Max(1, $typescript)))
    exit 0
  }

  Write-Output ('TypeScript still leads Java by {0:N0} bytes.' -f (-$lead))
  exit 1
}
finally {
  Pop-Location
}
