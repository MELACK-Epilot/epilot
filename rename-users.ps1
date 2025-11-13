# Script pour renommer l'ancien Users.tsx
$oldFile = "src\features\dashboard\pages\Users.tsx"
$newFile = "src\features\dashboard\pages\Users.tsx.backup"

if (Test-Path $oldFile) {
    Move-Item -Path $oldFile -Destination $newFile -Force
    Write-Host "✅ Fichier renommé: Users.tsx -> Users.tsx.backup"
} else {
    Write-Host "❌ Fichier Users.tsx introuvable"
}
