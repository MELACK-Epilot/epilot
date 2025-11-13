# 🔍 GUIDE DEBUG - Espace Utilisateur Vide

## 🎯 Problème

Tu es connecté en tant que **Proviseur** mais :
- ❌ L'espace utilisateur est vide
- ❌ Le rôle ne s'affiche pas
- ❌ Aucune fonctionnalité visible

---

## 📋 Étapes de Diagnostic

### Étape 1 : Vérifier la Console Browser

1. **Ouvrir DevTools** (F12)
2. **Aller sur** `/user`
3. **Regarder la Console**

Tu devrais voir :
```
=== USER DASHBOARD DEBUG ===
User: { ... }
Loading: false
Error: null
Role: 'proviseur'
School Group ID: 'xxx-xxx-xxx'
===========================
```

#### ✅ Si tu vois ça :
- User est rempli
- Role = 'proviseur'
- School Group ID renseigné
→ **Le problème est ailleurs**

#### ❌ Si tu vois ça :
```
User: undefined
Loading: false
Error: { message: "..." }
```
→ **Problème de chargement utilisateur**

---

### Étape 2 : Vérifier les Données SQL

1. **Ouvrir Supabase Dashboard**
2. **SQL Editor**
3. **Copier le fichier** `VERIFIER_UTILISATEUR_PROVISEUR.sql`
4. **Remplacer** `REMPLACER_PAR_EMAIL_PROVISEUR@example.com` par ton email
5. **Exécuter** les requêtes une par une

#### Requête 1 : Utilisateur existe ?
```sql
SELECT * FROM users 
WHERE email = 'ton_email@example.com';
```

**Résultat attendu** :
- ✅ 1 ligne retournée
- ✅ `first_name` renseigné
- ✅ `last_name` renseigné
- ✅ `role` = 'proviseur'
- ✅ `school_group_id` renseigné
- ✅ `status` = 'active'

#### Requête 6 : Diagnostic complet
```sql
-- Voir le fichier VERIFIER_UTILISATEUR_PROVISEUR.sql
```

**Résultat attendu** :
```
Utilisateur existe          ✅ OUI
Email renseigné            ✅ OUI
Prénom renseigné           ✅ OUI
Nom renseigné              ✅ OUI
Rôle = proviseur           ✅ OUI
school_group_id renseigné  ✅ OUI
Status = active            ✅ OUI
```

---

### Étape 3 : Corriger les Données (si nécessaire)

#### Si `first_name` ou `last_name` sont NULL :
```sql
UPDATE users
SET 
  first_name = 'Prénom',
  last_name = 'Nom'
WHERE email = 'ton_email@example.com';
```

#### Si `role` n'est pas 'proviseur' :
```sql
UPDATE users
SET role = 'proviseur'
WHERE email = 'ton_email@example.com';
```

#### Si `school_group_id` est NULL :
```sql
-- 1. Trouver l'ID du groupe
SELECT id, name FROM school_groups;

-- 2. Assigner le groupe
UPDATE users
SET school_group_id = 'ID_DU_GROUPE'
WHERE email = 'ton_email@example.com';
```

#### Si `status` n'est pas 'active' :
```sql
UPDATE users
SET status = 'active'
WHERE email = 'ton_email@example.com';
```

---

### Étape 4 : Rafraîchir et Tester

1. **Rafraîchir** la page `/user` (Ctrl+R)
2. **Vérifier** la console
3. **Vérifier** l'affichage

**Tu devrais maintenant voir** :
- ✅ Badge "Proviseur" dans le header
- ✅ 6 widgets (Écoles, Personnel, Emploi, Notifs, Élèves, Budget)
- ✅ Actions rapides (Gérer personnel, Rapports, Stats)
- ✅ Sidebar avec navigation

---

## 🐛 Problèmes Courants

### Problème 1 : User = undefined

**Cause** : `useCurrentUser()` ne retourne pas de données

**Solutions** :
1. Vérifier que l'utilisateur est bien dans la table `users`
2. Vérifier que `id` correspond à l'Auth User ID
3. Vérifier les colonnes : `first_name`, `last_name`, `role`

---

### Problème 2 : Role ne s'affiche pas

**Cause** : `user.role` est `undefined` ou `null`

**Solutions** :
```sql
-- Vérifier le rôle
SELECT role FROM users WHERE email = 'ton_email@example.com';

-- Si NULL, corriger
UPDATE users
SET role = 'proviseur'
WHERE email = 'ton_email@example.com';
```

---

### Problème 3 : Widgets vides

**Cause** : `school_group_id` est `null`

**Solutions** :
```sql
-- Vérifier school_group_id
SELECT school_group_id FROM users WHERE email = 'ton_email@example.com';

-- Si NULL, assigner un groupe
UPDATE users
SET school_group_id = (SELECT id FROM school_groups LIMIT 1)
WHERE email = 'ton_email@example.com';
```

---

### Problème 4 : Erreur "Non authentifié"

**Cause** : Session Supabase expirée

**Solutions** :
1. Se déconnecter
2. Se reconnecter
3. Vérifier que le token est valide

---

## 📊 Checklist Complète

### Données Utilisateur
- [ ] Email correct
- [ ] `first_name` renseigné (pas NULL)
- [ ] `last_name` renseigné (pas NULL)
- [ ] `role` = 'proviseur'
- [ ] `school_id` renseigné (optionnel)
- [ ] `school_group_id` renseigné (OBLIGATOIRE)
- [ ] `status` = 'active'

### Hook useCurrentUser
- [ ] Requête Supabase réussie (pas d'erreur)
- [ ] Données retournées (user !== undefined)
- [ ] Mapping correct (first_name → firstName)

### Dashboard
- [ ] Console affiche les logs de debug
- [ ] `user` est défini
- [ ] `user.role` = 'proviseur'
- [ ] `user.schoolGroupId` renseigné
- [ ] Widgets affichés (6 pour proviseur)

### Sidebar
- [ ] Sidebar visible
- [ ] Badge "Proviseur" affiché
- [ ] Navigation complète
- [ ] Avatar (si renseigné)

---

## 🎯 Résultat Attendu

Une fois tout corrigé, tu devrais voir :

```
┌─────────────────────────────────────────┐
│ Bonjour, Prénom ! 👋                    │
│ [Proviseur] Espace de gestion • E-Pilot│
│                                    [👤] │
└─────────────────────────────────────────┘

Widgets (6) :
[Écoles: 1] [Personnel: 5] [Emploi] [Notifs] [Élèves: 0] [Budget: 0K]

Actions Rapides (3) :
[Gérer personnel] [Valider rapports] [Statistiques]

Activité Récente :
- Activité 1
- Activité 2
- Activité 3
```

---

## 🆘 Si Ça Ne Marche Toujours Pas

### Option 1 : Vérifier les Logs Complets
```typescript
// Dans la console browser
console.log('User complet:', JSON.stringify(user, null, 2));
```

### Option 2 : Tester avec un Autre Utilisateur
Créer un nouvel utilisateur Proviseur avec toutes les données correctes.

### Option 3 : Vérifier les Permissions RLS
```sql
-- Vérifier que l'utilisateur peut lire ses propres données
SELECT * FROM users WHERE id = auth.uid();
```

---

## 📝 Fichiers Utiles

1. **`DEBUG_USER_SPACE.md`** - Analyse complète du problème
2. **`VERIFIER_UTILISATEUR_PROVISEUR.sql`** - Requêtes SQL de vérification
3. **`GUIDE_DEBUG_ESPACE_VIDE.md`** - Ce guide (étapes à suivre)

---

## 🎉 Conclusion

Le problème vient probablement de **données manquantes** dans la table `users` :
- `first_name` ou `last_name` NULL
- `role` NULL ou incorrect
- `school_group_id` NULL

**Suis les étapes ci-dessus pour diagnostiquer et corriger !** 🚀🇨🇬
