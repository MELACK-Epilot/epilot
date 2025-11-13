# Guide complet : Créer un utilisateur dans E-Pilot

**Date** : 4 novembre 2025  
**Statut** : ✅ Toutes les corrections appliquées

---

## 🎯 Objectif

Créer un utilisateur (Super Admin ou Admin Groupe) depuis l'interface web sans erreur.

---

## ✅ Prérequis

### 1. Vérifier la base de données

**Exécuter le script de test** et partagez-moi le résultat :

```sql
-- Dans Supabase SQL Editor
-- Copier-coller : database/TEST_USER_CREATION.sql
```

**Résultat attendu** :

```text
✅ ENUM user_role existe
✅ ENUM user_status existe
✅ ENUM user_gender existe
✅ Nombre de contraintes CHECK: 4
✅ Groupes scolaires disponibles: X
✅ Super Admin créé avec succès
✅ Admin Groupe créé avec succès
✅ Contrainte CHECK fonctionne
```

**Si erreurs** : Exécuter `database/OPTIMIZE_USERS_TABLE_FINAL.sql`

### 2. Vérifier qu'un groupe scolaire existe

```sql
SELECT id, name, code FROM school_groups LIMIT 5;
```

**Si vide** : Créer au moins un groupe scolaire depuis `/dashboard/school-groups`

### 3. Vérifier le serveur dev

```bash
npm run dev
# Doit afficher : Local: http://localhost:3000
```

---

## 📋 Étapes de création

### Étape 1 : Ouvrir le formulaire

1. Aller sur <http://localhost:3000/dashboard/users>
2. Cliquer sur **"Nouvel utilisateur"**
3. Le dialog s'ouvre

**✅ Vérifier** : Aucune erreur dans la console (F12)

---

### Étape 2 : Remplir le formulaire

#### Option A : Créer un Super Admin

| Champ | Valeur | Obligatoire |
|-------|--------|-------------|
| **Prénom** | Test | ✅ Oui |
| **Nom** | SuperAdmin | ✅ Oui |
| **Email** | `test.superadmin@epilot.cg` | ✅ Oui |
| **Téléphone** | 069698620 | ✅ Oui |
| **Genre** | Masculin | ❌ Non |
| **Date de naissance** | (vide) | ❌ Non |
| **Rôle** | Super Admin E-Pilot | ✅ Oui |
| **Groupe Scolaire** | (désactivé) | ❌ N/A |
| **Mot de passe** | Test@1234 | ✅ Oui |
| **Email bienvenue** | ☑ Coché | ❌ Non |

**Important** :

- Le champ "Groupe Scolaire" est **automatiquement désactivé** pour Super Admin
- Le mot de passe doit contenir : 8+ caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial

#### Option B : Créer un Admin Groupe

| Champ | Valeur | Obligatoire |
|-------|--------|-------------|
| **Prénom** | Test | ✅ Oui |
| **Nom** | AdminGroupe | ✅ Oui |
| **Email** | `test.admingroupe@epilot.cg` | ✅ Oui |
| **Téléphone** | 065432198 | ✅ Oui |
| **Genre** | Féminin | ❌ Non |
| **Date de naissance** | (vide) | ❌ Non |
| **Rôle** | Administrateur de Groupe Scolaire | ✅ Oui |
| **Groupe Scolaire** | [SÉLECTIONNER] | ✅ **OUI** |
| **Mot de passe** | Test@1234 | ✅ Oui |
| **Email bienvenue** | ☑ Coché | ❌ Non |

**Important** :

- Le champ "Groupe Scolaire" est **OBLIGATOIRE** pour Admin Groupe
- Si aucun groupe n'apparaît, créez-en un d'abord

---

### Étape 3 : Soumettre

1. Cliquer sur **"➕ Créer"**
2. Attendre 2-3 secondes

**✅ Succès** :

- Toast vert : "✅ Utilisateur créé avec succès"
- Le dialog se ferme
- L'utilisateur apparaît dans la liste

**❌ Erreur** : Voir section "Résolution des erreurs" ci-dessous

---

## 🐛 Résolution des erreurs

### Erreur 1 : "L'email est déjà utilisé"

**Cause** : Un utilisateur avec cet email existe déjà

**Solution** :

1. Utiliser un autre email
2. OU supprimer l'ancien utilisateur :

```sql
DELETE FROM users WHERE email = 'test.superadmin@epilot.cg';
```

---

### Erreur 2 : "Un Administrateur de Groupe doit être associé à un groupe scolaire"

**Cause** : Aucun groupe sélectionné pour un admin_groupe

**Solution** :

1. Sélectionner un groupe dans le dropdown
2. Si le dropdown est vide, créer un groupe d'abord

---

### Erreur 3 : "Format invalide" (téléphone)

**Cause** : Le téléphone n'est pas au bon format

**Solution** :

- Saisir **9 chiffres** uniquement : `069698620`
- Le `+242` est ajouté automatiquement
- Formats acceptés : `069698620`, `+242069698620`, `242069698620`

---

### Erreur 4 : "invalid input value for enum"

**Cause** : Les ENUM PostgreSQL ne sont pas créés

**Solution** :

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier : database/OPTIMIZE_USERS_TABLE_FINAL.sql
```

---

### Erreur 5 : "new row violates check constraint"

**Cause** : Les contraintes CHECK ne sont pas respectées

**Solution** : Vérifier que :

- Super Admin : `school_group_id = NULL`
- Admin Groupe : `school_group_id != NULL`

**Déjà corrigé dans le code** ✅

---

### Erreur 6 : "Failed to create user" (générique)

**Cause** : Erreur Supabase Auth ou DB

**Solution** :

1. Ouvrir la console (F12)
2. Chercher l'erreur exacte
3. Vérifier les logs Supabase :
   - <https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap>
   - Onglet "Logs" → "Postgres Logs"

---

## 🔍 Débogage avancé

### Vérifier les logs console

**Ouvrir la console** (F12) et chercher :

```javascript
// Logs attendus :
🚀 onSubmit appelé avec les valeurs: {...}
📋 Mode: create
👤 User: null
📤 Données à soumettre (création): {
  firstName: "Test",
  lastName: "SuperAdmin",
  email: "test.superadmin@epilot.cg",
  phone: "+242069698620",
  role: "super_admin",
  schoolGroupId: undefined,  // undefined pour super_admin
  password: "Test@1234",
  sendWelcomeEmail: true
}
```

**Si erreur** : Noter le message complet et la stack trace

---

### Tester l'insertion manuelle

```sql
-- Test Super Admin
INSERT INTO users (
  id, first_name, last_name, email, phone,
  role, status, school_group_id
) VALUES (
  gen_random_uuid(),
  'Test', 'Manual', 'test.manual@epilot.cg', '+242069698620',
  'super_admin', 'active', NULL
);

-- Test Admin Groupe
INSERT INTO users (
  id, first_name, last_name, email, phone,
  role, status, school_group_id
) VALUES (
  gen_random_uuid(),
  'Test', 'Manual2', 'test.manual2@epilot.cg', '+242065432198',
  'admin_groupe', 'active', 
  (SELECT id FROM school_groups LIMIT 1)
);
```

**Si ça fonctionne** : Le problème est dans le code React  
**Si ça échoue** : Le problème est dans la base de données

---

## ✅ Checklist complète

### Avant de créer

- [ ] Serveur dev lancé (`npm run dev`)
- [ ] Supabase accessible
- [ ] Table `users` existe
- [ ] ENUM créés (`user_role`, `user_status`, `user_gender`)
- [ ] Contraintes CHECK actives
- [ ] Au moins 1 groupe scolaire existe (pour admin_groupe)

### Pendant la création

- [ ] Formulaire se charge sans erreur
- [ ] Tous les champs obligatoires remplis
- [ ] Email unique (pas déjà utilisé)
- [ ] Téléphone au bon format
- [ ] Groupe sélectionné (si admin_groupe)
- [ ] Mot de passe valide (8+ car, maj, min, chiffre, spécial)

### Après la création

- [ ] Toast de succès affiché
- [ ] Dialog fermé
- [ ] Utilisateur dans la liste
- [ ] Données correctes en base

---

## 📊 Corrections déjà appliquées

### 1. Gestion des contraintes CHECK ✅

**Fichier** : `src/features/dashboard/hooks/useUsers.ts` (lignes 279-292)

```typescript
if (input.role === 'admin_groupe') {
  if (!input.schoolGroupId || input.schoolGroupId === '') {
    throw new Error('Un Administrateur de Groupe doit être associé à un groupe scolaire');
  }
  insertData.school_group_id = input.schoolGroupId;
} else if (input.role === 'super_admin') {
  insertData.school_group_id = null;
}
```

### 2. Validation des ENUM ✅

```typescript
if (input.gender && (input.gender === 'M' || input.gender === 'F')) {
  insertData.gender = input.gender;
}
```

### 3. Accessibilité ✅

**Fichier** : `src/features/dashboard/components/UserFormDialog.tsx`

- Tous les `SelectTrigger` ont des `aria-label`
- Bouton toggle password a un `aria-label`
- Input file a un `aria-label`

### 4. Messages d'erreur clairs ✅

```typescript
if (error) {
  console.error('Erreur insertion users:', error);
  throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
}
```

---

## 📁 Fichiers modifiés

1. ✅ `src/features/dashboard/hooks/useUsers.ts` - Logique de création
2. ✅ `src/features/dashboard/components/UserFormDialog.tsx` - Formulaire
3. ✅ `src/features/dashboard/components/AvatarUpload.tsx` - Upload avatar
4. ✅ `database/OPTIMIZE_USERS_TABLE_FINAL.sql` - Optimisation BDD
5. ✅ `database/TEST_USER_CREATION.sql` - Script de test

---

## 🚀 Si tout est OK

**La création devrait fonctionner maintenant !**

1. Ouvrir <http://localhost:3000/dashboard/users>
2. Cliquer sur "Nouvel utilisateur"
3. Remplir le formulaire
4. Cliquer sur "➕ Créer"
5. ✅ Succès !

---

## 📞 Support

**Si le problème persiste**, fournissez-moi :

1. **Message d'erreur exact** (console F12)
2. **Logs Supabase** (Dashboard → Logs)
3. **Données du formulaire** (ce que vous avez saisi)
4. **Résultat du script** `TEST_USER_CREATION.sql`
5. **Capture d'écran** (optionnel)

---

## 🎉 Conclusion

Toutes les corrections ont été appliquées. La création d'utilisateurs devrait fonctionner parfaitement maintenant !

**Teste et dis-moi ce qui se passe !** 🚀
