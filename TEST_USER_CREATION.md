# Test de création d'utilisateur - Diagnostic complet

**Date** : 4 novembre 2025  
**Objectif** : Identifier et corriger les problèmes de création d'utilisateur

---

## 🔍 Flux de création actuel

```
1. Formulaire (UserFormDialog.tsx)
   ↓ Validation Zod
2. onSubmit()
   ↓ Prépare les données
3. createUser.mutateAsync()
   ↓ Hook useCreateUser
4. Supabase Auth signUp()
   ↓ Crée compte auth
5. Supabase DB insert()
   ↓ Insère dans table users
6. ✅ Succès ou ❌ Erreur
```

---

## 🧪 Test manuel - Étape par étape

### Étape 1 : Ouvrir le formulaire

1. ✅ Aller sur `http://localhost:3000/dashboard/users`
2. ✅ Cliquer sur "Nouvel utilisateur"
3. ✅ Le dialog s'ouvre

**Vérifier dans la console (F12)** :
- Pas d'erreur JavaScript
- Le formulaire se charge

---

### Étape 2 : Remplir le formulaire

**Test A : Créer un Super Admin**

```
Prénom : Test
Nom : SuperAdmin
Email : test.superadmin@epilot.cg
Téléphone : 069698620
Genre : Masculin (optionnel)
Date de naissance : (optionnel)
Rôle : Super Admin E-Pilot
Groupe Scolaire : (désactivé automatiquement)
Mot de passe : Test@1234
☑ Envoyer email de bienvenue
```

**Test B : Créer un Admin Groupe**

```
Prénom : Test
Nom : AdminGroupe
Email : test.admingroupe@epilot.cg
Téléphone : 065432198
Genre : Féminin (optionnel)
Date de naissance : (optionnel)
Rôle : Administrateur de Groupe Scolaire
Groupe Scolaire : [SÉLECTIONNER UN GROUPE]
Mot de passe : Test@1234
☑ Envoyer email de bienvenue
```

---

### Étape 3 : Cliquer sur "➕ Créer"

**Vérifier dans la console (F12)** :

```javascript
// Logs attendus :
🚀 onSubmit appelé avec les valeurs: {...}
📋 Mode: create
👤 User: null
📤 Données à soumettre (création): {...}
```

**Si erreur, noter** :
- Le message d'erreur exact
- Le code d'erreur
- La stack trace

---

## 🐛 Problèmes potentiels identifiés

### Problème 1 : Contraintes CHECK PostgreSQL

**Symptôme** : Erreur lors de l'insertion en base

**Cause** : Les contraintes CHECK ajoutées lors de l'optimisation :
```sql
-- Super admin ne DOIT PAS avoir de school_group_id
CHECK (role != 'super_admin' OR (school_group_id IS NULL AND school_id IS NULL))

-- Admin groupe DOIT avoir un school_group_id
CHECK (role != 'admin_groupe' OR school_group_id IS NOT NULL)
```

**Solution** : ✅ Déjà corrigée dans `useUsers.ts` (lignes 279-292)

---

### Problème 2 : Types ENUM PostgreSQL

**Symptôme** : Erreur "invalid input value for enum"

**Cause** : Les colonnes sont maintenant des ENUM :
- `role` → `user_role` ENUM
- `status` → `user_status` ENUM
- `gender` → `user_gender` ENUM

**Solution** : ✅ Déjà corrigée dans `useUsers.ts`

---

### Problème 3 : Validation du téléphone

**Symptôme** : Erreur "Format invalide"

**Cause** : Le téléphone doit être au format `+242XXXXXXXXX`

**Solution** : ✅ Transformation automatique dans le schéma Zod (lignes 71-102)

---

### Problème 4 : Email déjà utilisé

**Symptôme** : "L'email est déjà utilisé"

**Cause** : Un utilisateur avec cet email existe déjà

**Solution** : Utiliser un email unique ou supprimer l'ancien utilisateur

---

### Problème 5 : Groupe scolaire non sélectionné

**Symptôme** : "Un Administrateur de Groupe doit être associé à un groupe scolaire"

**Cause** : Le champ `schoolGroupId` est vide pour un `admin_groupe`

**Solution** : ✅ Validation côté client (lignes 272-279)

---

## 🔧 Corrections appliquées

### 1. Gestion des contraintes CHECK ✅

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

### 2. Validation des ENUM ✅

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

### 3. Meilleurs messages d'erreur ✅

```typescript
if (error) {
  console.error('Erreur insertion users:', error);
  throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
}
```

---

## 📊 Checklist de vérification

### Avant de créer un utilisateur

- [ ] Le serveur dev est lancé (`npm run dev`)
- [ ] Supabase est accessible
- [ ] La table `users` existe
- [ ] Les ENUM sont créés (`user_role`, `user_status`, `user_gender`)
- [ ] Les contraintes CHECK sont actives
- [ ] Au moins un groupe scolaire existe (pour admin_groupe)

### Pendant la création

- [ ] Le formulaire se charge sans erreur
- [ ] Les champs sont validés en temps réel
- [ ] Le bouton "Créer" est cliquable
- [ ] Les logs console s'affichent

### Après la création

- [ ] Toast de succès s'affiche
- [ ] Le dialog se ferme
- [ ] L'utilisateur apparaît dans la liste
- [ ] Les données sont correctes en base

---

## 🚨 Si ça ne fonctionne toujours pas

### 1. Vérifier la console navigateur (F12)

**Chercher** :
- Erreurs JavaScript (rouge)
- Erreurs Supabase
- Logs de débogage (`console.log`)

**Copier** :
- Le message d'erreur complet
- La stack trace
- Les données envoyées

### 2. Vérifier les logs Supabase

1. Aller sur https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap
2. Cliquer sur "Logs" dans le menu
3. Filtrer par "Postgres Logs"
4. Chercher les erreurs récentes

### 3. Tester l'insertion manuelle en SQL

```sql
-- Test 1 : Créer un Super Admin
INSERT INTO users (
  id, first_name, last_name, email, phone,
  role, status, school_group_id
) VALUES (
  gen_random_uuid(),
  'Test', 'SuperAdmin', 'test.manual@epilot.cg', '+242069698620',
  'super_admin', 'active', NULL
);

-- Test 2 : Créer un Admin Groupe
INSERT INTO users (
  id, first_name, last_name, email, phone,
  role, status, school_group_id
) VALUES (
  gen_random_uuid(),
  'Test', 'AdminGroupe', 'test.manual2@epilot.cg', '+242065432198',
  'admin_groupe', 'active', 
  (SELECT id FROM school_groups LIMIT 1)
);
```

**Si ça fonctionne** : Le problème est dans le code React  
**Si ça échoue** : Le problème est dans la base de données

---

## 📝 Rapport de bug à fournir

Si le problème persiste, fournis-moi :

1. **Message d'erreur exact** (copier-coller)
2. **Logs console** (F12 → Console)
3. **Données du formulaire** (ce que tu as saisi)
4. **Rôle sélectionné** (Super Admin ou Admin Groupe)
5. **Groupe scolaire** (si Admin Groupe)
6. **Capture d'écran** (optionnel)

---

## ✅ Solution finale

Si tout est configuré correctement, la création devrait fonctionner avec ces corrections :

1. ✅ Contraintes CHECK respectées
2. ✅ Types ENUM gérés
3. ✅ Validation complète
4. ✅ Messages d'erreur clairs

**Teste maintenant et dis-moi ce qui se passe !** 🚀
