# 🚨 Diagnostic Urgent - Niveaux Toujours Pas Affichés

## 🔍 Actions Immédiates

### 1. Ouvrir la Console (F12)

### 2. Chercher Ces Logs

Copiez-moi TOUS les logs, en particulier :

```javascript
// Log 1 : Vérification utilisateur
🔍 DEBUG loadSchoolLevels - user: {
  userId: "...",
  email: "...",
  role: "...",
  schoolId: "...",  ← EST-CE PRÉSENT ?
  hasSchoolId: true/false
}

// Log 2 : Tentative de chargement
🔄 Chargement dashboard pour école: [ID]

// Log 3 : Niveaux récupérés
🏫 Niveaux actifs de l'école: {
  has_preschool: true/false,
  has_primary: true/false,
  has_middle: true/false,
  has_high: true/false
}

// Log 4 : Résultat
✅ X niveau(x) actif(s): ...
```

---

## 🎯 Scénarios Possibles

### Scénario 1 : `schoolId` est `undefined`
**Log attendu** : `⚠️ Pas de schoolId, chargement annulé`

**Cause** : Le cache n'a pas été vidé OU l'utilisateur n'a pas de `school_id` en BDD

**Solution** :
1. Cliquer sur le bouton orange "Vider le Cache et Recharger"
2. Se reconnecter
3. OU vérifier en BDD :
```sql
SELECT id, email, school_id FROM users WHERE email = 'orel@epilot.cg';
```

### Scénario 2 : Tous les niveaux sont `false`
**Log attendu** : `✅ 0 niveau(x) actif(s):`

**Cause** : Les niveaux ne sont pas activés en BDD

**Solution** :
```sql
UPDATE schools 
SET has_primary = true, has_middle = true, has_preschool = true
WHERE id = '427cf3b6-9087-4d47-b699-1e0861042aba';
```

### Scénario 3 : Niveaux actifs mais aucune donnée
**Log attendu** : `✅ 3 niveau(x) actif(s): Maternelle, Primaire, Collège`
**Mais** : `✅ Niveaux chargés: 0`

**Cause** : Aucun élève ni classe dans les tables

**Solution** : Ajouter des données de test (voir ci-dessous)

### Scénario 4 : Erreur de permissions RLS
**Log attendu** : `❌ Erreur récupération niveaux école: ...`

**Cause** : Problème de permissions Supabase

**Solution** : Vérifier les politiques RLS

---

## 📊 Vérification BDD Complète

```sql
-- 1. Vérifier l'utilisateur
SELECT id, email, role, school_id, status
FROM users 
WHERE email = 'orel@epilot.cg';

-- 2. Vérifier l'école
SELECT id, name, has_preschool, has_primary, has_middle, has_high, status
FROM schools 
WHERE id = '427cf3b6-9087-4d47-b699-1e0861042aba';

-- 3. Vérifier les élèves
SELECT level, COUNT(*) as count
FROM students 
WHERE school_id = '427cf3b6-9087-4d47-b699-1e0861042aba' 
AND status = 'active'
GROUP BY level;

-- 4. Vérifier les classes
SELECT level, COUNT(*) as count
FROM classes 
WHERE school_id = '427cf3b6-9087-4d47-b699-1e0861042aba' 
AND status = 'active'
GROUP BY level;
```

---

## 🚀 Solution Rapide : Ajouter des Données de Test

```sql
-- Ajouter des élèves
INSERT INTO students (school_id, first_name, last_name, level, status, enrollment_date, date_of_birth, gender, academic_year)
VALUES 
  ('427cf3b6-9087-4d47-b699-1e0861042aba', 'Test', 'Maternelle 1', 'maternelle', 'active', NOW(), '2019-01-01', 'M', '2024-2025'),
  ('427cf3b6-9087-4d47-b699-1e0861042aba', 'Test', 'Primaire 1', 'primaire', 'active', NOW(), '2014-01-01', 'F', '2024-2025'),
  ('427cf3b6-9087-4d47-b699-1e0861042aba', 'Test', 'Collège 1', 'college', 'active', NOW(), '2011-01-01', 'M', '2024-2025');

-- Ajouter des classes
INSERT INTO classes (school_id, name, level, status, capacity, academic_year)
VALUES 
  ('427cf3b6-9087-4d47-b699-1e0861042aba', 'Petite Section', 'maternelle', 'active', 25, '2024-2025'),
  ('427cf3b6-9087-4d47-b699-1e0861042aba', 'CM2 A', 'primaire', 'active', 30, '2024-2025'),
  ('427cf3b6-9087-4d47-b699-1e0861042aba', '6ème A', 'college', 'active', 35, '2024-2025');
```

---

## 🎯 Checklist de Vérification

- [ ] Console ouverte (F12)
- [ ] Logs copiés
- [ ] `schoolId` présent dans les logs
- [ ] Niveaux actifs > 0
- [ ] Élèves présents en BDD
- [ ] Classes présentes en BDD
- [ ] Bouton orange cliqué (si nécessaire)
- [ ] Reconnexion effectuée

---

## 📋 Informations à Me Fournir

**Copiez-moi** :
1. TOUS les logs de la console
2. Le résultat des requêtes SQL ci-dessus
3. Ce que vous voyez exactement sur le Dashboard

**Je pourrai alors identifier le problème exact et le corriger immédiatement ! 🎯**

---

**Date**: 15 novembre 2025  
**Urgence**: HAUTE  
**Action**: Copier les logs console
