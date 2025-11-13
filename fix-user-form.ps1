# Script pour remplacer UserFormDialog.tsx par UserFormDialogNew.tsx

$oldFile = "src/features/dashboard/components/UserFormDialog.tsx"
$newFile = "src/features/dashboard/components/UserFormDialogNew.tsx"

# Copier le nouveau fichier sur l'ancien
if (Test-Path $newFile) {
    Copy-Item $newFile $oldFile -Force
    Write-Host "✅ Fichier copié" -ForegroundColor Green
    
    # Supprimer le fichier New
    Remove-Item $newFile -Force
    Write-Host "✅ Fichier New supprimé" -ForegroundColor Green
}

Write-Host "🎉 Remplacement terminé !" -ForegroundColor Cyan
