# 🔍 Diagnostic - Problème de Rôle Proviseur

## ❌ Problème Identifié

**Symptôme** : Un utilisateur avec le rôle `proviseur` se retrouve dans l'espace comptable au lieu du Dashboard Proviseur.

---

## 🔎 Causes Possibles

### 1. **Rôle Mal Écrit dans la Base de Données**

Le rôle dans Supabase pourrait être mal orthographié :
- ❌ `Proviseur` (majuscule)
- ❌ `PROVISEUR` (tout en majuscules)
- ❌ `proviseur ` (avec espace)
- ✅ `proviseur` (correct)

### 2. **Utilisateur Sans school_id**

Le proviseur doit avoir un `school_id` défini pour accéder au dashboard.

### 3. **Cache Navigateur**

Le navigateur pourrait avoir mis en cache l'ancien rôle.

---

## ✅ Solution - Vérification et Correction

### Étape 1 : Vérifier le Rôle dans Supabase

```sql
-- Vérifier le rôle exact de l'utilisateur
SELECT 
  id,
  email,
  role,
  school_id,
  status,
  LENGTH(role) as role_length,
  ASCII(SUBSTRING(role FROM 1 FOR 1)) as first_char_ascii
FROM users 
WHERE email = 'votre-email@test.com';
```

**Résultat attendu** :
```
role: proviseur
role_length: 9
first_char_ascii: 112 (lettre 'p' minuscule)
school_id: [un UUID valide]
status: active
```

---

### Étape 2 : Corriger le Rôle si Nécessaire

```sql
-- Si le rôle est mal écrit, le corriger
UPDATE users 
SET role = 'proviseur'
WHERE email = 'votre-email@test.com';

-- Vérifier que school_id est défini
UPDATE users 
SET school_id = 'your-school-id'
WHERE email = 'votre-email@test.com' 
AND school_id IS NULL;
```

---

### Étape 3 : Vérifier la Configuration de l'École

```sql
-- Vérifier que l'école existe et a des niveaux actifs
SELECT 
  id,
  name,
  has_preschool,
  has_primary,
  has_middle,
  has_high,
  status
FROM schools 
WHERE id = 'your-school-id';
```

**Au moins un niveau doit être `true`** :
```
has_primary: true
has_middle: true
```

---

### Étape 4 : Nettoyer le Cache

1. **Déconnexion complète** :
   - Cliquer sur "Se déconnecter"
   - Ou aller sur `/logout`

2. **Vider le cache navigateur** :
   - Chrome/Edge : `Ctrl + Shift + Delete`
   - Cocher "Cookies" et "Données en cache"
   - Cliquer sur "Effacer"

3. **Fermer et rouvrir le navigateur**

4. **Se reconnecter**

---

## 🔧 Script de Correction Complet

```sql
-- ============================================================================
-- SCRIPT DE CORRECTION - PROVISEUR
-- ============================================================================

-- 1. Vérifier l'utilisateur actuel
SELECT 
  id,
  email,
  role,
  school_id,
  status,
  created_at
FROM users 
WHERE email = 'VOTRE_EMAIL@test.com';

-- 2. Corriger le rôle (forcer minuscules, sans espaces)
UPDATE users 
SET 
  role = TRIM(LOWER('proviseur')),
  status = 'active'
WHERE email = 'VOTRE_EMAIL@test.com';

-- 3. Vérifier que school_id est défini
-- Remplacer 'YOUR_SCHOOL_ID' par l'ID réel de votre école
UPDATE users 
SET school_id = 'YOUR_SCHOOL_ID'
WHERE email = 'VOTRE_EMAIL@test.com' 
AND (school_id IS NULL OR school_id = '');

-- 4. Vérifier l'école
SELECT * FROM schools WHERE id = 'YOUR_SCHOOL_ID';

-- 5. Activer au moins un niveau dans l'école
UPDATE schools 
SET 
  has_primary = true,
  has_middle = true
WHERE id = 'YOUR_SCHOOL_ID';

-- 6. Vérification finale
SELECT 
  u.email,
  u.role,
  u.school_id,
  s.name as school_name,
  s.has_preschool,
  s.has_primary,
  s.has_middle,
  s.has_high
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
WHERE u.email = 'VOTRE_EMAIL@test.com';
```

---

## 🎯 Vérification du Routing

### Code de Vérification dans `UserDashboard.tsx`

Le code actuel (lignes 644-646) :
```typescript
if (['proviseur', 'directeur', 'directeur_etudes'].includes(user.role)) {
  return <DirectorDashboardOptimized />;
}
```

**Ce code est CORRECT** ✅

### Ajout de Logs de Débogage

Pour diagnostiquer le problème en temps réel, ajoutons des logs :

```typescript
// Dans UserDashboard.tsx, ligne 642
console.log('🔍 UserDashboard - Rôle détecté:', {
  role: user.role,
  roleType: typeof user.role,
  roleLength: user.role?.length,
  isProviseur: user.role === 'proviseur',
  includesProviseur: ['proviseur', 'directeur', 'directeur_etudes'].includes(user.role),
  schoolId: user.schoolId,
});
```

---

## 📊 Checklist de Vérification

Cochez chaque élément après vérification :

### Base de Données
- [ ] Rôle = `proviseur` (exactement, minuscules, sans espaces)
- [ ] `school_id` défini et valide
- [ ] `status` = `active`
- [ ] École existe dans table `schools`
- [ ] Au moins un niveau actif dans l'école

### Application
- [ ] Cache navigateur vidé
- [ ] Déconnexion/Reconnexion effectuée
- [ ] Console navigateur ouverte (F12)
- [ ] Logs de débogage visibles

### Résultat Attendu
- [ ] Redirection vers `/user` après connexion
- [ ] Affichage de `DirectorDashboardOptimized`
- [ ] KPIs globaux visibles
- [ ] Sections par niveau visibles
- [ ] Pas d'alerte "Données de démonstration"

---

## 🐛 Si le Problème Persiste

### Vérifier les Logs Console

Ouvrez la console navigateur (F12) et cherchez :

```javascript
// Logs de RoleBasedRedirect
🔄 RoleBasedRedirect: {
  path: "/user",
  user: "proviseur@test.com",
  isAuthenticated: true,
  isLoading: false
}

// Logs de UserDashboard
🔍 UserDashboard - Rôle détecté: {
  role: "proviseur",
  roleType: "string",
  roleLength: 9,
  isProviseur: true,
  includesProviseur: true,
  schoolId: "xxx-xxx-xxx"
}
```

### Vérifier le Hook useCurrentUser

```typescript
// Dans la console navigateur
// Vérifier les données utilisateur
localStorage.getItem('supabase.auth.token')
```

---

## 🚀 Solution Rapide

Si vous voulez tester rapidement :

### 1. Créer un Nouveau Proviseur de Test

```sql
-- Supprimer l'ancien utilisateur problématique
DELETE FROM users WHERE email = 'proviseur@test.com';

-- Créer un nouveau proviseur propre
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  school_id,
  status
) VALUES (
  'new-auth-user-id',
  'proviseur.test@ecole.com',
  'Test',
  'Proviseur',
  'proviseur',
  'your-school-id',
  'active'
);
```

### 2. Créer le Compte Auth dans Supabase

1. Aller dans `Authentication` → `Users`
2. Créer un utilisateur avec email `proviseur.test@ecole.com`
3. Noter l'ID généré
4. Mettre à jour la table `users` avec cet ID

### 3. Se Connecter avec le Nouveau Compte

---

## 📝 Rapport de Diagnostic

Après avoir exécuté les vérifications, remplissez ce rapport :

```
Date: _______________
Utilisateur testé: _______________

Vérifications BDD:
- Rôle dans users: _______________
- school_id défini: [ ] Oui [ ] Non
- École existe: [ ] Oui [ ] Non
- Niveaux actifs: _______________

Vérifications Application:
- Cache vidé: [ ] Oui [ ] Non
- Logs console visibles: [ ] Oui [ ] Non
- Rôle détecté correctement: [ ] Oui [ ] Non

Résultat:
- Dashboard affiché: _______________
- Problème résolu: [ ] Oui [ ] Non

Notes:
_________________________________
_________________________________
```

---

## 🎯 Résultat Final Attendu

Après correction, vous devriez voir :

```
┌─────────────────────────────────────────────────┐
│  🏫 École Charles Zackama                       │
│  Sembé, Congo                                   │
│  [En temps réel]                                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         📊 Vue d'Ensemble École                 │
│  625 élèves | 31 classes | 50 profs | 85%      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📗 PRIMAIRE              💰 1.80M  [✓ Performant]│
│ 180 élèves • 8 classes • 12 enseignants         │
├─────────────────────────────────────────────────┤
│ [👥 180↗️] [📚 8↗️] [👨‍🏫 12→] [🎯 87%↗️]        │
└─────────────────────────────────────────────────┘
```

---

**Date**: 15 novembre 2025  
**Version**: 2.1.0  
**Statut**: Guide de Diagnostic
