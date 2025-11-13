# Script pour restaurer l'ancien Users.tsx
$backupFile = "src\features\dashboard\pages\Users.tsx.backup"
$targetFile = "src\features\dashboard\pages\Users.tsx"

if (Test-Path $backupFile) {
    Copy-Item -Path $backupFile -Destination $targetFile -Force
    Write-Host "✅ Fichier restauré: Users.tsx.backup -> Users.tsx"
} else {
    Write-Host "❌ Fichier backup introuvable"
}
