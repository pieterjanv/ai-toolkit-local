param(
    [string]$modelId='DeepSeek-R1-Distilled-NPU-Optimized',
    [string]$systemMessage,
    [string]$conversationId="conversation-$(Get-Date -Format "yyyyMMdd-HHmmss")",
    [string]$wrap
)

$args = @()
if ($systemMessage) {
    $args += "--system-message"
    $args += $systemMessage
}
if ($conversationId) {
    $args += "--conversation-id"
    $args += $conversationId
}
if ($wrap) {
    $args += "--wrap"
    $args += $wrap
}

[Microsoft.PowerShell.PSConsoleReadLine]::ClearScreen();
while ($true) {
    Write-Host
    Write-Host
    Write-Host "[User] (Type 'exit' to quit)"
    Write-Host
    $prompt = Read-Host
    if ($prompt -eq '') {
        continue
    }
    if ($prompt -eq 'exit') {
        Write-Host
        break
    }
    Write-Host
    Write-Host
    Write-Host "[Assistant]"
    Write-Host
    $env:SHELL='pwsh.exe'; .\node_modules\.bin\tsx .\src\main.ts @args --model-id $modelId --prompt $prompt | Out-Host
    Write-Host
}
