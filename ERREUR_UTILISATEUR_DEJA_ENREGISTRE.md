# ❌ Erreur - Utilisateur Déjà Enregistré

## ⚠️ Erreur Rencontrée

```
AuthApiError: User already registered
Failed to load resource: the server responded with a status of 422
```

**Cause :** L'email que vous essayez d'utiliser existe déjà dans Supabase Auth.

---

## ✅ Solutions

### **Solution 1 : Utiliser un Email Différent** (Recommandé)

**Essayez avec un nouvel email :**
- `admin.test@gse.cg`
- `jean.dupont2@test.cg`
- `nouveau.admin@test.cg`
- `admin.groupe@lamarelle.cg`

**Format requis :**
- Doit se terminer par `.cg` ou `.com`
- Format : `nom.prenom@domaine.cg`

---

### **Solution 2 : Supprimer l'Utilisateur Existant**

#### **Via Supabase Dashboard (Interface)**

1. Ouvrir **Supabase Dashboard**
2. Aller dans **Authentication** → **Users**
3. Chercher l'email `jean.dupont@test.cg`
4. Cliquer sur les **3 points** (⋮) à droite
5. Sélectionner **"Delete User"**
6. Confirmer la suppression
7. Retourner sur E-Pilot et réessayer

#### **Via SQL (Plus Rapide)**

**Exécutez dans Supabase SQL Editor :**

```sql
-- Vérifier les utilisateurs existants
SELECT id, email, raw_user_meta_data->>'role' as role, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Supprimer un utilisateur spécifique
-- ⚠️ ATTENTION : Suppression définitive !
DELETE FROM auth.users WHERE email = 'jean.dupont@test.cg';

-- Vérifier la suppression
SELECT COUNT(*) FROM auth.users WHERE email = 'jean.dupont@test.cg';
-- Devrait retourner 0
```

---

### **Solution 3 : Nettoyer les Utilisateurs de Test**

**Si vous avez créé plusieurs utilisateurs de test :**

```sql
-- Lister tous les utilisateurs de test
SELECT id, email, created_at 
FROM auth.users 
WHERE email LIKE '%test%' OR email LIKE '%@test.cg'
ORDER BY created_at DESC;

-- Supprimer tous les utilisateurs de test
-- ⚠️ ATTENTION : Vérifiez bien la liste avant !
DELETE FROM auth.users 
WHERE email LIKE '%@test.cg';
```

---

## ✅ Amélioration Appliquée

### **Message d'Erreur Plus Clair**

**Fichier :** `src/features/dashboard/hooks/useUsers.ts` (ligne 163-169)

**Avant :**
```typescript
if (authError) throw authError;
```

**Après :**
```typescript
if (authError) {
  // Message d'erreur plus clair
  if (authError.message.includes('already registered') || 
      authError.message.includes('already exists')) {
    throw new Error(`L'email ${input.email} est déjà utilisé. Veuillez utiliser un autre email.`);
  }
  throw authError;
}
```

**Effet :**
- ✅ Message d'erreur en français
- ✅ Indique clairement quel email est problématique
- ✅ Suggère d'utiliser un autre email

---

## 🧪 Test Après Correction

### **Étapes :**

1. ✅ Supprimer l'utilisateur existant (Solution 2)
   OU
   Utiliser un nouvel email (Solution 1)

2. ✅ Ouvrir le formulaire "Créer un Administrateur de Groupe"

3. ✅ Remplir avec un **nouvel email** :
   - Prénom : `Marie`
   - Nom : `Martin`
   - Email : `marie.martin@gse.cg` ✅ (NOUVEAU)
   - Téléphone : `+242065432109`
   - Groupe : `Groupe Scolaire Excellence`
   - Mot de passe : `Test1234!`

4. ✅ Cliquer sur "Créer"

**Résultat attendu :**
```
✅ Toast : "Administrateur de Groupe créé avec succès"
✅ Description : "Marie Martin a été ajouté"
✅ Utilisateur visible dans la liste
```

---

## 🔍 Vérification des Utilisateurs Existants

### **Requête SQL :**

```sql
-- Lister tous les utilisateurs
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'first_name' as first_name,
  u.raw_user_meta_data->>'last_name' as last_name,
  u.raw_user_meta_data->>'role' as role,
  u.created_at
FROM auth.users u
ORDER BY u.created_at DESC;
```

**Résultat attendu :**
```
id                                   | email                  | first_name | last_name | role         | created_at
-------------------------------------|------------------------|------------|-----------|--------------|-------------------
uuid-1                               | jean.dupont@test.cg    | Jean       | Dupont    | admin_groupe | 2025-01-30 ...
```

---

## 📋 Checklist de Résolution

- [ ] ✅ Identifier l'email qui pose problème
- [ ] ✅ Choisir une solution :
  - [ ] Option A : Utiliser un nouvel email
  - [ ] Option B : Supprimer l'utilisateur existant
- [ ] ✅ Si Option B : Exécuter le SQL de suppression
- [ ] ✅ Vérifier que l'email n'existe plus
- [ ] ✅ Réessayer la création avec le même email OU un nouvel email
- [ ] ✅ Vérifier le toast de succès
- [ ] ✅ Vérifier que l'utilisateur apparaît dans la liste

---

## 🎯 Prévention Future

### **Bonnes Pratiques :**

1. **Utiliser des emails uniques**
   - Format : `prenom.nom@groupe.cg`
   - Exemple : `marie.martin@gse.cg`

2. **Vérifier avant de créer**
   ```sql
   SELECT email FROM auth.users WHERE email = 'nouvel.email@test.cg';
   ```

3. **Nettoyer régulièrement les utilisateurs de test**
   ```sql
   DELETE FROM auth.users WHERE email LIKE '%@test.cg';
   ```

4. **Utiliser un domaine de test dédié**
   - Développement : `@test.cg`
   - Production : `@gse.cg`, `@lamarelle.cg`, etc.

---

## 📊 Emails Suggérés pour les Tests

**Groupe Scolaire Excellence (GSE-001) :**
- `admin.gse@gse.cg`
- `directeur@gse.cg`
- `admin.groupe@gse.cg`

**LAMARELLE (AUTO) :**
- `admin.lamarelle@lamarelle.cg`
- `directeur@lamarelle.cg`
- `admin.groupe@lamarelle.cg`

**École Communautaire Dolisie (ECD-003) :**
- `admin.ecd@ecd.cg`
- `directeur@ecd.cg`
- `admin.groupe@ecd.cg`

**Réseau Éducatif Moderne (REM-002) :**
- `admin.rem@rem.cg`
- `directeur@rem.cg`
- `admin.groupe@rem.cg`

---

## 🚀 Action Immédiate

### **Choisissez une option :**

#### **Option A : Nouvel Email (Rapide)**
1. Utiliser `admin.test2@gse.cg`
2. Remplir le formulaire
3. Créer l'utilisateur

#### **Option B : Supprimer l'Ancien (Propre)**
1. Exécuter dans Supabase :
   ```sql
   DELETE FROM auth.users WHERE email = 'jean.dupont@test.cg';
   ```
2. Réessayer avec le même email

---

## ✅ Résultat Attendu

**Après correction :**

**Console (F12) :**
```
🚀 onSubmit appelé avec les valeurs: { email: "marie.martin@gse.cg", ... }
✅ Utilisateur créé avec succès
```

**Interface :**
```
✅ Toast vert : "Administrateur de Groupe créé avec succès"
✅ Description : "Marie Martin a été ajouté"
✅ Redirection vers la liste
✅ Nouvel utilisateur visible dans le tableau
```

---

**Utilisez un nouvel email ou supprimez l'ancien, puis réessayez !** ✅🚀
