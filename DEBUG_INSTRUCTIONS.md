# 🔍 INSTRUCTIONS DE DEBUG - MODULES & CATÉGORIES

## 📋 ÉTAPE 1 : Vérifier la Base de Données

### **1.1 Exécuter le script SQL**
```sql
-- Ouvrir Supabase SQL Editor
-- Copier/coller le contenu de database/DEBUG_MODULES_CATEGORIES.sql
-- Exécuter chaque requête une par une
```

### **1.2 Vérifier les résultats**

**Requête 1** : Le groupe existe ?
- ✅ Doit retourner 1 ligne avec le groupe "L'INTELIGENCE SELESTE"

**Requête 2** : Le groupe a un abonnement actif ?
- ✅ Doit retourner 1 ligne avec `status = 'active'`
- ✅ Doit avoir un `plan_id` (UUID)
- ✅ Doit avoir un `plan_name` (ex: "Gratuit")

**Requête 3** : Le plan a des modules ?
- ✅ `modules_count` doit être > 0

**Requête 4** : Le plan a des catégories ?
- ✅ `categories_count` doit être > 0

**Requête 5** : Liste des modules du plan
- ✅ Doit retourner plusieurs lignes avec les modules

**Requête 6** : Liste des catégories du plan
- ✅ Doit retourner plusieurs lignes avec les catégories

---

## 📋 ÉTAPE 2 : Vérifier les Logs Console

### **2.1 Ouvrir la Console du Navigateur**
```
1. Appuyer sur F12
2. Aller dans l'onglet "Console"
3. Rafraîchir la page "Mes Modules"
```

### **2.2 Chercher les logs suivants**

**Logs attendus** :
```
🔍 Chargement des modules pour le groupe: [uuid]
✅ Groupe trouvé: L'INTELIGENCE SELESTE
📋 Plan statique (school_groups.plan): gratuit
📋 Plan dynamique (subscription active): gratuit
📋 Plan ID: [uuid]
📦 Modules du plan trouvés: [nombre]
✅ Modules disponibles: [nombre]
🏷️ Catégories du plan trouvées: [nombre]
```

**Si vous voyez** :
```
⚠️ Aucun plan_id trouvé dans la subscription
```
→ **Problème** : Le groupe n'a pas d'abonnement actif

**Si vous voyez** :
```
📦 Modules du plan trouvés: 0
```
→ **Problème** : Le plan n'a pas de modules assignés

---

## 📋 ÉTAPE 3 : Scénarios Possibles

### **Scénario 1 : Pas d'abonnement actif** ❌

**Symptôme** :
- Requête 2 retourne 0 ligne OU `status != 'active'`

**Solution** :
```sql
-- Créer un abonnement actif pour le groupe
INSERT INTO school_group_subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date
)
SELECT 
  sg.id,
  sp.id,
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year'
FROM school_groups sg
CROSS JOIN subscription_plans sp
WHERE sg.code = 'E-PILOT-002'
  AND sp.slug = 'gratuit'
  AND NOT EXISTS (
    SELECT 1 FROM school_group_subscriptions
    WHERE school_group_id = sg.id AND status = 'active'
  );
```

---

### **Scénario 2 : Plan sans modules/catégories** ❌

**Symptôme** :
- Requête 3 ou 4 retourne `count = 0`

**Solution** :
```sql
-- Vérifier si le plan Gratuit a des modules assignés
SELECT COUNT(*) FROM plan_modules 
WHERE plan_id IN (SELECT id FROM subscription_plans WHERE slug = 'gratuit');

-- Si 0, il faut assigner des modules au plan
-- Via l'interface Super Admin : Plans & Tarifs → Modifier le plan Gratuit
```

---

### **Scénario 3 : Modules inactifs** ❌

**Symptôme** :
- Requête 5 retourne des modules avec `status = 'inactive'`

**Solution** :
```sql
-- Activer les modules
UPDATE modules SET status = 'active' WHERE status = 'inactive';
```

---

### **Scénario 4 : Problème de jointure** ❌

**Symptôme** :
- Requêtes SQL OK mais hook retourne 0

**Solution** :
- Vérifier les logs console
- Vérifier que `plan_id` n'est pas NULL
- Vérifier que la table `plan_modules` a des données

---

## 📋 ÉTAPE 4 : Vérification Rapide

### **Test Rapide SQL**
```sql
-- Cette requête doit retourner des modules
SELECT 
  sg.name as groupe,
  sp.name as plan,
  COUNT(DISTINCT pm.module_id) as modules_count,
  COUNT(DISTINCT pc.category_id) as categories_count
FROM school_groups sg
INNER JOIN school_group_subscriptions sgs ON sg.id = sgs.school_group_id
INNER JOIN subscription_plans sp ON sgs.plan_id = sp.id
LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
LEFT JOIN plan_categories pc ON sp.id = pc.plan_id
WHERE sg.code = 'E-PILOT-002'
  AND sgs.status = 'active'
GROUP BY sg.name, sp.name;
```

**Résultat attendu** :
```
groupe                  | plan    | modules_count | categories_count
------------------------|---------|---------------|------------------
L'INTELIGENCE SELESTE  | Gratuit | 5             | 3
```

---

## 📋 ÉTAPE 5 : Actions Correctives

### **Si modules_count = 0**

**Option A** : Assigner des modules via l'interface
```
1. Se connecter en Super Admin
2. Aller dans "Plans & Tarifs"
3. Modifier le plan "Gratuit"
4. Sélectionner des catégories et modules
5. Enregistrer
```

**Option B** : Assigner des modules via SQL
```sql
-- Assigner tous les modules "Core" au plan Gratuit
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  sp.id,
  m.id
FROM subscription_plans sp
CROSS JOIN modules m
WHERE sp.slug = 'gratuit'
  AND m.required_plan = 'gratuit'
  AND m.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM plan_modules 
    WHERE plan_id = sp.id AND module_id = m.id
  );

-- Assigner toutes les catégories au plan Gratuit
INSERT INTO plan_categories (plan_id, category_id)
SELECT 
  sp.id,
  bc.id
FROM subscription_plans sp
CROSS JOIN business_categories bc
WHERE sp.slug = 'gratuit'
  AND bc.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM plan_categories 
    WHERE plan_id = sp.id AND category_id = bc.id
  );
```

---

## 📋 ÉTAPE 6 : Vérification Finale

Après correction, vérifier :

1. ✅ Rafraîchir la page "Mes Modules"
2. ✅ Les KPI affichent des nombres > 0
3. ✅ Les modules s'affichent dans la liste
4. ✅ Les catégories s'affichent dans les filtres

---

## 🆘 SI RIEN NE FONCTIONNE

**Envoyer les résultats suivants** :

1. Résultat de la requête 2 (abonnement)
2. Résultat de la requête 8 (tous les plans)
3. Résultat du test rapide (ÉTAPE 4)
4. Capture d'écran des logs console

---

**Date** : 7 novembre 2025, 13:30 PM  
**Objectif** : Identifier pourquoi les modules et catégories ne s'affichent pas
