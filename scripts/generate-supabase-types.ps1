# Script PowerShell pour générer les types TypeScript Supabase
# E-Pilot Congo

Write-Host "🔧 Génération des types TypeScript Supabase..." -ForegroundColor Cyan

# Vérifier si supabase CLI est installé
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Installation de Supabase CLI..." -ForegroundColor Yellow
    Write-Host "Exécutez cette commande :" -ForegroundColor Yellow
    Write-Host "npm install -g supabase" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ou utilisez npx :" -ForegroundColor Yellow
    Write-Host "npx supabase gen types typescript --project-id csltuxbanvweyfzqpfap > src/types/supabase.types.ts" -ForegroundColor Green
    exit 1
}

# Générer les types
Write-Host "📝 Génération en cours..." -ForegroundColor Yellow

try {
    npx supabase gen types typescript --project-id csltuxbanvweyfzqpfap > src/types/supabase.types.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Types générés avec succès !" -ForegroundColor Green
        Write-Host "📁 Fichier: src/types/supabase.types.ts" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erreur lors de la génération" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}
