# 🛡️ Sécurité des Limites de Plans - Implémentation Complète

**Date**: 24 Novembre 2025, 02:05 AM  
**Status**: ✅ **100% DÉPLOYÉ EN PRODUCTION**

---

## 🎯 Objectif

Garantir que les limites des plans d'abonnement (Gratuit, Premium, Pro, Institutionnel) sont **physiquement respectées** au niveau de la base de données, et pas seulement au niveau de l'interface utilisateur.

---

## ✅ Protections Implémentées

### 1. 🏫 Limite d'Écoles (`max_schools`)

**Plan Gratuit**: Maximum 3 écoles

#### Mécanisme
- **Trigger**: `check_schools_limit` (BEFORE INSERT ON `schools`)
- **Fonction**: `check_plan_limits()`

#### Comportement
Si un groupe avec un plan Gratuit tente de créer une 4ème école :
```
ERROR: PLAN_LIMIT_REACHED: La limite de écoles pour le plan Gratuit est atteinte (3/3). 
Veuillez upgrader votre abonnement.
```

#### Test de Vérification
```sql
-- Vérifier le nombre d'écoles par groupe
SELECT 
    sg.name,
    COUNT(s.id) as schools_count,
    sp.max_schools as limit,
    sp.name as plan
FROM school_groups sg
LEFT JOIN schools s ON s.school_group_id = sg.id
LEFT JOIN subscriptions sub ON sub.school_group_id = sg.id AND sub.status = 'active'
LEFT JOIN subscription_plans sp ON sub.plan_id = sp.id
GROUP BY sg.id, sg.name, sp.max_schools, sp.name;
```

---

### 2. 👨‍🎓 Limite d'Élèves (`max_students`)

**Plan Gratuit**: Maximum 1,000 élèves

#### Mécanisme
- **Trigger**: `check_students_limit` (BEFORE INSERT ON `students`)
- **Fonction**: `check_plan_limits()`

#### Comportement
Si un groupe avec un plan Gratuit tente d'inscrire le 1,001ème élève :
```
ERROR: PLAN_LIMIT_REACHED: La limite de élèves pour le plan Gratuit est atteinte (1000/1000). 
Veuillez upgrader votre abonnement.
```

#### Test de Vérification
```sql
-- Vérifier le nombre d'élèves par groupe
SELECT 
    sg.name,
    COUNT(st.id) as students_count,
    sp.max_students as limit,
    sp.name as plan
FROM school_groups sg
LEFT JOIN schools sch ON sch.school_group_id = sg.id
LEFT JOIN students st ON st.school_id = sch.id
LEFT JOIN subscriptions sub ON sub.school_group_id = sg.id AND sub.status = 'active'
LEFT JOIN subscription_plans sp ON sub.plan_id = sp.id
GROUP BY sg.id, sg.name, sp.max_students, sp.name;
```

---

### 3. 💾 Limite de Stockage (`max_storage`)

**Plan Gratuit**: Maximum 1 GB

#### Mécanisme
- **Colonne de tracking**: `school_groups.storage_used_bytes`
- **Trigger 1**: `update_storage_usage_trigger` (AFTER INSERT/DELETE ON `storage.objects`)
  - Met à jour automatiquement le compteur à chaque upload/suppression
- **Trigger 2**: `check_storage_limit_trigger` (BEFORE INSERT ON `storage.objects`)
  - Vérifie la limite avant d'accepter un nouveau fichier

#### Comportement
Si un groupe avec un plan Gratuit (1 GB) tente d'uploader un fichier qui dépasserait la limite :
```
ERROR: STORAGE_LIMIT_REACHED: La limite de stockage pour le plan Gratuit est atteinte (1.05 GB / 1 GB). 
Veuillez upgrader votre abonnement ou supprimer des fichiers.
```

#### Test de Vérification
```sql
-- Vérifier le stockage utilisé par groupe
SELECT 
    sg.name,
    sg.storage_used_bytes,
    ROUND(sg.storage_used_bytes::NUMERIC / 1073741824, 2) as storage_gb,
    sp.max_storage as limit_gb,
    sp.name as plan_name,
    ROUND((sg.storage_used_bytes::NUMERIC / (sp.max_storage::NUMERIC * 1073741824)) * 100, 1) as usage_percent
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
ORDER BY usage_percent DESC;
```

---

## 📊 Tableau Récapitulatif

| Limite | Plan Gratuit | Frontend (UX) | Backend (Sécurité) | Status |
|--------|--------------|---------------|-------------------|--------|
| **Écoles** | 3 | ✅ LimitChecker | ✅ **Trigger SQL** | 🟢 **ACTIF** |
| **Élèves** | 1,000 | ✅ LimitChecker | ✅ **Trigger SQL** | 🟢 **ACTIF** |
| **Stockage** | 1 GB | ✅ LimitChecker | ✅ **Trigger SQL** | 🟢 **ACTIF** |
| **Support** | Email | ✅ Visuel | N/A (Humain) | 🟢 **ACTIF** |

---

## 🔧 Fichiers Créés

### Scripts SQL
1. **`database/ENFORCE_PLAN_LIMITS.sql`**
   - Fonction `check_plan_limits()`
   - Triggers pour écoles et élèves

2. **`database/ENFORCE_STORAGE_LIMITS.sql`**
   - Colonne `storage_used_bytes`
   - Fonction `update_storage_usage()`
   - Fonction `check_storage_limit()`
   - Triggers sur `storage.objects`

### Migrations Exécutées
1. ✅ `enforce_plan_limits` (Écoles & Élèves)
2. ✅ `add_storage_tracking_column` (Colonne stockage)
3. ✅ `create_storage_limit_functions` (Fonctions stockage)
4. ✅ `create_storage_triggers` (Triggers stockage)

---

## 🧪 Tests de Validation

### Test 1: Bloquer une 4ème école (Plan Gratuit)
```sql
-- Simuler l'insertion d'une 4ème école pour un groupe Gratuit
-- Devrait échouer avec PLAN_LIMIT_REACHED
INSERT INTO schools (name, school_group_id, code, status)
SELECT 'École Test 4', id, 'TEST-004', 'active'
FROM school_groups
WHERE plan = 'gratuit'
LIMIT 1;
```

### Test 2: Bloquer le 1,001ème élève (Plan Gratuit)
```sql
-- Simuler l'insertion du 1,001ème élève
-- Devrait échouer avec PLAN_LIMIT_REACHED
INSERT INTO students (first_name, last_name, school_id, status)
SELECT 'Test', 'Student 1001', s.id, 'active'
FROM schools s
JOIN school_groups sg ON s.school_group_id = sg.id
WHERE sg.plan = 'gratuit'
LIMIT 1;
```

### Test 3: Vérifier le compteur de stockage
```sql
-- Vérifier que le compteur se met à jour automatiquement
SELECT name, storage_used_bytes, 
       ROUND(storage_used_bytes::NUMERIC / 1048576, 2) as storage_mb
FROM school_groups
WHERE storage_used_bytes > 0;
```

---

## 🚨 Gestion des Erreurs

### Côté Frontend
Le composant `LimitChecker` intercepte les erreurs et affiche :
- Un message clair à l'utilisateur
- Un bouton "Upgrader vers [Plan Recommandé]"
- Un lien vers la page des plans

### Côté Backend
Les triggers PostgreSQL lèvent des exceptions avec :
- Code d'erreur explicite (`PLAN_LIMIT_REACHED`, `STORAGE_LIMIT_REACHED`)
- Message détaillé (limite actuelle, limite max, plan concerné)
- Suggestion d'action (upgrader l'abonnement)

---

## 📈 Avantages de cette Approche

### Sécurité
- ✅ **Impossible de contourner** les limites (même via API directe)
- ✅ Protection au niveau le plus bas (base de données)
- ✅ Pas de dépendance au code frontend

### Performance
- ✅ Vérification instantanée (triggers natifs PostgreSQL)
- ✅ Pas de requêtes supplémentaires côté application
- ✅ Compteur de stockage pré-calculé (pas de SUM() à chaque fois)

### Maintenabilité
- ✅ Logique centralisée dans la base de données
- ✅ Facile à tester et auditer
- ✅ Fonctionne même si le frontend change

---

## 🔄 Maintenance

### Rafraîchir le compteur de stockage (si nécessaire)
```sql
-- Recalculer le stockage pour tous les groupes
UPDATE school_groups sg
SET storage_used_bytes = COALESCE(
    (
        SELECT SUM((obj.metadata->>'size')::BIGINT)
        FROM storage.objects obj
        WHERE obj.path_tokens IS NOT NULL 
        AND array_length(obj.path_tokens, 1) >= 1
        AND obj.path_tokens[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND obj.path_tokens[1]::UUID = sg.id
    ), 0
);
```

### Désactiver temporairement les limites (URGENCE UNIQUEMENT)
```sql
-- Désactiver les triggers (À NE FAIRE QU'EN CAS D'URGENCE)
ALTER TABLE schools DISABLE TRIGGER check_schools_limit;
ALTER TABLE students DISABLE TRIGGER check_students_limit;
ALTER TABLE storage.objects DISABLE TRIGGER check_storage_limit_trigger;

-- Les réactiver après
ALTER TABLE schools ENABLE TRIGGER check_schools_limit;
ALTER TABLE students ENABLE TRIGGER check_students_limit;
ALTER TABLE storage.objects ENABLE TRIGGER check_storage_limit_trigger;
```

---

## ✅ Conclusion

Le système de limites de plans est maintenant **100% sécurisé** et **déployé en production**.

**Toutes les limites sont respectées** :
- ✅ Écoles (max_schools)
- ✅ Élèves (max_students)
- ✅ Stockage (max_storage)

**Aucun utilisateur ne peut dépasser les limites de son plan**, même en contournant l'interface.

---

**Implémentation terminée avec succès le 24 Novembre 2025 à 02:05 AM** 🎊

*La sécurité des abonnements est maintenant garantie au niveau de la base de données !*
