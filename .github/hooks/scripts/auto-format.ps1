<#
.SYNOPSIS
    PostToolUse hook: auto-format files modified by agent tool calls.
.DESCRIPTION
    Detects newly created and modified files via git, then runs prettier --write
    and eslint --fix on eligible file types.
    Non-blocking — exits 0 on success/irrelevant, non-zero warnings otherwise.
#>

$ErrorActionPreference = "Continue"

# Detect changed files
$untracked = git ls-files --others --exclude-standard 2>$null
$modified  = git diff --name-only 2>$null

$allFiles = @($untracked) + @($modified) | Where-Object { $_ -and $_ -ne '' }
if (-not $allFiles) {
    exit 0
}

# Filter to files prettier can handle
$prettierExt = '\.(ts|tsx|js|jsx|mjs|cjs|json|jsonc|css|less|scss|md|mdx|yaml|yml|graphql|html)$'
$formattable = $allFiles | Where-Object { $_ -match $prettierExt }
if (-not $formattable) {
    exit 0
}

Write-Output "[auto-format] Formatting $($formattable.Count) file(s)..."

# 1. Prettier
npx --yes prettier --write --ignore-unknown $formattable 2>&1 | Out-Null

# 2. ESLint --fix (ts/tsx/js/jsx only)
$lintable = $formattable | Where-Object { $_ -match '\.(ts|tsx|js|jsx|mjs|cjs)$' }
if ($lintable) {
    Write-Output "[auto-format] Linting $($lintable.Count) file(s)..."
    npx eslint --fix --no-error-on-unmatched-pattern $lintable 2>&1 | Out-Null
}

exit 0
