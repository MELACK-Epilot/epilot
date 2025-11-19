# 🔴 RECOMMANDATIONS SÉCURITÉ URGENTES

## ⚠️ PROBLÈME CRITIQUE DÉTECTÉ

### Fonction RPC Manquante ❌

**Code actuel:**
```typescript
// useUserAssignedModules.ts - Ligne 95
await supabase.rpc('assign_module_to_user', {
  p_user_id: userId,
  p_module_id: moduleId,
  ...
});
```

**Problème:** ❌ La fonction `assign_module_to_user` n'existe PAS dans la base de données!

**Impact:**
- ❌ Assignations échouent silencieusement
- ❌ Pas de validation côté serveur
- ❌ Risque de sécurité

---

## 🔴 SOLUTION URGENTE

### Option 1: Créer la Fonction RPC (RECOMMANDÉ) ✅

```sql
-- Migration: create_assign_module_function.sql

CREATE OR REPLACE FUNCTION assign_module_to_user(
  p_user_id UUID,
  p_module_id UUID,
  p_assigned_by UUID,
  p_can_read BOOLEAN DEFAULT true,
  p_can_write BOOLEAN DEFAULT false,
  p_can_delete BOOLEAN DEFAULT false,
  p_can_export BOOLEAN DEFAULT false,
  p_valid_until TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_admin_school_group_id UUID;
  v_user_school_group_id UUID;
  v_module_in_plan BOOLEAN;
  v_assignment_id UUID;
BEGIN
  -- 1. Récupérer le groupe de l'admin
  SELECT school_group_id INTO v_admin_school_group_id
  FROM users WHERE id = p_assigned_by;
  
  IF v_admin_school_group_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ADMIN_NOT_FOUND',
      'message', 'Administrateur non trouvé'
    );
  END IF;
  
  -- 2. Récupérer le groupe de l'utilisateur
  SELECT school_group_id INTO v_user_school_group_id
  FROM users WHERE id = p_user_id;
  
  IF v_user_school_group_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'Utilisateur non trouvé'
    );
  END IF;
  
  -- 3. Vérifier que admin et user sont du même groupe
  IF v_admin_school_group_id != v_user_school_group_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Vous ne pouvez assigner que des modules aux utilisateurs de votre groupe'
    );
  END IF;
  
  -- 4. Vérifier que le module est dans le plan actif du groupe
  SELECT EXISTS(
    SELECT 1 
    FROM plan_modules pm
    INNER JOIN subscriptions s ON s.plan_id = pm.plan_id
    WHERE s.school_group_id = v_admin_school_group_id
      AND s.status = 'active'
      AND pm.module_id = p_module_id
  ) INTO v_module_in_plan;
  
  IF NOT v_module_in_plan THEN
    RETURN json_build_object(
      'success', false,
      'error', 'MODULE_NOT_IN_PLAN',
      'message', 'Ce module n''est pas inclus dans votre plan d''abonnement'
    );
  END IF;
  
  -- 5. Vérifier si déjà assigné
  SELECT id INTO v_assignment_id
  FROM user_module_permissions
  WHERE user_id = p_user_id
    AND module_id = p_module_id
    AND is_active = true;
  
  IF v_assignment_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ALREADY_ASSIGNED',
      'message', 'Ce module est déjà assigné à cet utilisateur'
    );
  END IF;
  
  -- 6. Assigner le module
  INSERT INTO user_module_permissions (
    user_id,
    module_id,
    can_read,
    can_write,
    can_delete,
    can_export,
    assigned_by,
    assigned_at,
    is_active,
    valid_until,
    notes
  ) VALUES (
    p_user_id,
    p_module_id,
    p_can_read,
    p_can_write,
    p_can_delete,
    p_can_export,
    p_assigned_by,
    now(),
    true,
    p_valid_until,
    p_notes
  ) RETURNING id INTO v_assignment_id;
  
  -- 7. Logger l'action (optionnel)
  INSERT INTO module_assignment_logs (
    action,
    user_id,
    module_id,
    assigned_by,
    school_group_id,
    permissions
  ) VALUES (
    'assigned',
    p_user_id,
    p_module_id,
    p_assigned_by,
    v_admin_school_group_id,
    json_build_object(
      'can_read', p_can_read,
      'can_write', p_can_write,
      'can_delete', p_can_delete,
      'can_export', p_can_export
    )
  );
  
  -- 8. Retourner succès
  RETURN json_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'message', 'Module assigné avec succès'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'INTERNAL_ERROR',
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION assign_module_to_user TO authenticated;
```

---

### Option 2: Utiliser INSERT Direct (TEMPORAIRE) ⚠️

```typescript
// useUserAssignedModules.ts
export const useAssignModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleId,
      permissions,
      validUntil,
      notes,
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      // ⚠️ TEMPORAIRE: INSERT direct sans validation serveur
      const { data, error } = await supabase
        .from('user_module_permissions')
        .insert({
          user_id: userId,
          module_id: moduleId,
          can_read: permissions.canRead,
          can_write: permissions.canWrite,
          can_delete: permissions.canDelete,
          can_export: permissions.canExport,
          assigned_by: currentUser.user.id,
          assigned_at: new Date().toISOString(),
          is_active: true,
          valid_until: validUntil,
          notes: notes,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-assigned-modules', variables.userId] 
      });
    },
  });
};
```

**⚠️ Problème:** Pas de validation côté serveur!

---

## 🔴 FONCTION REVOKE MANQUANTE AUSSI

```sql
-- Migration: create_revoke_module_function.sql

CREATE OR REPLACE FUNCTION revoke_module_from_user(
  p_user_id UUID,
  p_module_id UUID
) RETURNS JSON AS $$
DECLARE
  v_current_user_id UUID;
  v_admin_school_group_id UUID;
  v_user_school_group_id UUID;
  v_rows_updated INTEGER;
BEGIN
  -- 1. Récupérer l'utilisateur courant
  SELECT auth.uid() INTO v_current_user_id;
  
  -- 2. Récupérer le groupe de l'admin
  SELECT school_group_id INTO v_admin_school_group_id
  FROM users WHERE id = v_current_user_id;
  
  -- 3. Récupérer le groupe de l'utilisateur
  SELECT school_group_id INTO v_user_school_group_id
  FROM users WHERE id = p_user_id;
  
  -- 4. Vérifier que admin et user sont du même groupe
  IF v_admin_school_group_id != v_user_school_group_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Vous ne pouvez révoquer que des modules aux utilisateurs de votre groupe'
    );
  END IF;
  
  -- 5. Soft delete (is_active = false)
  UPDATE user_module_permissions
  SET 
    is_active = false,
    updated_at = now()
  WHERE user_id = p_user_id
    AND module_id = p_module_id
    AND is_active = true;
  
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  IF v_rows_updated = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'NOT_FOUND',
      'message', 'Assignation non trouvée ou déjà révoquée'
    );
  END IF;
  
  -- 6. Logger l'action
  INSERT INTO module_assignment_logs (
    action,
    user_id,
    module_id,
    assigned_by,
    school_group_id
  ) VALUES (
    'revoked',
    p_user_id,
    p_module_id,
    v_current_user_id,
    v_admin_school_group_id
  );
  
  -- 7. Retourner succès
  RETURN json_build_object(
    'success', true,
    'message', 'Module révoqué avec succès'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'INTERNAL_ERROR',
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION revoke_module_from_user TO authenticated;
```

---

## 📊 TABLE LOGS D'AUDIT

```sql
-- Migration: create_module_assignment_logs.sql

CREATE TABLE IF NOT EXISTS module_assignment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL CHECK (action IN ('assigned', 'revoked', 'updated')),
  user_id UUID NOT NULL REFERENCES users(id),
  module_id UUID NOT NULL REFERENCES modules(id),
  assigned_by UUID NOT NULL REFERENCES users(id),
  school_group_id UUID NOT NULL REFERENCES school_groups(id),
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances
CREATE INDEX idx_module_logs_user ON module_assignment_logs(user_id);
CREATE INDEX idx_module_logs_module ON module_assignment_logs(module_id);
CREATE INDEX idx_module_logs_school_group ON module_assignment_logs(school_group_id);
CREATE INDEX idx_module_logs_created_at ON module_assignment_logs(created_at DESC);

-- RLS
ALTER TABLE module_assignment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs of their school group"
  ON module_assignment_logs
  FOR SELECT
  USING (
    school_group_id IN (
      SELECT school_group_id FROM users WHERE id = auth.uid()
    )
  );
```

---

## ✅ PLAN D'ACTION

### Phase 1: URGENT (Aujourd'hui) 🔴

1. **Créer fonction `assign_module_to_user`**
   - Validation même groupe
   - Validation module dans plan
   - Gestion erreurs

2. **Créer fonction `revoke_module_from_user`**
   - Validation même groupe
   - Soft delete
   - Gestion erreurs

3. **Créer table `module_assignment_logs`**
   - Audit trail
   - RLS

### Phase 2: IMPORTANT (Cette semaine) 🟡

4. **Tests de sécurité**
   - Test assignation hors plan
   - Test assignation autre groupe
   - Test révocation

5. **Documentation**
   - Guide admin
   - Guide sécurité

### Phase 3: BONUS (Prochaine semaine) 🟢

6. **Monitoring**
   - Dashboard logs
   - Alertes

7. **Optimisations**
   - Cache
   - Performances

---

## 🎯 RÉSUMÉ

### Problèmes Actuels ❌
```
❌ Fonction RPC assign_module_to_user manquante
❌ Fonction RPC revoke_module_from_user manquante
❌ Pas de validation côté serveur
❌ Pas de logs d'audit
❌ Risque de sécurité
```

### Après Corrections ✅
```
✅ Validation stricte côté serveur
✅ Impossible d'assigner module hors plan
✅ Impossible d'assigner à autre groupe
✅ Logs d'audit complets
✅ Traçabilité totale
✅ Sécurité renforcée
```

---

**🔴 PRIORITÉ MAXIMALE: Créer les fonctions RPC avant production!**

---

**Développé avec ❤️ pour E-Pilot Congo**  
**Version:** 19.0 Recommandations Sécurité  
**Date:** 16 Novembre 2025  
**Statut:** 🔴 URGENT - Fonctions RPC Manquantes
