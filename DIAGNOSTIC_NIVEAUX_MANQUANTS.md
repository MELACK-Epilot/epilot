# 🔍 Diagnostic - Niveaux Scolaires Non Affichés

## ❌ Problème
Les KPIs des niveaux scolaires ne s'affichent pas dans le Dashboard Proviseur.

---

## 🔎 Diagnostic Étape par Étape

### Étape 1 : Ouvrir la Console Navigateur

1. Appuyez sur **F12** pour ouvrir les outils développeur
2. Allez dans l'onglet **Console**
3. Rafraîchissez la page (F5)

### Étape 2 : Chercher les Logs de Diagnostic

Vous devriez voir ces logs :

```javascript
// 1. Hook useDirectorDashboard
🔄 Chargement dashboard pour école: [school_id]
🏫 Niveaux actifs de l'école: {
  has_preschool: false,
  has_primary: true,
  has_middle: true,
  has_high: false
}
✅ X niveau(x) actif(s): Primaire, Collège
✅ Niveaux chargés: 2

// 2. Composant DirectorDashboard
🔍 DirectorDashboard - schoolLevels reçus: [...]
🔍 DirectorDashboard - Nombre de niveaux: 2
✅ DirectorDashboard - niveauxEducatifs convertis: [...]
```

---

## 🎯 Causes Possibles

### Cause 1 : Aucun Niveau Actif dans l'École ❌

**Symptôme** :
```javascript
✅ 0 niveau(x) actif(s):
```

**Solution** :
```sql
-- Activer au moins un niveau dans votre école
UPDATE schools 
SET 
  has_primary = true,
  has_middle = true
WHERE id = 'your-school-id';
```

---

### Cause 2 : Aucune Donnée dans les Tables ❌

**Symptôme** :
```javascript
✅ 2 niveau(x) actif(s): Primaire, Collège
// Mais les niveaux ont 0 élèves, 0 classes
```

**Vérification** :
```sql
-- Vérifier les élèves
SELECT level, COUNT(*) as count
FROM students 
WHERE school_id = 'your-school-id' AND status = 'active'
GROUP BY level;

-- Vérifier les classes
SELECT level, COUNT(*) as count
FROM classes 
WHERE school_id = 'your-school-id' AND status = 'active'
GROUP BY level;
```

**Solution** : Ajouter des données de test
```sql
-- Ajouter des élèves
INSERT INTO students (school_id, first_name, last_name, level, status, enrollment_date)
VALUES 
  ('your-school-id', 'Élève', 'Test 1', 'primaire', 'active', NOW()),
  ('your-school-id', 'Élève', 'Test 2', 'primaire', 'active', NOW()),
  ('your-school-id', 'Élève', 'Test 3', 'college', 'active', NOW());

-- Ajouter des classes
INSERT INTO classes (school_id, name, level, status, capacity)
VALUES 
  ('your-school-id', 'CM2 A', 'primaire', 'active', 40),
  ('your-school-id', '6ème A', 'college', 'active', 35);
```

---

### Cause 3 : school_id Non Défini ❌

**Symptôme** :
```javascript
⚠️ Pas de schoolId, chargement annulé
```

**Vérification** :
```sql
SELECT id, email, role, school_id
FROM users 
WHERE email = 'votre-email@test.com';
```

**Solution** :
```sql
UPDATE users 
SET school_id = 'your-school-id'
WHERE email = 'votre-email@test.com';
```

---

### Cause 4 : Erreur de Permissions RLS ❌

**Symptôme** :
```javascript
❌ Erreur lors du chargement des niveaux: [error]
```

**Vérification** :
```sql
-- Tester l'accès à la table schools
SELECT id, name, has_preschool, has_primary, has_middle, has_high
FROM schools 
WHERE id = 'your-school-id';

-- Tester l'accès à la table students
SELECT COUNT(*) FROM students WHERE school_id = 'your-school-id';
```

**Solution** : Vérifier les politiques RLS
```sql
-- Politique pour proviseur sur schools
CREATE POLICY "Proviseur voit son école"
  ON schools FOR SELECT
  USING (id = (SELECT school_id FROM users WHERE id = auth.uid()));

-- Politique pour proviseur sur students
CREATE POLICY "Proviseur voit ses élèves"
  ON students FOR SELECT
  USING (school_id = (SELECT school_id FROM users WHERE id = auth.uid()));
```

---

## ✅ Script de Vérification Complet

```sql
-- ============================================================================
-- SCRIPT DE VÉRIFICATION - NIVEAUX DASHBOARD
-- ============================================================================

-- 1. Vérifier l'utilisateur
SELECT 
  id,
  email,
  role,
  school_id,
  status
FROM users 
WHERE email = 'VOTRE_EMAIL@test.com';

-- 2. Vérifier l'école et ses niveaux actifs
SELECT 
  id,
  name,
  has_preschool,
  has_primary,
  has_middle,
  has_high,
  status
FROM schools 
WHERE id = (SELECT school_id FROM users WHERE email = 'VOTRE_EMAIL@test.com');

-- 3. Vérifier les élèves par niveau
SELECT 
  level,
  COUNT(*) as total_students,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_students
FROM students 
WHERE school_id = (SELECT school_id FROM users WHERE email = 'VOTRE_EMAIL@test.com')
GROUP BY level;

-- 4. Vérifier les classes par niveau
SELECT 
  level,
  COUNT(*) as total_classes,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_classes
FROM classes 
WHERE school_id = (SELECT school_id FROM users WHERE email = 'VOTRE_EMAIL@test.com')
GROUP BY level;

-- 5. Vérifier les enseignants
SELECT 
  COUNT(*) as total_teachers
FROM users 
WHERE school_id = (SELECT school_id FROM users WHERE email = 'VOTRE_EMAIL@test.com')
AND role = 'enseignant'
AND status = 'active';

-- 6. Vérifier les paiements
SELECT 
  COUNT(*) as total_payments,
  SUM(amount) as total_amount
FROM fee_payments 
WHERE school_id = (SELECT school_id FROM users WHERE email = 'VOTRE_EMAIL@test.com')
AND status IN ('paid', 'completed');
```

---

## 🚀 Script de Correction Complet

```sql
-- ============================================================================
-- SCRIPT DE CORRECTION - DONNÉES DE TEST
-- ============================================================================

-- Remplacer 'YOUR_SCHOOL_ID' par votre ID d'école réel

-- 1. Activer les niveaux dans l'école
UPDATE schools 
SET 
  has_preschool = false,
  has_primary = true,
  has_middle = true,
  has_high = false
WHERE id = 'YOUR_SCHOOL_ID';

-- 2. Ajouter des élèves (Primaire)
INSERT INTO students (school_id, first_name, last_name, level, status, enrollment_date, date_of_birth, gender, academic_year)
SELECT 
  'YOUR_SCHOOL_ID',
  'Élève',
  'Primaire ' || generate_series,
  'primaire',
  'active',
  NOW(),
  NOW() - INTERVAL '10 years',
  CASE WHEN random() > 0.5 THEN 'M' ELSE 'F' END,
  '2024-2025'
FROM generate_series(1, 30);

-- 3. Ajouter des élèves (Collège)
INSERT INTO students (school_id, first_name, last_name, level, status, enrollment_date, date_of_birth, gender, academic_year)
SELECT 
  'YOUR_SCHOOL_ID',
  'Élève',
  'Collège ' || generate_series,
  'college',
  'active',
  NOW(),
  NOW() - INTERVAL '13 years',
  CASE WHEN random() > 0.5 THEN 'M' ELSE 'F' END,
  '2024-2025'
FROM generate_series(1, 25);

-- 4. Ajouter des classes
INSERT INTO classes (school_id, name, level, status, capacity, academic_year)
VALUES 
  ('YOUR_SCHOOL_ID', 'CM1 A', 'primaire', 'active', 30, '2024-2025'),
  ('YOUR_SCHOOL_ID', 'CM2 A', 'primaire', 'active', 35, '2024-2025'),
  ('YOUR_SCHOOL_ID', '6ème A', 'college', 'active', 40, '2024-2025'),
  ('YOUR_SCHOOL_ID', '5ème A', 'college', 'active', 35, '2024-2025');

-- 5. Ajouter des enseignants
INSERT INTO users (email, first_name, last_name, role, school_id, status)
VALUES 
  ('prof.primaire@test.com', 'Prof', 'Primaire', 'enseignant', 'YOUR_SCHOOL_ID', 'active'),
  ('prof.college@test.com', 'Prof', 'Collège', 'enseignant', 'YOUR_SCHOOL_ID', 'active');

-- 6. Ajouter des paiements
INSERT INTO fee_payments (school_id, amount, status, created_at)
SELECT 
  'YOUR_SCHOOL_ID',
  (random() * 50000 + 25000)::integer,
  'paid',
  NOW() - (random() * interval '30 days')
FROM generate_series(1, 15);

-- 7. Vérification finale
SELECT 
  'Élèves Primaire' as type,
  COUNT(*) as count
FROM students 
WHERE school_id = 'YOUR_SCHOOL_ID' AND level = 'primaire' AND status = 'active'
UNION ALL
SELECT 
  'Élèves Collège',
  COUNT(*)
FROM students 
WHERE school_id = 'YOUR_SCHOOL_ID' AND level = 'college' AND status = 'active'
UNION ALL
SELECT 
  'Classes',
  COUNT(*)
FROM classes 
WHERE school_id = 'YOUR_SCHOOL_ID' AND status = 'active'
UNION ALL
SELECT 
  'Enseignants',
  COUNT(*)
FROM users 
WHERE school_id = 'YOUR_SCHOOL_ID' AND role = 'enseignant' AND status = 'active'
UNION ALL
SELECT 
  'Paiements',
  COUNT(*)
FROM fee_payments 
WHERE school_id = 'YOUR_SCHOOL_ID' AND status = 'paid';
```

---

## 📊 Résultat Attendu

Après correction, vous devriez voir dans le Dashboard :

### 1. Section "Détail par Niveau Éducatif"
```
[2 niveaux]
```

### 2. Carte Primaire
```
┌─────────────────────────────────────────────────┐
│ 📗 PRIMAIRE              💰 0.45M  [✓ Performant]│
│ 30 élèves • 2 classes • 2 enseignants           │
├─────────────────────────────────────────────────┤
│ [👥 30↗️] [📚 2↗️] [👨‍🏫 2→] [🎯 85%↗️]          │
└─────────────────────────────────────────────────┘
```

### 3. Carte Collège
```
┌─────────────────────────────────────────────────┐
│ 🏫 COLLÈGE               💰 0.38M  [✓ Performant]│
│ 25 élèves • 2 classes • 2 enseignants           │
├─────────────────────────────────────────────────┤
│ [👥 25↗️] [📚 2↗️] [👨‍🏫 2→] [🎯 82%↗️]          │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Checklist de Diagnostic

Cochez chaque élément :

### Base de Données
- [ ] school_id défini dans users
- [ ] École existe dans schools
- [ ] Au moins un niveau actif (has_primary ou has_middle = true)
- [ ] Élèves présents dans students
- [ ] Classes présentes dans classes
- [ ] Permissions RLS configurées

### Console Navigateur
- [ ] Logs "Chargement dashboard" visibles
- [ ] Logs "Niveaux actifs" visibles
- [ ] Logs "X niveau(x) actif(s)" > 0
- [ ] Logs "niveauxEducatifs convertis" non vide
- [ ] Aucune erreur rouge dans la console

### Interface
- [ ] Badge "X niveaux" affiche un nombre > 0
- [ ] Cartes de niveaux visibles
- [ ] KPIs par niveau affichés
- [ ] Pas de message "Aucun niveau scolaire actif"

---

## 💡 Astuce Rapide

Si vous voyez le message **"Aucun niveau scolaire actif"**, c'est que :

1. **Soit** : Aucun niveau n'est activé dans `schools`
   ```sql
   UPDATE schools SET has_primary = true, has_middle = true 
   WHERE id = 'your-school-id';
   ```

2. **Soit** : Le hook ne récupère pas les données
   - Vérifier les logs console
   - Vérifier school_id de l'utilisateur
   - Vérifier les permissions RLS

---

**Date**: 15 novembre 2025  
**Version**: 2.1.0  
**Statut**: Guide de Diagnostic Niveaux
