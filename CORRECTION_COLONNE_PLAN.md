# 🐛 CORRECTION - Colonne Plan affiche toujours "Gratuit"

**Date:** 20 novembre 2025  
**Problème:** La colonne Plan affiche "Gratuit" pour tous les groupes au lieu des vraies données

---

## 🔍 DIAGNOSTIC

### Problème détecté
La vue `school_groups_with_admin` utilise la colonne `plan` de la table `school_groups`, mais:
1. Soit la colonne n'existe pas encore
2. Soit toutes les valeurs sont à "gratuit" (valeur par défaut)

### Vérification

```sql
-- Vérifier si la colonne existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'school_groups' AND column_name = 'plan';

-- Vérifier les valeurs actuelles
SELECT id, name, plan FROM school_groups;
```

---

## ✅ SOLUTION

### Étape 1: Appliquer la migration pour ajouter la colonne

**Fichier:** `20251120_add_plan_column_to_school_groups.sql`

```sql
-- Ajouter colonne plan si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_groups' AND column_name = 'plan'
  ) THEN
    ALTER TABLE school_groups 
    ADD COLUMN plan VARCHAR(50) NOT NULL DEFAULT 'gratuit';
    
    COMMENT ON COLUMN school_groups.plan IS 'Plan d''abonnement du groupe';
  END IF;
END $$;

-- Créer index
CREATE INDEX IF NOT EXISTS idx_school_groups_plan ON school_groups(plan);

-- Contrainte
ALTER TABLE school_groups
ADD CONSTRAINT check_plan_values 
CHECK (plan IN ('gratuit', 'premium', 'pro', 'institutionnel'));
```

**Appliquer dans Supabase Dashboard → SQL Editor**

---

### Étape 2: Mettre à jour les groupes existants avec leurs vrais plans

```sql
-- Mettre à jour les plans selon les abonnements existants
-- (À adapter selon votre logique métier)

-- Exemple: Si vous avez une table subscriptions
UPDATE school_groups sg
SET plan = s.plan_type
FROM subscriptions s
WHERE s.school_group_id = sg.id
  AND s.status = 'active';

-- OU manuellement pour chaque groupe
UPDATE school_groups SET plan = 'premium' WHERE code = 'E-PILOT-001';
UPDATE school_groups SET plan = 'pro' WHERE code = 'E-PILOT-002';
UPDATE school_groups SET plan = 'institutionnel' WHERE code = 'E-PILOT-003';
```

---

### Étape 3: Vérifier que la vue utilise bien la colonne

```sql
-- Vérifier la vue
SELECT id, name, plan FROM school_groups_with_admin LIMIT 5;

-- Devrait afficher les vrais plans maintenant
```

---

## 🎯 SI LA COLONNE EXISTE DÉJÀ

Si la colonne `plan` existe déjà mais affiche toujours "gratuit", c'est que:

### Option A: Les données ne sont pas mises à jour

```sql
-- Vérifier les valeurs actuelles
SELECT DISTINCT plan FROM school_groups;

-- Si tout est à 'gratuit', mettre à jour manuellement
UPDATE school_groups 
SET plan = 'premium' 
WHERE id IN (
  SELECT school_group_id 
  FROM subscriptions 
  WHERE plan_type = 'premium' AND status = 'active'
);
```

### Option B: La vue n'est pas à jour

```sql
-- Recréer la vue
DROP VIEW IF EXISTS school_groups_with_admin;

-- Puis relancer la migration:
-- 20251120_create_school_groups_with_admin_view.sql
```

---

## 🔧 SCRIPT COMPLET DE CORRECTION

```sql
-- 1. Vérifier l'état actuel
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'school_groups' 
  AND column_name = 'plan';

-- 2. Si la colonne n'existe pas, l'ajouter
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_groups' AND column_name = 'plan'
  ) THEN
    ALTER TABLE school_groups 
    ADD COLUMN plan VARCHAR(50) NOT NULL DEFAULT 'gratuit';
    
    CREATE INDEX idx_school_groups_plan ON school_groups(plan);
    
    ALTER TABLE school_groups
    ADD CONSTRAINT check_plan_values 
    CHECK (plan IN ('gratuit', 'premium', 'pro', 'institutionnel'));
  END IF;
END $$;

-- 3. Mettre à jour les plans existants
-- OPTION 1: Depuis une table subscriptions
UPDATE school_groups sg
SET plan = COALESCE(
  (
    SELECT s.plan_type 
    FROM subscriptions s 
    WHERE s.school_group_id = sg.id 
      AND s.status = 'active'
    ORDER BY s.created_at DESC 
    LIMIT 1
  ),
  'gratuit'
);

-- OPTION 2: Manuellement (exemple)
UPDATE school_groups SET plan = 'premium' WHERE name LIKE '%LAMARELLE%';
UPDATE school_groups SET plan = 'pro' WHERE name LIKE '%CELESTE%';

-- 4. Vérifier le résultat
SELECT id, name, code, plan FROM school_groups;

-- 5. Vérifier la vue
SELECT id, name, plan FROM school_groups_with_admin LIMIT 10;
```

---

## 📊 VÉRIFICATION FINALE

Après avoir appliqué les corrections:

```sql
-- 1. Vérifier que la colonne existe
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'school_groups' AND column_name = 'plan';
-- Devrait retourner: plan

-- 2. Vérifier les valeurs
SELECT plan, COUNT(*) as count 
FROM school_groups 
GROUP BY plan;
-- Devrait afficher la distribution réelle

-- 3. Vérifier la vue
SELECT name, plan FROM school_groups_with_admin;
-- Devrait afficher les vrais plans
```

---

## 🎯 RÉSULTAT ATTENDU

**Avant:**
```
CG ngongo       | Gratuit
Ecole EDJA      | Gratuit
L'INTELIGENCE   | Gratuit
LAMARELLE       | Gratuit
```

**Après:**
```
CG ngongo       | Gratuit
Ecole EDJA      | Gratuit
L'INTELIGENCE   | Premium
LAMARELLE       | Pro
```

---

## 💡 POUR ÉVITER CE PROBLÈME À L'AVENIR

### 1. Définir le plan lors de la création

```typescript
// Dans useCreateSchoolGroup
const createGroup = async (data) => {
  const { data: group } = await supabase
    .from('school_groups')
    .insert({
      ...data,
      plan: data.plan || 'gratuit', // Toujours spécifier le plan
    });
};
```

### 2. Créer un trigger pour synchroniser avec subscriptions

```sql
CREATE OR REPLACE FUNCTION sync_school_group_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le plan du groupe quand un abonnement change
  UPDATE school_groups
  SET plan = NEW.plan_type
  WHERE id = NEW.school_group_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_plan
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION sync_school_group_plan();
```

### 3. Valider le plan dans le formulaire

```typescript
// Dans SchoolGroupFormDialog
<Select
  value={form.watch('plan')}
  onValueChange={(value) => form.setValue('plan', value)}
>
  <SelectItem value="gratuit">Gratuit</SelectItem>
  <SelectItem value="premium">Premium</SelectItem>
  <SelectItem value="pro">Pro</SelectItem>
  <SelectItem value="institutionnel">Institutionnel</SelectItem>
</Select>
```

---

## 🚀 ACTIONS IMMÉDIATES

1. **Appliquer la migration** `20251120_add_plan_column_to_school_groups.sql`
2. **Mettre à jour les données** avec les vrais plans
3. **Vérifier la vue** `school_groups_with_admin`
4. **Rafraîchir la page** dans le navigateur

---

**Après ces étapes, la colonne Plan affichera les vraies données!** ✅
