# 🚀 Guide de Démarrage - Dashboard Proviseur

## ⚡ Démarrage Rapide

### 1. Démarrer le Serveur de Développement

```bash
# Dans le terminal, à la racine du projet
npm run dev
```

**Le serveur va démarrer sur un port disponible** (généralement 5173 ou 3000)

Vous verrez un message comme :
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 2. Ouvrir l'Application

**Ouvrez votre navigateur** et allez sur l'URL affichée :
```
http://localhost:5173
```

---

### 3. Se Connecter en tant que Proviseur

#### Option A : Utilisateur Existant
Si vous avez déjà un compte Proviseur :
1. Cliquez sur "Se connecter"
2. Entrez vos identifiants
3. Vous serez redirigé vers le Dashboard

#### Option B : Créer un Compte de Test
Si vous n'avez pas de compte :

**Dans Supabase Dashboard** :
1. Allez dans `Authentication` → `Users`
2. Créez un nouvel utilisateur
3. Notez l'ID de l'utilisateur

**Dans la table `users`** :
```sql
-- Insérer un proviseur de test
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  school_id,
  status
) VALUES (
  'auth-user-id-from-supabase',
  'proviseur@test.com',
  'Jean',
  'Proviseur',
  'proviseur',
  'your-school-id',
  'active'
);
```

---

### 4. Vérifier l'Affichage du Dashboard

Une fois connecté, vous devriez voir :

#### ✅ KPIs Globaux (en haut)
```
┌─────────────────────────────────────────────────┐
│         📊 Vue d'Ensemble École                 │
│  625 élèves | 31 classes | 50 profs | 85%      │
└─────────────────────────────────────────────────┘
```

#### ✅ Sections par Niveau (toujours visibles)
```
┌─────────────────────────────────────────────────┐
│ 📗 PRIMAIRE              💰 1.80M  [✓ Performant]│
│ 180 élèves • 8 classes • 12 enseignants         │
├─────────────────────────────────────────────────┤
│ [👥 180↗️] [📚 8↗️] [👨‍🏫 12→] [🎯 87%↗️]        │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Vérification des Données

### Console Navigateur (F12)

Ouvrez la console pour voir les logs :
```javascript
🔄 Chargement dashboard pour école: [school_id]
🏫 Niveaux actifs de l'école: {...}
✅ 2 niveau(x) actif(s): Primaire, Collège
📈 Tendances chargées: 6 mois
🔊 Activation des écoutes temps réel
```

---

## 🐛 Résolution des Problèmes

### Problème 1 : "Données de Démonstration"

**Symptôme** : Alerte orange en haut du dashboard

**Cause** : Pas de données dans Supabase ou erreur RLS

**Solution** :
1. Vérifier que l'école existe dans `schools`
2. Vérifier que `school_id` est défini dans `users`
3. Vérifier les permissions RLS

```sql
-- Vérifier l'école
SELECT * FROM schools WHERE id = 'your-school-id';

-- Vérifier le proviseur
SELECT * FROM users WHERE email = 'proviseur@test.com';

-- Vérifier les niveaux actifs
SELECT has_preschool, has_primary, has_middle, has_high 
FROM schools WHERE id = 'your-school-id';
```

---

### Problème 2 : Aucun Niveau Affiché

**Symptôme** : Section "Détail par Niveau Éducatif" vide

**Cause** : Aucun niveau actif dans l'école

**Solution** :
```sql
-- Activer au moins un niveau
UPDATE schools 
SET has_primary = true, has_middle = true
WHERE id = 'your-school-id';
```

---

### Problème 3 : KPIs à 0

**Symptôme** : Tous les compteurs affichent 0

**Cause** : Pas de données dans les tables

**Solution** : Ajouter des données de test

```sql
-- Ajouter des élèves
INSERT INTO students (
  school_id, first_name, last_name, 
  level, status, enrollment_date
) VALUES 
  ('your-school-id', 'Élève', 'Test 1', 'primaire', 'active', NOW()),
  ('your-school-id', 'Élève', 'Test 2', 'primaire', 'active', NOW()),
  ('your-school-id', 'Élève', 'Test 3', 'college', 'active', NOW());

-- Ajouter des classes
INSERT INTO classes (
  school_id, name, level, status, capacity
) VALUES 
  ('your-school-id', 'CM2 A', 'primaire', 'active', 40),
  ('your-school-id', '6ème A', 'college', 'active', 35);

-- Ajouter des paiements
INSERT INTO fee_payments (
  school_id, amount, status, created_at
) VALUES 
  ('your-school-id', 50000, 'paid', NOW()),
  ('your-school-id', 75000, 'paid', NOW());
```

---

## 📊 Données de Test Complètes

### Script Complet pour Tester

```sql
-- 1. Créer une école de test
INSERT INTO schools (
  id, name, code,
  has_preschool, has_primary, has_middle, has_high,
  status
) VALUES (
  'test-school-001',
  'École Test Dashboard',
  'ETD001',
  false, true, true, false,
  'active'
);

-- 2. Créer un proviseur
-- (D'abord créer l'utilisateur dans Supabase Auth)
-- Puis :
INSERT INTO users (
  id, email, first_name, last_name,
  role, school_id, status
) VALUES (
  'auth-user-id',
  'proviseur@test.com',
  'Jean',
  'Proviseur',
  'proviseur',
  'test-school-001',
  'active'
);

-- 3. Ajouter des élèves (Primaire)
INSERT INTO students (school_id, first_name, last_name, level, status, enrollment_date)
SELECT 
  'test-school-001',
  'Élève',
  'Primaire ' || generate_series,
  'primaire',
  'active',
  NOW()
FROM generate_series(1, 50);

-- 4. Ajouter des élèves (Collège)
INSERT INTO students (school_id, first_name, last_name, level, status, enrollment_date)
SELECT 
  'test-school-001',
  'Élève',
  'Collège ' || generate_series,
  'college',
  'active',
  NOW()
FROM generate_series(1, 40);

-- 5. Ajouter des classes
INSERT INTO classes (school_id, name, level, status, capacity)
VALUES 
  ('test-school-001', 'CM1 A', 'primaire', 'active', 30),
  ('test-school-001', 'CM2 A', 'primaire', 'active', 35),
  ('test-school-001', '6ème A', 'college', 'active', 40),
  ('test-school-001', '5ème A', 'college', 'active', 35);

-- 6. Ajouter des enseignants
INSERT INTO users (email, first_name, last_name, role, school_id, status)
VALUES 
  ('prof1@test.com', 'Prof', 'Primaire', 'enseignant', 'test-school-001', 'active'),
  ('prof2@test.com', 'Prof', 'Collège', 'enseignant', 'test-school-001', 'active');

-- 7. Ajouter des paiements
INSERT INTO fee_payments (school_id, amount, status, created_at)
SELECT 
  'test-school-001',
  (random() * 50000 + 25000)::integer,
  'paid',
  NOW() - (random() * interval '30 days')
FROM generate_series(1, 20);
```

---

## ✅ Checklist de Vérification

Avant de tester, vérifiez :

- [ ] Serveur de développement démarré (`npm run dev`)
- [ ] Navigateur ouvert sur `http://localhost:5173`
- [ ] Utilisateur créé dans Supabase Auth
- [ ] Proviseur créé dans table `users` avec `school_id`
- [ ] École créée dans table `schools` avec niveaux actifs
- [ ] Données de test ajoutées (élèves, classes, paiements)
- [ ] Permissions RLS configurées

---

## 🎯 Résultat Attendu

Une fois tout configuré, vous devriez voir :

### 1. Header du Dashboard
- Nom de l'école
- Date et heure
- Badge "En temps réel"

### 2. KPIs Globaux
- Total élèves (somme de tous les niveaux)
- Total classes
- Total enseignants
- Taux moyen de réussite

### 3. Sections par Niveau
- **Pour chaque niveau actif** :
  - En-tête avec icône et nom
  - Badge de revenus (💰 X.XXM FCFA)
  - Badge de performance (✓ Performant ou ⚠ À surveiller)
  - **4 cartes KPI toujours visibles** :
    - 👥 Élèves (avec tendance)
    - 📚 Classes (avec tendance)
    - 👨‍🏫 Enseignants
    - 🎯 Taux de réussite (avec tendance)

### 4. Graphiques
- Évolution des indicateurs sur 6 mois
- Comparaisons temporelles
- Système d'alertes

---

## 🔄 Temps Réel

Pour tester le temps réel :

1. Dashboard ouvert dans le navigateur
2. Dans Supabase, ajouter un élève :
```sql
INSERT INTO students (school_id, first_name, last_name, level, status)
VALUES ('test-school-001', 'Nouvel', 'Élève', 'primaire', 'active');
```
3. Le dashboard devrait se mettre à jour automatiquement
4. Vérifier la console : `🔄 Changement détecté dans les étudiants`

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifier la console navigateur (F12)**
   - Chercher les logs avec émojis (🔄, ✅, ❌)
   - Noter les erreurs en rouge

2. **Vérifier la console terminal**
   - Erreurs de compilation
   - Erreurs Supabase

3. **Vérifier Supabase**
   - Tables créées
   - Données présentes
   - RLS configuré

---

**Date**: 15 novembre 2025  
**Version**: 2.1.0  
**Statut**: Guide de Démarrage
