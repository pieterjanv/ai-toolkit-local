param(
    [string]$modelId='DeepSeek-R1-Distilled-NPU-Optimized',
    [string]$systemMessage,
    [string]$conversationId="conversation-$(Get-Date -Format "yyyyMMdd-HHmmss")",
    [string]$wrap,
    [string]$language='English'
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
Write-Host
$prompt = ''
$line = ''
while ($true) {
    Write-Host "
:more  - open a multi-line input box
:clear - clear the current prompt
:exit  - quit
"
    Write-Host
    Write-Host "[User]"
    Write-Host
    $line = Read-Host

    if ($line -eq ':more') {
        $prompt = & "$PSScriptRoot\lib\Read-MultiLineInputBoxDialog" -Message "Enter your message" -WindowTitle "User input"
        Write-Host
        if ($prompt -eq '') {
            Write-Host
            break
        }
        Write-Host $prompt
    }
    elseif ($line -eq ':clear') {
        [Microsoft.PowerShell.PSConsoleReadLine]::ClearScreen();
        $prompt = ''
        continue
    }
    elseif ($line -eq ':exit') {
        Write-Host
        break
    }
    else {
        $prompt = $line
        Write-Host
    }

    Write-Host
    Write-Host "[Assistant]"
    Write-Host
    $env:SHELL='pwsh.exe'; .\node_modules\.bin\tsx .\src\main.ts @args --model-id $modelId --prompt $prompt --language $language | Out-Host
    Write-Host
}
