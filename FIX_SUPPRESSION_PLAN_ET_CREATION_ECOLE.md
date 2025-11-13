# 🔧 CORRECTION - 2 Problèmes Identifiés

**Date** : 8 novembre 2025, 00:48 AM  
**Statut** : 🔍 EN DIAGNOSTIC

---

## **PROBLÈME 1 : Suppression de Plan (Super Admin)**

### **Diagnostic**

Le hook `useDeletePlan()` existe et fonctionne correctement :
```typescript
// src/features/dashboard/hooks/usePlans.ts ligne 259
export const useDeletePlan = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false })  // Archivage, pas suppression
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
};
```

**Cause probable** : Contraintes de clés étrangères qui empêchent la suppression.

### **Tables Liées**

Un plan peut être référencé par :
1. `school_group_subscriptions.plan_id` (abonnements actifs)
2. `plan_modules.plan_id` (modules du plan)
3. `plan_categories.plan_id` (catégories du plan)

### **Solution**

Le système fait déjà un **archivage** (`is_active = false`) au lieu d'une suppression.

**Vérification nécessaire** :
1. Ouvrir la console du navigateur (F12)
2. Essayer de supprimer un plan
3. Regarder l'erreur exacte affichée

**Erreur attendue** :
- Si contrainte FK : "violates foreign key constraint"
- Si RLS : "permission denied"
- Si autre : Message spécifique

---

## **PROBLÈME 2 : Création d'École (Admin Groupe)**

### **Diagnostic**

Le composant `SchoolFormDialog` existe et utilise le hook `useCreateSchool`.

**Fichiers impliqués** :
1. `src/features/dashboard/components/schools/SchoolFormDialog.tsx`
2. `src/features/dashboard/hooks/useSchools-simple.ts` (ou `useCreateSchool.ts`)

### **Cause Probable**

1. **Champ `school_group_id` manquant** : L'école doit être liée au groupe de l'admin
2. **Permissions RLS** : L'admin groupe n'a peut-être pas le droit d'insérer dans `schools`
3. **Validation du formulaire** : Un champ obligatoire est manquant

### **Vérification Nécessaire**

1. Ouvrir la console du navigateur (F12)
2. Essayer de créer une école
3. Regarder l'erreur exacte affichée

**Erreurs possibles** :
- `school_group_id is required`
- `permission denied for table schools`
- `violates not-null constraint`

---

## **ACTIONS REQUISES**

### **Pour le Problème 1 (Suppression Plan)**

**Envoyez-moi** :
1. L'erreur exacte affichée dans la console (F12)
2. Le message de toast affiché à l'utilisateur

### **Pour le Problème 2 (Création École)**

**Envoyez-moi** :
1. L'erreur exacte affichée dans la console (F12)
2. Le message de toast affiché à l'utilisateur
3. Les valeurs du formulaire soumises

---

## **SOLUTIONS TEMPORAIRES**

### **Problème 1 : Si contrainte FK bloque**

```sql
-- Vérifier les plans avec abonnements actifs
SELECT 
  sp.name as plan,
  COUNT(sgs.id) as nb_abonnements_actifs
FROM subscription_plans sp
LEFT JOIN school_group_subscriptions sgs ON sgs.plan_id = sp.id AND sgs.status = 'active'
GROUP BY sp.id, sp.name;

-- Un plan ne peut être supprimé que s'il n'a aucun abonnement actif
```

### **Problème 2 : Si school_group_id manque**

Le formulaire doit automatiquement récupérer le `school_group_id` de l'admin connecté :

```typescript
// Dans SchoolFormDialog
const { data: currentUser } = useAuth();
const schoolGroupId = currentUser?.schoolGroupId;

// Lors de la soumission
const dataToSubmit = {
  ...values,
  school_group_id: schoolGroupId,  // ✅ Ajouter automatiquement
};
```

---

**Envoyez-moi les erreurs exactes pour que je puisse corriger !** 🔍
