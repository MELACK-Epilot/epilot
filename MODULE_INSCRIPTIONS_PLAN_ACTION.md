# 🎯 Module Inscriptions - Plan d'Action Immédiat

**Date**: 31 octobre 2025  
**Priorité**: 🔴 **CRITIQUE**  
**Temps estimé**: 30 minutes

---

## 📊 Résumé de l'Analyse

### État Actuel
- ✅ **Interface utilisateur**: Moderne et fonctionnelle (90%)
- ✅ **Composants React**: Bien structurés (85%)
- ⚠️ **Base de données**: Colonnes manquantes (60%)
- ⚠️ **Mapping données**: Incohérences critiques (50%)

### Problème Principal
**Le code TypeScript utilise des noms de colonnes qui ne correspondent PAS à la base de données SQL.**

---

## 🔴 Actions Immédiates (À faire MAINTENANT)

### Étape 1: Exécuter la Migration SQL (5 min)

1. **Ouvrir Supabase Dashboard**
   - Aller sur: https://supabase.com/dashboard
   - Sélectionner votre projet E-Pilot

2. **Ouvrir SQL Editor**
   - Menu latéral → SQL Editor
   - Cliquer sur "New query"

3. **Copier-coller le script**
   - Fichier: `database/INSCRIPTIONS_MIGRATION_COMPLETE.sql`
   - Tout sélectionner (Ctrl+A)
   - Copier (Ctrl+C)
   - Coller dans SQL Editor (Ctrl+V)

4. **Exécuter**
   - Cliquer sur "Run" (ou F5)
   - Attendre le message: "✅ Migration terminée avec succès!"

5. **Vérifier**
   - Aller dans Table Editor → inscriptions
   - Vérifier que les nouvelles colonnes existent:
     - `a_aide_sociale`
     - `est_pensionnaire`
     - `a_bourse`
     - `est_redoublant`
     - `est_affecte`
     - `frais_cantine`
     - `frais_transport`
     - `workflow_step`
     - `internal_notes`
     - `rejection_reason`
     - `submitted_at`
     - `validated_at`
     - `validated_by`
     - `serie`

---

### Étape 2: Régénérer les Types Supabase (5 min)

1. **Ouvrir le terminal**
   ```bash
   cd c:\Developpement\e-pilot
   ```

2. **Exécuter le script de génération**
   ```bash
   npm run generate:types
   # OU
   npx supabase gen types typescript --project-id csltuxbanvweyfzqpfap > src/types/supabase.types.ts
   ```

3. **Vérifier le fichier généré**
   - Ouvrir: `src/types/supabase.types.ts`
   - Chercher l'interface `inscriptions`
   - Vérifier que toutes les nouvelles colonnes sont présentes

---

### Étape 3: Corriger le Hook useInscriptions (2 min)

**Fichier**: `src/features/modules/inscriptions/hooks/queries/useInscriptions.ts`

**Ligne 21 - AVANT**:
```typescript
query = query.eq('academic_year', filters.academicYear);
```

**Ligne 21 - APRÈS**:
```typescript
query = query.eq('annee_academique', filters.academicYear);
```

**Correction à appliquer**:

<function_calls>
<invoke name="edit">
<parameter name="file_path">c:\Developpement\e-pilot\src\features\modules\inscriptions\hooks\queries\useInscriptions.ts
