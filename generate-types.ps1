# Script pour générer les types Supabase
$env:SUPABASE_ACCESS_TOKEN = "sbp_06e5e05d1653a86375dbbae267a920ac8a11df6e"
npx supabase gen types typescript --project-id csltuxbanvweyfzqpfap | Out-File -FilePath "src/types/supabase.types.ts" -Encoding utf8
Write-Host "✅ Types générés avec succès dans src/types/supabase.types.ts" -ForegroundColor Green
