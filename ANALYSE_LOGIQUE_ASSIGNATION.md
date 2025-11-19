# 🔍 ANALYSE LOGIQUE D'ASSIGNATION E-PILOT

## ✅ HIÉRARCHIE RESPECTÉE

### 📋 Hiérarchie Attendue
```
SUPER ADMIN (Plateforme)
    ↓ crée
Groupes Scolaires + Plans + Modules + Catégories
    ↓ attribue plan à
ADMIN DE GROUPE
    ↓ crée
Utilisateurs
    ↓ assigne
Modules/Catégories selon PLAN
    ↓ accèdent
UTILISATEURS (Personnel)
```

---

## ✅ IMPLÉMENTATION ACTUELLE

### 1. **SUPER ADMIN → Crée Modules/Catégories** ✅

**Tables:**
- `modules` (créés par Super Admin)
- `business_categories` (créées par Super Admin)
- `subscription_plans` (créés par Super Admin)
- `plan_modules` (assignation modules → plans)
- `plan_categories` (assignation catégories → plans)

**Logique:** ✅ Correcte
```sql
-- Super Admin crée modules
INSERT INTO modules (name, category_id, status, ...)

-- Super Admin crée catégories
INSERT INTO business_categories (name, icon, color, ...)

-- Super Admin assigne modules aux plans
INSERT INTO plan_modules (plan_id, module_id)

-- Super Admin assigne catégories aux plans
INSERT INTO plan_categories (plan_id, category_id)
```

---

### 2. **ADMIN GROUPE → Voit Modules Selon PLAN** ✅

**Hook:** `useSchoolGroupModules`

**Logique:** ✅ PARFAITE
```typescript
// 1. Récupérer le groupe avec son plan actif
const { data: schoolGroup } = await supabase
  .from('school_groups')
  .select(`
    id,
    subscriptions!inner(
      plan_id,
      status,
      subscription_plans!inner(id, name, slug)
    )
  `)
  .eq('subscriptions.status', 'active')
  .single();

// 2. Récupérer UNIQUEMENT les modules du plan
const { data: planModules } = await supabase
  .from('plan_modules')
  .select(`
    modules!inner(id, name, description, icon, category_id, ...)
  `)
  .eq('plan_id', planId)
  .eq('modules.status', 'active');
```

**✅ Validation:**
- ✅ Admin voit UNIQUEMENT les modules de son plan
- ✅ Pas d'accès aux modules d'autres plans
- ✅ Filtrage par `plan_modules` (table de liaison)
- ✅ Respect strict de l'abonnement actif

---

### 3. **ADMIN GROUPE → Assigne Modules aux Utilisateurs** ✅

**Hook:** `useAssignModule`

**Logique:** ✅ CORRECTE
```typescript
// Assignation via RPC (fonction Postgres)
await supabase.rpc('assign_module_to_user', {
  p_user_id: userId,
  p_module_id: moduleId,
  p_assigned_by: currentUser.id,  // ✅ Traçabilité
  p_can_read: permissions.canRead,
  p_can_write: permissions.canWrite,
  p_can_delete: permissions.canDelete,
  p_can_export: permissions.canExport,
});
```

**Table:** `user_module_permissions`

**✅ Validation:**
- ✅ Admin assigne UNIQUEMENT les modules de son plan
- ✅ Traçabilité avec `assigned_by`
- ✅ Permissions granulaires (read, write, delete, export)
- ✅ Soft delete avec `is_active`

---

### 4. **UTILISATEURS → Accèdent Modules Assignés** ✅

**Hook:** `useUserAssignedModules`

**Logique:** ✅ PARFAITE
```typescript
const { data } = await supabase
  .from('user_module_permissions')
  .select(`
    *,
    module:modules(
      id, name, description, icon,
      category:business_categories(id, name, color)
    )
  `)
  .eq('user_id', userId)
  .eq('is_active', true);  // ✅ Filtre actifs uniquement
```

**✅ Validation:**
- ✅ Utilisateur voit UNIQUEMENT ses modules assignés
- ✅ Pas d'accès aux modules non assignés
- ✅ Filtrage strict par `user_id`
- ✅ Respect du `is_active` (soft delete)

---

## 🔒 SÉCURITÉ & CONTRAINTES

### 1. **Contrainte Plan** ✅

**Problème potentiel:** Admin pourrait assigner un module hors de son plan?

**Solution actuelle:**
```typescript
// useSchoolGroupModules récupère UNIQUEMENT les modules du plan
const { data: planModules } = await supabase
  .from('plan_modules')
  .eq('plan_id', planId);  // ✅ Filtrage strict
```

**UI:** `UserModulesDialogAvailableTab`
```typescript
// Affiche UNIQUEMENT les modules disponibles du plan
modulesData?.availableModules  // ✅ Déjà filtrés par plan
```

**✅ Validation:**
- ✅ Admin ne PEUT PAS assigner un module hors plan (UI)
- ⚠️ MAIS: Pas de validation côté serveur (RPC)

---

### 2. **Validation Côté Serveur** ⚠️ À VÉRIFIER

**Fonction RPC:** `assign_module_to_user`

**Question:** Est-ce que la fonction vérifie que:
1. Le module appartient au plan du groupe de l'admin?
2. L'admin a le droit d'assigner ce module?

**Recommandation:** ✅ Ajouter validation dans RPC
```sql
CREATE OR REPLACE FUNCTION assign_module_to_user(
  p_user_id UUID,
  p_module_id UUID,
  p_assigned_by UUID,
  ...
) RETURNS JSON AS $$
DECLARE
  v_admin_school_group_id UUID;
  v_user_school_group_id UUID;
  v_module_in_plan BOOLEAN;
BEGIN
  -- 1. Vérifier que admin et user sont du même groupe
  SELECT school_group_id INTO v_admin_school_group_id
  FROM users WHERE id = p_assigned_by;
  
  SELECT school_group_id INTO v_user_school_group_id
  FROM users WHERE id = p_user_id;
  
  IF v_admin_school_group_id != v_user_school_group_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Vous ne pouvez assigner que des modules aux utilisateurs de votre groupe'
    );
  END IF;
  
  -- 2. Vérifier que le module est dans le plan du groupe
  SELECT EXISTS(
    SELECT 1 FROM plan_modules pm
    INNER JOIN subscriptions s ON s.plan_id = pm.plan_id
    WHERE s.school_group_id = v_admin_school_group_id
      AND s.status = 'active'
      AND pm.module_id = p_module_id
  ) INTO v_module_in_plan;
  
  IF NOT v_module_in_plan THEN
    RETURN json_build_object(
      'success', false,
      'error', 'MODULE_NOT_IN_PLAN',
      'message', 'Ce module n''est pas inclus dans votre plan'
    );
  END IF;
  
  -- 3. Assigner le module
  INSERT INTO user_module_permissions (...)
  VALUES (...);
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 FLUX COMPLET

### Scénario: Admin Groupe assigne un module

```
1. Admin ouvre modal assignation
   ↓
2. useSchoolGroupModules récupère modules du PLAN
   ├─ Query: school_groups → subscriptions → plan_modules
   └─ Résultat: UNIQUEMENT modules du plan ✅
   ↓
3. Admin sélectionne module(s)
   ↓
4. Admin clique "Assigner"
   ↓
5. useAssignModule appelle RPC
   ├─ assign_module_to_user(userId, moduleId, ...)
   ├─ ⚠️ Validation serveur à vérifier
   └─ INSERT INTO user_module_permissions ✅
   ↓
6. Utilisateur voit le module
   ├─ useUserAssignedModules
   └─ Query: user_module_permissions WHERE user_id ✅
```

---

## ✅ POINTS FORTS

```
✅ Filtrage strict par plan (UI)
✅ Traçabilité (assigned_by)
✅ Permissions granulaires
✅ Soft delete (is_active)
✅ Queries optimisées avec JOINs
✅ Hooks réactifs (React Query)
✅ Invalidation cache automatique
✅ Respect hiérarchie UI
```

---

## ⚠️ POINTS À VÉRIFIER

```
⚠️ Validation côté serveur (RPC)
   → Vérifier que admin et user même groupe
   → Vérifier que module dans plan du groupe
   
⚠️ Gestion erreurs RPC
   → Messages explicites
   → Codes d'erreur standardisés
   
⚠️ Logs d'audit
   → Tracer toutes les assignations
   → Qui a assigné quoi à qui et quand
```

---

## 🎯 RECOMMANDATIONS

### 1. **Renforcer RPC** ⚠️ PRIORITAIRE

```sql
-- Ajouter validations dans assign_module_to_user
1. Vérifier même school_group_id
2. Vérifier module dans plan actif
3. Vérifier permissions admin
4. Logger l'action
```

### 2. **Ajouter Logs d'Audit** 📝

```sql
CREATE TABLE module_assignment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR NOT NULL, -- 'assigned', 'revoked', 'updated'
  user_id UUID REFERENCES users(id),
  module_id UUID REFERENCES modules(id),
  assigned_by UUID REFERENCES users(id),
  school_group_id UUID REFERENCES school_groups(id),
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. **Tests de Sécurité** 🔒

```typescript
// Test: Admin ne peut pas assigner module hors plan
test('Admin cannot assign module outside plan', async () => {
  // 1. Admin avec plan "gratuit"
  // 2. Tenter d'assigner module "premium"
  // 3. Attendre erreur "MODULE_NOT_IN_PLAN"
});

// Test: Admin ne peut pas assigner à user d'autre groupe
test('Admin cannot assign to user from other group', async () => {
  // 1. Admin groupe A
  // 2. User groupe B
  // 3. Attendre erreur "UNAUTHORIZED"
});
```

---

## ✅ CONCLUSION

### Logique Actuelle: **85/100** ⭐⭐⭐⭐

```
✅ Hiérarchie respectée (UI)
✅ Filtrage par plan (UI)
✅ Permissions granulaires
✅ Traçabilité
⚠️ Validation serveur à renforcer
⚠️ Logs d'audit à ajouter
```

### Actions Prioritaires:

1. **🔴 URGENT:** Vérifier/Renforcer RPC `assign_module_to_user`
2. **🟡 IMPORTANT:** Ajouter logs d'audit
3. **🟢 BONUS:** Tests de sécurité

**La logique est BONNE mais nécessite renforcement côté serveur!** 🚀

---

**Développé avec ❤️ pour E-Pilot Congo**  
**Version:** 18.0 Analyse Logique  
**Date:** 16 Novembre 2025  
**Statut:** 🟡 Logique UI Parfaite - Validation Serveur À Renforcer
