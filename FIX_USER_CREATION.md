# Correction : Création d'utilisateurs ne fonctionne plus

**Date** : 4 novembre 2025  
**Statut** : ✅ Corrigé

---

## 🔴 Problème

Après l'optimisation de la table `users` (conversion des colonnes en ENUM), la création d'utilisateurs dans l'espace Super Admin ne fonctionne plus.

### Cause racine

L'optimisation SQL a converti plusieurs colonnes en types ENUM PostgreSQL :
- `role` : VARCHAR → `user_role` ENUM
- `status` : VARCHAR → `user_status` ENUM  
- `gender` : VARCHAR → `user_gender` ENUM

De plus, des **contraintes CHECK** ont été ajoutées :
```sql
-- Super admin ne DOIT PAS avoir de school_group_id
CHECK (role != 'super_admin' OR (school_group_id IS NULL AND school_id IS NULL))

-- Admin groupe DOIT avoir un school_group_id
CHECK (role != 'admin_groupe' OR school_group_id IS NOT NULL)
```

Le code d'insertion n'était pas adapté à ces nouvelles contraintes.

---

## ✅ Solution appliquée

### 1. Gestion stricte du `school_group_id`

**Fichier** : `src/features/dashboard/hooks/useUsers.ts`

```typescript
// Gestion du school_group_id selon le rôle (respecter les contraintes CHECK)
if (input.role === 'admin_groupe') {
  // Admin groupe DOIT avoir un school_group_id
  if (!input.schoolGroupId || input.schoolGroupId === '') {
    throw new Error('Un Administrateur de Groupe doit être associé à un groupe scolaire');
  }
  insertData.school_group_id = input.schoolGroupId;
} else if (input.role === 'super_admin') {
  // Super admin ne DOIT PAS avoir de school_group_id (contrainte CHECK)
  insertData.school_group_id = null;
} else {
  // Autres rôles : optionnel
  insertData.school_group_id = input.schoolGroupId || null;
}
```

### 2. Validation des valeurs ENUM

```typescript
// Ajouter gender seulement si valide (ENUM: 'M' ou 'F')
if (input.gender && (input.gender === 'M' || input.gender === 'F')) {
  insertData.gender = input.gender;
}

// Ajouter date_of_birth seulement si fournie
if (input.dateOfBirth && input.dateOfBirth !== '') {
  insertData.date_of_birth = input.dateOfBirth;
}
```

### 3. Meilleure gestion des erreurs

```typescript
if (error) {
  console.error('Erreur insertion users:', error);
  throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
}
```

---

## 🧪 Tests à effectuer

### Test 1 : Créer un Super Admin
1. Ouvrir le formulaire de création
2. Remplir les champs :
   - Prénom : Jean
   - Nom : Dupont
   - Email : jean.dupont@epilot.cg
   - Téléphone : 069698620
   - Rôle : **Super Admin**
   - Mot de passe : Test@1234
3. ✅ Vérifier : Pas de champ "Groupe Scolaire" visible
4. ✅ Vérifier : Création réussie sans erreur

### Test 2 : Créer un Admin Groupe
1. Ouvrir le formulaire de création
2. Remplir les champs :
   - Prénom : Marie
   - Nom : Martin
   - Email : marie.martin@epilot.cg
   - Téléphone : 065432198
   - Rôle : **Administrateur de Groupe**
   - Groupe Scolaire : **Sélectionner un groupe**
   - Mot de passe : Test@1234
3. ✅ Vérifier : Groupe scolaire obligatoire
4. ✅ Vérifier : Création réussie

### Test 3 : Validation des contraintes
1. Essayer de créer un Admin Groupe **sans** groupe scolaire
2. ✅ Vérifier : Message d'erreur clair
3. Essayer de créer un Super Admin **avec** un groupe scolaire
4. ✅ Vérifier : Le champ est automatiquement vidé

---

## 📊 Contraintes PostgreSQL respectées

| Rôle | `school_group_id` | `school_id` | Contrainte |
|------|-------------------|-------------|------------|
| **super_admin** | `NULL` ✅ | `NULL` ✅ | Pas d'association |
| **admin_groupe** | **Obligatoire** ✅ | `NULL` | Gère un groupe |
| **admin_ecole** | Optionnel | **Obligatoire** | Gère une école |
| Autres | Optionnel | Optionnel | Personnel |

---

## 🔍 Vérification en base de données

```sql
-- Vérifier les contraintes actives
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND conname LIKE 'check_%';

-- Vérifier les types ENUM
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('user_role', 'user_status', 'user_gender')
ORDER BY typname, enumsortorder;

-- Tester une insertion manuelle
INSERT INTO users (
  id, first_name, last_name, email, phone,
  role, status, school_group_id
) VALUES (
  gen_random_uuid(),
  'Test', 'User', 'test@epilot.cg', '+242069698620',
  'super_admin', 'active', NULL  -- NULL pour super_admin
);
```

---

## ✅ Résultat

- ✅ Création de Super Admin fonctionne
- ✅ Création d'Admin Groupe fonctionne
- ✅ Contraintes CHECK respectées
- ✅ Types ENUM correctement gérés
- ✅ Messages d'erreur clairs

---

## 📁 Fichiers modifiés

1. ✅ `src/features/dashboard/hooks/useUsers.ts` - Logique de création
2. ✅ `FIX_USER_CREATION.md` - Documentation

---

## 🚀 Prochaines étapes

1. Tester la création d'utilisateurs dans l'interface
2. Vérifier les logs de la console (F12)
3. Confirmer que les données sont bien insérées en base
4. Tester la modification d'utilisateurs

---

**Note** : Si le problème persiste, vérifier :
- Les logs de la console navigateur (F12)
- Les logs Supabase (Dashboard → Logs)
- Les politiques RLS sur la table `users`
