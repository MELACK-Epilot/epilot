# 🔍 DIAGNOSTIC COMPLET - "MES MODULES" ADMIN GROUPE

## 📊 PROBLÈME IDENTIFIÉ

**Symptômes observés** :
- ✅ Plan "Pro" visible dans l'interface
- ❌ 0 Modules Disponibles affiché
- ❌ 0 Catégories Métiers affiché
- ❌ Message "Aucun module trouvé"

## 🔧 CAUSE RACINE

Les hooks `useUserModules` et `useUserCategories` récupèrent **TOUS** les modules globalement, mais ne filtrent **PAS** selon l'abonnement du groupe scolaire.

### Problème dans le code actuel :

```typescript
// ❌ PROBLÈME : Récupère TOUS les modules
const { data, error } = await supabase
  .from('modules')  // ❌ Table incorrecte
  .select(...)
  .eq('status', 'active')  // ❌ Pas de filtre par groupe
```

### Solution implémentée :

```typescript
// ✅ SOLUTION : Récupère modules du groupe via group_module_configs
const { data: groupModules, error } = await supabase
  .from('group_module_configs')  // ✅ Table correcte
  .select(`
    is_enabled,
    module:business_modules(...)  // ✅ Jointure avec modules
  `)
  .eq('school_group_id', user.schoolGroupId)  // ✅ Filtre par groupe
```

## 📁 FICHIERS CRÉÉS

### 1. **Nouveaux hooks Admin Groupe**

#### `useAdminGroupModules.ts`
- ✅ Récupère modules via `group_module_configs`
- ✅ Filtre par `school_group_id`
- ✅ Jointure avec `business_modules` et `business_categories`
- ✅ Inclut statut `is_enabled`
- ✅ Hook `useToggleGroupModule()` pour activer/désactiver

#### `useAdminGroupCategories.ts`
- ✅ Récupère catégories avec modules du groupe
- ✅ Compte modules par catégorie
- ✅ Statistiques enabled/disabled

### 2. **Nouveau composant**

#### `MyModulesAdminGroup.tsx`
- ✅ Interface spécifique Admin Groupe
- ✅ 4 KPIs avec vraies données
- ✅ Switch pour activer/désactiver modules
- ✅ Filtres avancés (statut, catégorie, recherche)
- ✅ Design cohérent avec le reste de l'app

### 3. **Router dans MyModules.tsx**
```typescript
if (user?.role === 'admin_groupe') {
  return <MyModulesAdminGroup />;
}
```

## 🗄️ STRUCTURE BASE DE DONNÉES

### Tables impliquées :

1. **`school_groups`** : Groupes scolaires avec `plan_id`
2. **`plans`** : Plans d'abonnement (Gratuit, Premium, Pro, etc.)
3. **`plan_modules`** : Modules inclus dans chaque plan
4. **`group_module_configs`** : Modules assignés à chaque groupe (avec `is_enabled`)
5. **`business_modules`** : Modules disponibles
6. **`business_categories`** : Catégories de modules

### Flux de données :

```
Groupe → Plan → Modules du plan → group_module_configs → Interface Admin
```

## 🧪 TESTS À EFFECTUER

### 1. **Exécuter le diagnostic SQL**
```sql
-- Fichier : database/TEST_MES_MODULES_ADMIN_GROUPE.sql
-- Vérifier :
-- - Utilisateur admin_groupe existe
-- - Groupe a un plan assigné
-- - Plan a des modules
-- - group_module_configs contient les modules
```

### 2. **Tester l'interface**
```bash
npm run dev
# Se connecter en tant qu'Admin Groupe
# Aller sur /mes-modules
# Vérifier les KPIs et modules
```

## 🔧 CORRECTIONS POSSIBLES

### Si aucun module n'apparaît :

#### **Problème 1 : group_module_configs vide**
```sql
-- Vérifier si la table est vide
SELECT COUNT(*) FROM group_module_configs 
WHERE school_group_id = 'YOUR_GROUP_ID';

-- Si vide, exécuter le trigger d'assignation automatique
SELECT auto_assign_modules_to_group('YOUR_GROUP_ID');
```

#### **Problème 2 : Plan non assigné au groupe**
```sql
-- Vérifier le plan du groupe
SELECT sg.name, sg.plan_id, p.name as plan_name
FROM school_groups sg
LEFT JOIN plans p ON sg.plan_id = p.id
WHERE sg.id = 'YOUR_GROUP_ID';

-- Si plan_id est NULL, assigner un plan
UPDATE school_groups 
SET plan_id = (SELECT id FROM plans WHERE slug = 'pro')
WHERE id = 'YOUR_GROUP_ID';
```

#### **Problème 3 : Modules pas dans le plan**
```sql
-- Vérifier les modules du plan
SELECT p.name, COUNT(pm.module_id) as module_count
FROM plans p
LEFT JOIN plan_modules pm ON p.id = pm.plan_id
WHERE p.slug = 'pro'
GROUP BY p.id, p.name;

-- Si aucun module, les ajouter au plan
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  (SELECT id FROM plans WHERE slug = 'pro'),
  id
FROM business_modules 
WHERE status = 'active';
```

## 📋 CHECKLIST VALIDATION

### ✅ Code
- [x] Hook `useAdminGroupModules` créé
- [x] Hook `useAdminGroupCategories` créé  
- [x] Composant `MyModulesAdminGroup` créé
- [x] Router dans `MyModules.tsx` ajouté
- [x] Script de test SQL créé

### ⏳ Base de données (à vérifier)
- [ ] Utilisateur admin_groupe existe
- [ ] Groupe a un plan assigné
- [ ] Plan contient des modules
- [ ] `group_module_configs` contient les modules du groupe
- [ ] Modules et catégories sont actifs

### ⏳ Interface (à tester)
- [ ] Page se charge sans erreur
- [ ] KPIs affichent les bonnes données
- [ ] Modules s'affichent
- [ ] Filtres fonctionnent
- [ ] Switch activation/désactivation fonctionne

## 🚀 PROCHAINES ÉTAPES

1. **Exécuter le diagnostic SQL** : `TEST_MES_MODULES_ADMIN_GROUPE.sql`
2. **Corriger les données manquantes** selon les résultats
3. **Tester l'interface** avec un utilisateur Admin Groupe
4. **Valider les fonctionnalités** (filtres, activation/désactivation)

## 📞 SUPPORT

Si le problème persiste :
1. Vérifier les logs console (erreurs Supabase)
2. Vérifier les permissions RLS sur les tables
3. Vérifier que l'utilisateur a bien `role = 'admin_groupe'`
4. Vérifier que `schoolGroupId` est bien défini dans le store auth

---

**Date** : 11 novembre 2025  
**Statut** : ✅ SOLUTION IMPLÉMENTÉE - À TESTER  
**Fichiers modifiés** : 4 créés, 1 modifié
