# ✅ Vérification de cohérence - Groupes Scolaires

## 🎯 **Objectif**
Vérifier la cohérence entre :
1. **Schéma SQL** (Supabase)
2. **Type TypeScript** (dashboard.types.ts)
3. **Schéma Zod** (formSchemas.ts)
4. **Formulaire React** (composants)

---

## 📊 **Comparaison des champs**

### **Champs obligatoires (NOT NULL en SQL)**

| Champ SQL | Type SQL | Type TS | Schéma Zod | Formulaire | Cohérent ? |
|-----------|----------|---------|------------|------------|------------|
| `id` | UUID | ✅ string | ❌ Auto-généré | ❌ Auto-généré | ✅ OK |
| `name` | TEXT | ✅ string | ✅ string (3-100) | ✅ Input | ✅ OK |
| `code` | TEXT | ✅ string | ✅ string (2-20) | ✅ Input (auto) | ✅ OK |
| `region` | TEXT | ✅ string | ✅ string (2-50) | ✅ Select | ✅ OK |
| `city` | TEXT | ✅ string | ✅ string (2-50) | ✅ Select | ✅ OK |
| `admin_id` | UUID | ✅ adminId | ❌ Géré backend | ❌ Géré backend | ✅ OK |
| `plan` | ENUM | ✅ SubscriptionPlan | ✅ enum | ✅ Select | ✅ OK |
| `status` | ENUM | ✅ string | ✅ enum (update) | ✅ Select (edit) | ✅ OK |

### **Champs optionnels**

| Champ SQL | Type SQL | Type TS | Schéma Zod | Formulaire | Cohérent ? |
|-----------|----------|---------|------------|------------|------------|
| `address` | ❌ Absent | ✅ string? | ✅ optional | ✅ Textarea | ⚠️ **INCOHÉRENT** |
| `phone` | ❌ Absent | ✅ string? | ✅ optional | ✅ Input | ⚠️ **INCOHÉRENT** |
| `website` | ❌ Absent | ✅ string? | ✅ optional | ✅ Input | ⚠️ **INCOHÉRENT** |
| `foundedYear` | ❌ Absent | ✅ number? | ✅ optional | ✅ Input | ⚠️ **INCOHÉRENT** |
| `description` | ❌ Absent | ✅ string? | ✅ optional | ✅ Textarea | ⚠️ **INCOHÉRENT** |
| `logo` | ❌ Absent | ✅ string? | ✅ optional | ✅ Upload | ⚠️ **INCOHÉRENT** |

### **Champs calculés (statistiques)**

| Champ SQL | Type SQL | Type TS | Schéma Zod | Formulaire | Cohérent ? |
|-----------|----------|---------|------------|------------|------------|
| `school_count` | INTEGER | ✅ schoolCount | ❌ Absent | ❌ Absent | ✅ OK |
| `student_count` | INTEGER | ✅ studentCount | ❌ Absent | ❌ Absent | ✅ OK |
| `staff_count` | INTEGER | ✅ staffCount | ❌ Absent | ❌ Absent | ✅ OK |

### **Champs système**

| Champ SQL | Type SQL | Type TS | Schéma Zod | Formulaire | Cohérent ? |
|-----------|----------|---------|------------|------------|------------|
| `created_at` | TIMESTAMP | ✅ createdAt | ❌ Auto-généré | ❌ Auto-généré | ✅ OK |
| `updated_at` | TIMESTAMP | ✅ updatedAt | ❌ Auto-généré | ❌ Auto-généré | ✅ OK |

### **Champs admin (jointure)**

| Champ SQL | Type SQL | Type TS | Schéma Zod | Formulaire | Cohérent ? |
|-----------|----------|---------|------------|------------|------------|
| ❌ Jointure | - | ✅ adminName | ❌ Absent | ❌ Absent | ✅ OK |
| ❌ Jointure | - | ✅ adminEmail | ❌ Absent | ❌ Absent | ✅ OK |

---

## ⚠️ **INCOHÉRENCES DÉTECTÉES**

### **Problème : Champs manquants dans la BDD**

**6 champs** sont dans le formulaire mais **absents de la table SQL** :

1. ❌ `address` (TEXT)
2. ❌ `phone` (TEXT)
3. ❌ `website` (TEXT)
4. ❌ `foundedYear` (INTEGER)
5. ❌ `description` (TEXT)
6. ❌ `logo` (TEXT)

---

## 🔧 **Solutions possibles**

### **Option 1 : Ajouter les colonnes manquantes en SQL** ✅ RECOMMANDÉ

```sql
-- Ajouter les colonnes manquantes à la table school_groups
ALTER TABLE school_groups
ADD COLUMN address TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN website TEXT,
ADD COLUMN founded_year INTEGER,
ADD COLUMN description TEXT,
ADD COLUMN logo TEXT;

-- Ajouter des contraintes optionnelles
ALTER TABLE school_groups
ADD CONSTRAINT check_founded_year CHECK (founded_year >= 1900 AND founded_year <= EXTRACT(YEAR FROM NOW()));

ALTER TABLE school_groups
ADD CONSTRAINT check_website_format CHECK (website IS NULL OR website ~ '^https?://');
```

### **Option 2 : Retirer les champs du formulaire** ❌ PAS RECOMMANDÉ

Retirer `address`, `phone`, `website`, `foundedYear`, `description`, `logo` du formulaire.

**Inconvénient** : Perte de fonctionnalités utiles.

---

## 📋 **Script SQL de migration**

```sql
-- =====================================================
-- MIGRATION : Ajout des champs manquants
-- Date : 30 octobre 2025
-- =====================================================

-- 1. Ajouter les colonnes
ALTER TABLE school_groups
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo TEXT;

-- 2. Ajouter les contraintes
ALTER TABLE school_groups
ADD CONSTRAINT IF NOT EXISTS check_founded_year 
  CHECK (founded_year IS NULL OR (founded_year >= 1900 AND founded_year <= EXTRACT(YEAR FROM NOW())));

ALTER TABLE school_groups
ADD CONSTRAINT IF NOT EXISTS check_website_format 
  CHECK (website IS NULL OR website ~ '^https?://');

ALTER TABLE school_groups
ADD CONSTRAINT IF NOT EXISTS check_phone_format 
  CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s-]{8,20}$');

-- 3. Ajouter des index pour la recherche
CREATE INDEX IF NOT EXISTS idx_school_groups_name ON school_groups(name);
CREATE INDEX IF NOT EXISTS idx_school_groups_code ON school_groups(code);
CREATE INDEX IF NOT EXISTS idx_school_groups_region ON school_groups(region);
CREATE INDEX IF NOT EXISTS idx_school_groups_city ON school_groups(city);

-- 4. Commentaires
COMMENT ON COLUMN school_groups.address IS 'Adresse physique du groupe scolaire';
COMMENT ON COLUMN school_groups.phone IS 'Numéro de téléphone principal';
COMMENT ON COLUMN school_groups.website IS 'Site web officiel';
COMMENT ON COLUMN school_groups.founded_year IS 'Année de création';
COMMENT ON COLUMN school_groups.description IS 'Description du groupe';
COMMENT ON COLUMN school_groups.logo IS 'URL du logo';
```

---

## ✅ **Vérification après migration**

### **Requête de test**

```sql
-- Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'school_groups'
ORDER BY ordinal_position;

-- Résultat attendu : 19 colonnes
-- 1. id (UUID)
-- 2. name (TEXT)
-- 3. code (TEXT)
-- 4. region (TEXT)
-- 5. city (TEXT)
-- 6. address (TEXT) ← NOUVEAU
-- 7. phone (TEXT) ← NOUVEAU
-- 8. website (TEXT) ← NOUVEAU
-- 9. founded_year (INTEGER) ← NOUVEAU
-- 10. description (TEXT) ← NOUVEAU
-- 11. logo (TEXT) ← NOUVEAU
-- 12. admin_id (UUID)
-- 13. school_count (INTEGER)
-- 14. student_count (INTEGER)
-- 15. staff_count (INTEGER)
-- 16. plan (subscription_plan)
-- 17. status (status)
-- 18. created_at (TIMESTAMP)
-- 19. updated_at (TIMESTAMP)
```

---

## 📊 **Mapping snake_case ↔ camelCase**

### **SQL → TypeScript**

| SQL (snake_case) | TypeScript (camelCase) | Conversion |
|------------------|------------------------|------------|
| `school_count` | `schoolCount` | ✅ Auto (Supabase) |
| `student_count` | `studentCount` | ✅ Auto (Supabase) |
| `staff_count` | `staffCount` | ✅ Auto (Supabase) |
| `admin_id` | `adminId` | ✅ Auto (Supabase) |
| `founded_year` | `foundedYear` | ✅ Auto (Supabase) |
| `created_at` | `createdAt` | ✅ Auto (Supabase) |
| `updated_at` | `updatedAt` | ✅ Auto (Supabase) |

**Note** : Supabase convertit automatiquement snake_case → camelCase.

---

## 🎯 **Recommandations**

### **1. Exécuter la migration SQL** ✅ PRIORITAIRE

```bash
# Dans Supabase Dashboard → SQL Editor
# Copier/coller le script de migration ci-dessus
# Cliquer sur "Run"
```

### **2. Vérifier les hooks React Query**

Après migration, vérifier que les hooks récupèrent bien tous les champs :

```typescript
// useSchoolGroups.ts
const { data, error } = await supabase
  .from('school_groups')
  .select(`
    *,
    admin:users(id, first_name, last_name, email)
  `);

// Vérifier que data contient :
// - address ✅
// - phone ✅
// - website ✅
// - foundedYear ✅ (founded_year converti)
// - description ✅
// - logo ✅
```

### **3. Tester le formulaire**

```bash
npm run dev
# → Créer un groupe scolaire
# → Remplir tous les champs
# → Vérifier que tout est sauvegardé
```

---

## ✅ **Résumé**

### **État actuel**

| Aspect | Statut | Détails |
|--------|--------|---------|
| **Champs obligatoires** | ✅ Cohérent | name, code, region, city, plan, status |
| **Champs calculés** | ✅ Cohérent | schoolCount, studentCount, staffCount |
| **Champs système** | ✅ Cohérent | id, createdAt, updatedAt, adminId |
| **Champs optionnels** | ⚠️ **INCOHÉRENT** | 6 champs manquants en SQL |

### **Action requise**

✅ **Exécuter le script de migration SQL** pour ajouter les 6 colonnes manquantes :
- `address`
- `phone`
- `website`
- `founded_year`
- `description`
- `logo`

---

**Date** : 30 octobre 2025  
**Auteur** : E-Pilot Congo 🇨🇬  
**Statut** : ⚠️ MIGRATION SQL REQUISE
