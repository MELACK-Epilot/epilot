# Script PowerShell pour assembler automatiquement le formulaire moderne
# Usage: .\assembler-formulaire.ps1

Write-Host "🚀 Assemblage du Formulaire d'Inscription Moderne" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Chemins des fichiers
$part1 = "src\features\modules\inscriptions\components\InscriptionFormModerne_Part1.tsx"
$part2 = "src\features\modules\inscriptions\components\InscriptionFormModerne_Part2.tsx"
$part3 = "src\features\modules\inscriptions\components\InscriptionFormModerne_Part3.tsx"
$output = "src\features\modules\inscriptions\components\InscriptionFormModerne.tsx"

# Vérifier que les fichiers existent
Write-Host "✓ Vérification des fichiers sources..." -ForegroundColor Yellow

if (-not (Test-Path $part1)) {
    Write-Host "❌ Erreur: $part1 introuvable" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $part2)) {
    Write-Host "❌ Erreur: $part2 introuvable" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $part3)) {
    Write-Host "❌ Erreur: $part3 introuvable" -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Part1 trouvé" -ForegroundColor Green
Write-Host "  ✓ Part2 trouvé" -ForegroundColor Green
Write-Host "  ✓ Part3 trouvé" -ForegroundColor Green
Write-Host ""

# Lire les contenus
Write-Host "📖 Lecture des fichiers..." -ForegroundColor Yellow

$content1 = Get-Content $part1 -Raw
$content2 = Get-Content $part2 -Raw
$content3 = Get-Content $part3 -Raw

Write-Host "  ✓ Part1 lu ($(($content1 -split "`n").Count) lignes)" -ForegroundColor Green
Write-Host "  ✓ Part2 lu ($(($content2 -split "`n").Count) lignes)" -ForegroundColor Green
Write-Host "  ✓ Part3 lu ($(($content3 -split "`n").Count) lignes)" -ForegroundColor Green
Write-Host ""

# Extraire les parties nécessaires
Write-Host "🔧 Assemblage en cours..." -ForegroundColor Yellow

# Part2: Supprimer les 5 premières lignes (commentaires)
$part2Lines = $content2 -split "`n"
$part2Content = ($part2Lines | Select-Object -Skip 5) -join "`n"

# Part3: Extraire handleSubmit (lignes 6-41) et Navigation (lignes 50-89)
$part3Lines = $content3 -split "`n"
$handleSubmit = ($part3Lines | Select-Object -Skip 5 -First 36) -join "`n"
$navigation = ($part3Lines | Select-Object -Skip 49 -First 40) -join "`n"

# Trouver où insérer handleSubmit dans Part1 (après handlePrevious)
$insertPoint = $content1.IndexOf("  const handlePrevious")
$insertPoint = $content1.IndexOf("};", $insertPoint) + 3

# Insérer handleSubmit
$finalContent = $content1.Insert($insertPoint, "`n$handleSubmit`n")

# Ajouter Part2 (étapes 3 et 4)
$finalContent += $part2Content

# Ajouter la navigation de Part3
$finalContent += "`n$navigation"

Write-Host "  ✓ handleSubmit inséré" -ForegroundColor Green
Write-Host "  ✓ Étapes 3 et 4 ajoutées" -ForegroundColor Green
Write-Host "  ✓ Navigation ajoutée" -ForegroundColor Green
Write-Host ""

# Écrire le fichier final
Write-Host "💾 Écriture du fichier final..." -ForegroundColor Yellow

$finalContent | Out-File -FilePath $output -Encoding UTF8

$finalLines = ($finalContent -split "`n").Count
Write-Host "  ✓ Fichier créé: $output" -ForegroundColor Green
Write-Host "  ✓ Total: $finalLines lignes" -ForegroundColor Green
Write-Host ""

# Résumé
Write-Host "✅ ASSEMBLAGE TERMINÉ AVEC SUCCÈS !" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Fichier créé:" -ForegroundColor Cyan
Write-Host "   $output" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Ouvrir le fichier dans VS Code" -ForegroundColor White
Write-Host "   2. Formater le code (Shift+Alt+F)" -ForegroundColor White
Write-Host "   3. Vérifier qu'il n'y a pas d'erreurs TypeScript" -ForegroundColor White
Write-Host "   4. Tester dans le navigateur (npm run dev)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Votre formulaire moderne est prêt ! 🇨🇬" -ForegroundColor Green
