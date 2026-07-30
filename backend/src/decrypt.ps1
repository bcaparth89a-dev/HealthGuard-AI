Add-Type -AssemblyName System.Security
$encryptedBase64 = $env:IGCCSVC_DB
if ($encryptedBase64 -eq $null -or $encryptedBase64 -eq "") {
    $encryptedBase64 = [System.Environment]::GetEnvironmentVariable("IGCCSVC_DB", "Process")
}
if ($encryptedBase64 -eq $null -or $encryptedBase64 -eq "") {
    $encryptedBase64 = [System.Environment]::GetEnvironmentVariable("IGCCSVC_DB", "User")
}
if ($encryptedBase64 -eq $null -or $encryptedBase64 -eq "") {
    $encryptedBase64 = [System.Environment]::GetEnvironmentVariable("IGCCSVC_DB", "Machine")
}

if ($encryptedBase64) {
    try {
        $encryptedBytes = [System.Convert]::FromBase64String($encryptedBase64)
        $decryptedBytes = [System.Security.Cryptography.ProtectedData]::Unprotect($encryptedBytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
        $decryptedText = [System.Text.Encoding]::UTF8.GetString($decryptedBytes)
        Write-Output "DECRYPTED_VAL:$decryptedText"
    } catch {
        Write-Output "Failed to decrypt: $_"
    }
} else {
    Write-Output "IGCCSVC_DB environment variable is empty or not found."
}
