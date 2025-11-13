# ✅ SOLUTION ERREUR 400 - TABLE SCHOOLS

## 🔴 Problème

Erreur lors de la création d'une école :
```
Failed to load resource: the server responded with a status of 400
```

## 🔍 Cause

Le champ `admin_id` dans la table `schools` est défini comme **NOT NULL** mais le formulaire envoie une chaîne vide `''` au lieu d'un UUID valide ou NULL.

## ✅ SOLUTION (2 étapes)

### Étape 1 : Modifier la base de données (30 secondes)

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Copier-coller le contenu de :
   ```
   database/FIX_ADMIN_ID_CONSTRAINT.sql
   ```
3. Cliquer **Run**

Ce script va :
- ✅ Rendre la colonne `admin_id` nullable (accepte NULL)
- ✅ Mettre à jour les écoles existantes

### Étape 2 : Code déjà corrigé ✅

Le code TypeScript a été automatiquement corrigé :
- **Avant** : `admin_id: ''` ❌
- **Après** : `admin_id: null` ✅

## 🧪 Test

1. Recharger la page (F5)
2. Créer une nouvelle école :
   - Nom : "École Test Final"
   - Code : "TEST-FINAL"
   - Département : "Brazzaville"
   - Ville : "Brazzaville"
   - Upload un logo
3. Cliquer "Créer l'école"
4. ✅ **Succès attendu** : "École créée avec succès"

## 📊 Vérification

Après avoir exécuté le script SQL, vérifier :

```sql
SELECT 
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'schools'
  AND column_name = 'admin_id';
```

**Résultat attendu** : `is_nullable = YES`

## 🎯 Logique Métier

C'est la **bonne approche** :
1. ✅ L'école est créée **sans directeur** (admin_id = NULL)
2. ✅ Le directeur sera assigné **plus tard** via la page Utilisateurs
3. ✅ Cela respecte la hiérarchie : Admin Groupe → Crée École → Assigne Directeur

## 📝 Résumé

| Avant | Après |
|-------|-------|
| admin_id NOT NULL | admin_id NULL ✅ |
| admin_id = '' | admin_id = null ✅ |
| Erreur 400 ❌ | Création OK ✅ |

**Exécutez le script SQL et tout fonctionnera !** 🚀
