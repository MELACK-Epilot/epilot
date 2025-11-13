# 🔍 VÉRIFICATION COHÉRENCE - Base de Données vs Formulaire

## ✅ ANALYSE COMPLÈTE

---

## 📊 Structure Table `users`

### Schéma SQL Actuel
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,              -- ✅ Correspond à firstName
  last_name TEXT NOT NULL,               -- ✅ Correspond à lastName
  gender TEXT CHECK (gender IN ('M', 'F')), -- ✅ Correspond à gender
  date_of_birth DATE,                    -- ✅ Correspond à dateOfBirth
  phone TEXT,                            -- ✅ Correspond à phone
  role user_role NOT NULL DEFAULT 'enseignant', -- ⚠️ ENUM à mettre à jour
  school_group_id UUID,                  -- ✅ Auto-rempli par l'admin
  school_id UUID,                        -- ✅ Correspond à schoolId
  status status NOT NULL DEFAULT 'active', -- ✅ Correspond à status
  avatar TEXT,                           -- ✅ Correspond à avatar
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 Comparaison Formulaire vs Base de Données

### Champs du Formulaire GroupUserFormDialog

| Champ Formulaire | Type Form | Champ BDD | Type BDD | Status |
|------------------|-----------|-----------|----------|--------|
| `firstName` | string | `first_name` | TEXT | ✅ OK |
| `lastName` | string | `last_name` | TEXT | ✅ OK |
| `gender` | 'M' \| 'F' | `gender` | TEXT | ✅ OK |
| `dateOfBirth` | string (date) | `date_of_birth` | DATE | ✅ OK |
| `email` | string | `email` | TEXT | ✅ OK |
| `phone` | string | `phone` | TEXT | ✅ OK |
| `role` | enum (12 rôles) | `role` | user_role | ⚠️ À METTRE À JOUR |
| `schoolId` | UUID | `school_id` | UUID | ✅ OK |
| `schoolGroupId` | UUID (auto) | `school_group_id` | UUID | ✅ OK |
| `status` | enum | `status` | status | ✅ OK |
| `avatar` | string (URL) | `avatar` | TEXT | ✅ OK |
| `password` | string | - | - | ✅ Auth Supabase |

---

## ⚠️ PROBLÈME IDENTIFIÉ : Enum `user_role`

### Rôles Actuels dans la BDD (7 rôles)
```sql
CREATE TYPE user_role AS ENUM (
  'super_admin',      -- ✅ OK
  'admin_groupe',     -- ✅ OK
  'enseignant',       -- ✅ OK
  'cpe',              -- ✅ OK
  'comptable',        -- ✅ OK
  'documentaliste',   -- ❌ À remplacer par 'bibliothecaire'
  'surveillant'       -- ✅ OK
);
```

### Rôles Utilisés dans le Formulaire (12 rôles)
```typescript
const USER_ROLES = [
  { value: 'proviseur', label: '🎓 Proviseur' },                    // ❌ MANQUANT
  { value: 'directeur', label: '👔 Directeur' },                    // ❌ MANQUANT
  { value: 'directeur_etudes', label: '📋 Directeur des Études' },  // ❌ MANQUANT
  { value: 'secretaire', label: '📝 Secrétaire' },                  // ❌ MANQUANT
  { value: 'comptable', label: '💰 Comptable' },                    // ✅ OK
  { value: 'enseignant', label: '👨‍🏫 Enseignant' },                 // ✅ OK
  { value: 'surveillant', label: '👮 Surveillant' },                // ✅ OK
  { value: 'bibliothecaire', label: '📚 Bibliothécaire' },          // ❌ MANQUANT
  { value: 'eleve', label: '🎒 Élève' },                            // ❌ MANQUANT
  { value: 'parent', label: '👨‍👩‍👧‍👦 Parent' },                       // ❌ MANQUANT
  { value: 'gestionnaire_cantine', label: '🍽️ Gestionnaire de Cantine' }, // ❌ MANQUANT
  { value: 'autre', label: '👤 Autre' },                            // ❌ MANQUANT
];
```

### ❌ Résultat
**5 rôles manquants dans la base de données !**

---

## ✅ SOLUTION : Migration SQL

### Fichier Créé
`database/ADD_NEW_USER_ROLES.sql`

### Contenu de la Migration
```sql
-- Ajouter les nouveaux rôles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'proviseur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur_etudes';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bibliothecaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'eleve';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gestionnaire_cantine';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'autre';

-- Migrer les données existantes
UPDATE users 
SET role = 'bibliothecaire'
WHERE role = 'documentaliste';
```

### Rôles Finaux (15 rôles)
```
ADMINISTRATEURS (2):
✅ super_admin
✅ admin_groupe

DIRECTION (3):
✅ proviseur
✅ directeur
✅ directeur_etudes

ADMINISTRATIFS (2):
✅ secretaire
✅ comptable

PÉDAGOGIQUES (3):
✅ enseignant
✅ cpe
✅ surveillant

SUPPORT (2):
✅ bibliothecaire
✅ gestionnaire_cantine

UTILISATEURS (2):
✅ eleve
✅ parent

GÉNÉRIQUE (1):
✅ autre
```

---

## 🔍 Autres Vérifications

### 1. Contraintes de Clés Étrangères

#### school_group_id
```sql
-- ✅ Référence correcte
FOREIGN KEY (school_group_id) REFERENCES school_groups(id)
```

**Vérification** :
- ✅ Le formulaire remplit automatiquement `schoolGroupId` avec `currentUser?.schoolGroupId`
- ✅ Cohérent avec la hiérarchie (Admin Groupe → Utilisateurs)

#### school_id
```sql
-- ✅ Référence correcte
FOREIGN KEY (school_id) REFERENCES schools(id)
```

**Vérification** :
- ✅ Le formulaire affiche la liste des écoles du groupe
- ✅ L'utilisateur sélectionne une école obligatoirement

### 2. Validation des Données

#### Email
```typescript
// Formulaire (Zod)
email: z.string().email()
  .refine((email) => email.endsWith('.cg') || email.endsWith('.com'))

// BDD
email TEXT UNIQUE NOT NULL
```
✅ **Cohérent** : Validation côté client + contrainte UNIQUE côté serveur

#### Téléphone
```typescript
// Formulaire (Zod)
phone: z.string()
  .transform((val) => {
    // Normalise en +242XXXXXXXXX
  })
  .refine((val) => /^\+242[0-9]{9}$/.test(val))

// BDD
phone TEXT
```
✅ **Cohérent** : Format normalisé avant insertion

#### Genre
```typescript
// Formulaire (Zod)
gender: z.enum(['M', 'F']).optional()

// BDD
gender TEXT CHECK (gender IN ('M', 'F'))
```
✅ **Cohérent** : Mêmes valeurs autorisées

#### Statut
```typescript
// Formulaire (Zod)
status: z.enum(['active', 'inactive', 'suspended'])

// BDD
status status NOT NULL DEFAULT 'active'
-- Enum: 'active', 'inactive', 'suspended'
```
✅ **Cohérent** : Mêmes valeurs

### 3. Champs Calculés/Auto-remplis

| Champ | Source | Valeur |
|-------|--------|--------|
| `id` | BDD | `uuid_generate_v4()` |
| `school_group_id` | Formulaire | `currentUser?.schoolGroupId` |
| `created_at` | BDD | `NOW()` |
| `updated_at` | BDD | `NOW()` |
| `last_login` | BDD | `NULL` (mis à jour à la connexion) |

✅ **Tous cohérents**

---

## 🔒 Vérification RLS (Row Level Security)

### Politiques Attendues

#### 1. Lecture (SELECT)
```sql
-- L'utilisateur voit son propre profil
CREATE POLICY "users_view_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- L'admin de groupe voit les utilisateurs de son groupe
CREATE POLICY "admin_groupe_view_users"
  ON users FOR SELECT
  USING (
    school_group_id = (
      SELECT school_group_id FROM users 
      WHERE id = auth.uid() AND role = 'admin_groupe'
    )
  );
```

#### 2. Insertion (INSERT)
```sql
-- L'admin de groupe peut créer des utilisateurs dans son groupe
CREATE POLICY "admin_groupe_create_users"
  ON users FOR INSERT
  WITH CHECK (
    school_group_id = (
      SELECT school_group_id FROM users 
      WHERE id = auth.uid() AND role = 'admin_groupe'
    )
  );
```

#### 3. Modification (UPDATE)
```sql
-- L'utilisateur peut modifier son profil
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- L'admin de groupe peut modifier les utilisateurs de son groupe
CREATE POLICY "admin_groupe_update_users"
  ON users FOR UPDATE
  USING (
    school_group_id = (
      SELECT school_group_id FROM users 
      WHERE id = auth.uid() AND role = 'admin_groupe'
    )
  );
```

---

## 📋 Checklist de Cohérence

### Structure
- [x] Table `users` existe
- [x] Tous les champs du formulaire ont une colonne correspondante
- [x] Types de données compatibles
- [x] Contraintes de clés étrangères correctes

### Enum `user_role`
- [ ] ⚠️ **À FAIRE** : Exécuter `ADD_NEW_USER_ROLES.sql`
- [ ] Vérifier que les 15 rôles sont présents
- [ ] Migrer 'documentaliste' vers 'bibliothecaire'

### Validation
- [x] Email : UNIQUE + validation format
- [x] Téléphone : Format +242
- [x] Genre : M ou F
- [x] Statut : active, inactive, suspended
- [x] Rôle : Enum (après migration)

### RLS
- [ ] Vérifier les politiques SELECT
- [ ] Vérifier les politiques INSERT
- [ ] Vérifier les politiques UPDATE
- [ ] Vérifier les politiques DELETE

### Index
- [x] idx_users_email
- [x] idx_users_role
- [x] idx_users_school_group_id
- [x] idx_users_school_id
- [x] idx_users_status

---

## 🚀 Actions Immédiates

### 1. Exécuter la Migration SQL
```bash
# Dans Supabase SQL Editor
# Copier/coller le contenu de :
database/ADD_NEW_USER_ROLES.sql
```

### 2. Vérifier les Rôles
```sql
-- Lister tous les rôles
SELECT enumlabel as role_name
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumlabel;

-- Résultat attendu : 15 rôles
```

### 3. Tester la Création
```typescript
1. Ouvrir le formulaire "Créer un utilisateur"
2. Sélectionner un rôle (ex: Proviseur)
3. Remplir tous les champs
4. Soumettre
5. ✅ Vérifier la création réussie
```

---

## 📊 Résumé

### ✅ Points Positifs
- Structure table `users` complète
- Tous les champs du formulaire mappés
- Validation Zod cohérente avec BDD
- Contraintes FK correctes
- Index de performance présents

### ⚠️ Point Bloquant
**Enum `user_role` incomplet**
- 7 rôles actuels
- 12 rôles nécessaires
- **5 rôles manquants**

### ✅ Solution
**Migration SQL créée** : `ADD_NEW_USER_ROLES.sql`
- Ajoute les 9 nouveaux rôles
- Migre 'documentaliste' → 'bibliothecaire'
- Total final : 15 rôles

---

## 🎯 Prochaine Étape

**EXÉCUTER LA MIGRATION SQL MAINTENANT !**

```sql
-- Copier/coller dans Supabase SQL Editor
-- Fichier : database/ADD_NEW_USER_ROLES.sql
```

Après l'exécution, le formulaire sera 100% cohérent avec la base de données ! 🎉
