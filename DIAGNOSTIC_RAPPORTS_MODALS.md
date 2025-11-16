# 🔍 DIAGNOSTIC - Modals Rapports Sans Données

## ❌ PROBLÈME

Les modals "Aperçu" et "Générer" affichent "École" au lieu des vraies données :
- Pas de logo
- Pas de nom d'école
- Pas d'adresse
- Pas de contacts
- Pas de groupe scolaire
- Pas de responsable

---

## 🎯 CAUSE PROBABLE

### 1. L'utilisateur n'a pas de `school_id` et `school_group_id`

**Vérification** :
```sql
-- Dans Supabase SQL Editor
SELECT id, email, first_name, last_name, role, school_id, school_group_id
FROM users
WHERE email = 'TON_EMAIL@example.com';
```

**Si `school_id` ou `school_group_id` est NULL** → C'est le problème !

---

## ✅ SOLUTIONS

### Solution 1 : Assigner une école à l'utilisateur (RECOMMANDÉ)

#### Étape 1 : Créer un groupe scolaire (si n'existe pas)
```sql
INSERT INTO school_groups (name, address, phone, email, status)
VALUES (
  'Mon Groupe Scolaire',
  '123 Rue de l''École, Dakar',
  '+221 33 123 45 67',
  'contact@groupe.sn',
  'active'
)
RETURNING id;
-- Note l'ID retourné (ex: abc-123-def)
```

#### Étape 2 : Créer une école
```sql
INSERT INTO schools (name, address, phone, email, school_group_id, status)
VALUES (
  'École Sainte Marie',
  '123 Rue de l''École, Dakar',
  '+221 33 123 45 67',
  'contact@ecole.sn',
  'abc-123-def',  -- Remplace par l'ID du groupe
  'active'
)
RETURNING id;
-- Note l'ID retourné (ex: xyz-789-abc)
```

#### Étape 3 : Assigner l'école à l'utilisateur
```sql
UPDATE users
SET 
  school_id = 'xyz-789-abc',  -- Remplace par l'ID de l'école
  school_group_id = 'abc-123-def'  -- Remplace par l'ID du groupe
WHERE email = 'TON_EMAIL@example.com';
```

#### Étape 4 : Vérifier
```sql
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  s.name as school_name,
  sg.name as group_name
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.email = 'TON_EMAIL@example.com';
```

---

### Solution 2 : Le hook a un fallback automatique

Le hook `useSchoolInfo` a été modifié pour :
1. Récupérer automatiquement le premier groupe scolaire si l'utilisateur n'en a pas
2. Récupérer automatiquement la première école du groupe
3. Retourner des données par défaut si rien n'existe

**Mais il faut au moins UNE école et UN groupe dans la base !**

---

## 🔧 VÉRIFICATIONS À FAIRE

### 1. Vérifier que les tables existent
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('schools', 'school_groups', 'users');
```

### 2. Vérifier qu'il y a des données
```sql
-- Compter les groupes
SELECT COUNT(*) as nb_groupes FROM school_groups;

-- Compter les écoles
SELECT COUNT(*) as nb_ecoles FROM schools;

-- Voir les groupes
SELECT id, name, address, phone, email FROM school_groups LIMIT 5;

-- Voir les écoles
SELECT id, name, address, phone, email, school_group_id FROM schools LIMIT 5;
```

---

## 🚀 ACTIONS IMMÉDIATES

### Option A : Tu as déjà des écoles/groupes dans la base
```sql
-- Assigner la première école à ton utilisateur
UPDATE users u
SET 
  school_id = (SELECT id FROM schools LIMIT 1),
  school_group_id = (SELECT school_group_id FROM schools LIMIT 1)
WHERE u.email = 'TON_EMAIL@example.com';
```

### Option B : Tu n'as rien dans la base
```sql
-- Script complet pour créer tout
-- 1. Créer un groupe
INSERT INTO school_groups (name, address, phone, email, status)
VALUES (
  'Réseau Excellence',
  '123 Avenue de la République, Dakar',
  '+221 33 123 45 67',
  'contact@excellence.sn',
  'active'
);

-- 2. Créer une école
INSERT INTO schools (name, address, phone, email, school_group_id, status)
SELECT 
  'École Sainte Marie',
  '456 Rue de l''Éducation, Dakar',
  '+221 33 987 65 43',
  'contact@saintemarie.sn',
  sg.id,
  'active'
FROM school_groups sg
WHERE sg.name = 'Réseau Excellence';

-- 3. Assigner à ton utilisateur
UPDATE users u
SET 
  school_id = s.id,
  school_group_id = s.school_group_id
FROM schools s
WHERE s.name = 'École Sainte Marie'
AND u.email = 'TON_EMAIL@example.com';
```

---

## 🔍 DEBUGGING

### Dans la console du navigateur (F12)

Tu devrais voir ces logs :
```
🏫 useSchoolInfo - User data: {
  userId: "...",
  schoolId: "xyz-789-abc",  // ← Doit avoir une valeur
  schoolGroupId: "abc-123-def"  // ← Doit avoir une valeur
}

🔍 Fetching school info...
✅ School data: {
  name: "École Sainte Marie",
  address: "456 Rue de l'Éducation, Dakar",
  phone: "+221 33 987 65 43",
  email: "contact@saintemarie.sn"
}

✅ School group data: {
  name: "Réseau Excellence",
  address: "123 Avenue de la République, Dakar"
}

✅ Final school info: { ... }
```

### Si tu vois :
```
⚠️ No schoolGroupId, fetching first school group...
⚠️ No schoolId, fetching first school from group...
```
→ Le fallback automatique s'active (OK si tu as des données dans la base)

### Si tu vois :
```
❌ Still missing schoolId or schoolGroupId after fallback
```
→ Il n'y a AUCUNE école/groupe dans la base !

---

## 📊 ÉTAT ACTUEL DU CODE

### ✅ Ce qui est fait
```
✅ Hook useSchoolInfo créé
✅ Fallback automatique implémenté
✅ Logs de debug ajoutés
✅ ReportPreviewModal a le code pour afficher
✅ ReportGenerateModal a le code pour afficher
✅ schoolInfo passé aux modals
✅ Signature professionnelle ajoutée
```

### ❌ Ce qui manque
```
❌ DONNÉES dans la base Supabase
   - Pas de school_groups
   - Pas de schools
   - Pas de school_id sur l'utilisateur
```

---

## 🎯 SOLUTION RAPIDE (5 MINUTES)

### 1. Ouvre Supabase SQL Editor

### 2. Copie-colle ce script
```sql
-- Créer un groupe scolaire
INSERT INTO school_groups (name, address, phone, email, status)
VALUES (
  'Réseau Excellence Sénégal',
  '123 Avenue de la République, Dakar, Sénégal',
  '+221 33 123 45 67',
  'contact@excellence.sn',
  'active'
)
ON CONFLICT DO NOTHING;

-- Créer une école
INSERT INTO schools (name, address, phone, email, school_group_id, status)
SELECT 
  'École Sainte Marie de Dakar',
  '456 Rue de l''Éducation, Plateau, Dakar',
  '+221 33 987 65 43',
  'contact@saintemarie.sn',
  sg.id,
  'active'
FROM school_groups sg
WHERE sg.name = 'Réseau Excellence Sénégal'
ON CONFLICT DO NOTHING;

-- Assigner à TOUS les utilisateurs proviseurs
UPDATE users u
SET 
  school_id = s.id,
  school_group_id = s.school_group_id
FROM schools s
WHERE s.name = 'École Sainte Marie de Dakar'
AND u.role IN ('proviseur', 'directeur', 'directeur_etudes')
AND (u.school_id IS NULL OR u.school_group_id IS NULL);

-- Vérifier
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  s.name as school_name,
  sg.name as group_name
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.role IN ('proviseur', 'directeur', 'directeur_etudes');
```

### 3. Exécute le script (bouton RUN)

### 4. Rafraîchis la page (Ctrl+Shift+R)

### 5. Ouvre la modal → Tu devrais voir les données !

---

## 🎉 RÉSULTAT ATTENDU

Après avoir exécuté le script SQL, les modals afficheront :

```
┌──────────────────────────────────────────┐
│ [LOGO] École Sainte Marie de Dakar       │
│        456 Rue de l'Éducation, Plateau   │
│        +221 33 987 65 43                 │
│        contact@saintemarie.sn            │
│                                          │
│ Groupe: Réseau Excellence Sénégal        │
│                                          │
│ Rapport Académique                       │
│ Période: Mensuel                         │
│ Généré le: 16/11/2025                    │
│                                          │
│ Responsable: [Ton Nom]                   │
│ Email: [Ton Email]                       │
│                                          │
│ ──────────────────────────────────       │
│ École Sainte Marie - Réseau Excellence   │
│ Document généré par E-Pilot              │
└──────────────────────────────────────────┘
```

---

## 📝 NOTES IMPORTANTES

1. **Le code est COMPLET** ✅
2. **Le problème est les DONNÉES** ❌
3. **Solution = Exécuter le script SQL** 🎯
4. **Temps estimé = 5 minutes** ⏱️

---

**Exécute le script SQL maintenant et dis-moi ce que tu vois ! 🚀**

**Date** : 16 novembre 2025  
**Heure** : 10:37  
**Statut** : Code complet, données manquantes
