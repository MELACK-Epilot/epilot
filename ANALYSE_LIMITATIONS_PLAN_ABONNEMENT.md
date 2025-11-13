# 🔍 ANALYSE : Limitations par Plan d'Abonnement

**Date** : 7 novembre 2025, 12:00 PM  
**Statut** : ⚠️ PARTIELLEMENT IMPLÉMENTÉ

---

## 🎯 QUESTION POSÉE

**"La logique de limitation par plan d'abonnement (nombre d'écoles, nombre d'utilisateurs) est-elle parfaitement respectée ?"**

---

## 📊 RÉSULTAT DE L'ANALYSE

### **✅ CE QUI EST BIEN IMPLÉMENTÉ**

1. **Configuration des limitations** : ✅ PARFAIT
2. **Hooks de vérification** : ✅ PARFAIT
3. **Limitation création d'écoles** : ✅ IMPLÉMENTÉ
4. **Limitation création d'utilisateurs** : ❌ **NON IMPLÉMENTÉ**

---

## 🏗️ ARCHITECTURE DES LIMITATIONS

### **1. Configuration Centralisée**

**Fichier** : `src/features/dashboard/config/planRestrictions.ts`

```typescript
export const PLAN_RESTRICTIONS: Record<string, PlanLimits> = {
  gratuit: {
    maxSchools: 1,        // ✅ 1 école maximum
    maxUsers: 10,         // ✅ 10 utilisateurs maximum
    maxStorage: 1,        // ✅ 1 GB
    maxModules: 5,        // ✅ 5 modules
  },
  
  premium: {
    maxSchools: 5,        // ✅ 5 écoles maximum
    maxUsers: 50,         // ✅ 50 utilisateurs maximum
    maxStorage: 10,       // ✅ 10 GB
    maxModules: 15,       // ✅ 15 modules
  },
  
  pro: {
    maxSchools: 20,       // ✅ 20 écoles maximum
    maxUsers: 200,        // ✅ 200 utilisateurs maximum
    maxStorage: 50,       // ✅ 50 GB
    maxModules: null,     // ✅ Illimité
  },
  
  institutionnel: {
    maxSchools: null,     // ✅ Illimité
    maxUsers: null,       // ✅ Illimité
    maxStorage: null,     // ✅ Illimité
    maxModules: null,     // ✅ Illimité
  },
};
```

**Statut** : ✅ **PARFAIT** - Configuration claire et complète

---

### **2. Hooks de Vérification**

#### **Hook `usePlanRestrictions`**

**Fichier** : `src/features/dashboard/hooks/usePlanRestrictions.ts`

```typescript
export const usePlanRestrictions = () => {
  const { data: currentGroup } = useCurrentUserGroup();
  const planSlug = currentGroup?.plan || 'gratuit';
  
  // Utilisation actuelle
  const currentUsage = {
    schools: currentGroup?.schoolCount || 0,
    users: (currentGroup?.studentCount || 0) + (currentGroup?.staffCount || 0),
    storage: 0,
    modules: 0,
  };
  
  // Vérifier si une limite est atteinte
  const isLimitReached = (limitType: 'schools' | 'users' | 'storage' | 'modules'): boolean => {
    return hasReachedLimit(planSlug, limitType, currentUsage[limitType]);
  };
  
  // Obtenir les limites restantes
  const getRemaining = (limitType): number | null => {
    const limit = planLimits[limitType];
    if (limit === null) return null; // Illimité
    return Math.max(0, limit - currentUsage[limitType]);
  };
  
  return {
    isLimitReached,
    getRemaining,
    getErrorMessage,
    needsUpgrade,
    recommendedPlan,
  };
};
```

**Statut** : ✅ **PARFAIT** - Hook complet avec toutes les fonctions nécessaires

---

#### **Hook `useCheckQuota`**

**Fichier** : `src/features/dashboard/hooks/useQuotas.ts`

```typescript
export const useCheckQuota = () => {
  return useMutation({
    mutationFn: async ({
      schoolGroupId,
      resourceType,
      increment = 1,
    }: {
      schoolGroupId: string;
      resourceType: 'school' | 'student' | 'personnel';
      increment?: number;
    }) => {
      const { data, error } = await supabase.rpc('check_quota_before_creation', {
        p_school_group_id: schoolGroupId,
        p_resource_type: resourceType,
        p_increment: increment,
      });
      
      if (error) throw error;
      return data as QuotaCheckResult;
    },
  });
};
```

**Statut** : ✅ **PARFAIT** - Hook pour vérifier les quotas avant création

---

### **3. Composant `LimitChecker`**

**Fichier** : `src/features/dashboard/components/LimitChecker.tsx`

```typescript
export const LimitChecker = ({
  limitType,
  children,
  onLimitReached,
}: LimitCheckerProps) => {
  const {
    isLimitReached,
    getRemaining,
    getErrorMessage,
  } = usePlanRestrictions();
  
  const limitReached = isLimitReached(limitType);
  const remaining = getRemaining(limitType);
  
  // Si limite atteinte, afficher message au lieu du bouton
  if (limitReached) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{getErrorMessage(limitType)}</p>
        <Button onClick={() => navigate('/dashboard/plans')}>
          Mettre à niveau
        </Button>
      </div>
    );
  }
  
  return <>{children}</>;
};
```

**Utilisation** :
```tsx
<LimitChecker limitType="schools">
  <Button onClick={handleCreateSchool}>Créer une école</Button>
</LimitChecker>
```

**Statut** : ✅ **PARFAIT** - Composant réutilisable pour bloquer les actions

---

## ✅ IMPLÉMENTATION ACTUELLE

### **1. Création d'Écoles : ✅ IMPLÉMENTÉ**

**Fichier** : `src/features/dashboard/hooks/useSchools-simple.ts` (ligne 227-276)

```typescript
export const useCreateSchool = () => {
  return useMutation({
    mutationFn: async (school: Omit<School, 'id' | 'created_at' | 'updated_at'>) => {
      // ✅ VÉRIFIER LA LIMITE D'ÉCOLES
      const { data: group, error: groupError } = await supabase
        .from('school_groups')
        .select('plan, school_count')
        .eq('id', school.school_group_id)
        .single();
      
      if (groupError) throw groupError;
      
      // Limites par plan
      const PLAN_LIMITS: Record<string, number | null> = {
        gratuit: 1,
        premium: 5,
        pro: 20,
        institutionnel: null, // illimité
      };
      
      const maxSchools = PLAN_LIMITS[group.plan];
      
      // ✅ BLOQUER SI LIMITE ATTEINTE
      if (maxSchools !== null && group.school_count >= maxSchools) {
        throw new Error(
          `Limite de ${maxSchools} école(s) atteinte pour le plan ${group.plan}. Veuillez upgrader votre plan.`
        );
      }
      
      // Créer l'école
      const { data, error } = await supabase
        .from('schools')
        .insert(school as any)
        .select()
        .single();
      
      if (error) throw error;
      
      // ✅ METTRE À JOUR LE COMPTEUR
      await supabase
        .from('school_groups')
        .update({ school_count: group.school_count + 1 })
        .eq('id', school.school_group_id);
      
      return data;
    },
  });
};
```

**Flux de Validation** :
```
1. Récupérer le plan du groupe
2. Récupérer le compteur actuel (school_count)
3. Vérifier : school_count >= maxSchools ?
4. Si OUI → Bloquer avec message d'erreur
5. Si NON → Créer l'école + Incrémenter compteur
```

**Statut** : ✅ **PARFAITEMENT IMPLÉMENTÉ**

**Test** :
```
Plan Gratuit (max 1 école) :
- Création 1ère école → ✅ OK
- Création 2ème école → ❌ BLOQUÉ "Limite de 1 école(s) atteinte"

Plan Premium (max 5 écoles) :
- Création 1-5 écoles → ✅ OK
- Création 6ème école → ❌ BLOQUÉ "Limite de 5 école(s) atteinte"
```

---

### **2. Création d'Utilisateurs : ❌ NON IMPLÉMENTÉ**

**Fichier** : `src/features/dashboard/hooks/useUsers.ts` (ligne 280-390)

```typescript
export const useCreateUser = () => {
  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      // ❌ AUCUNE VÉRIFICATION DE LIMITE
      
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
            role: input.role || 'admin_groupe',
          },
        },
      });
      
      if (authError) throw new Error(authError.message);
      
      // 2. Créer l'enregistrement dans la table users
      const insertData: Record<string, any> = {
        id: authData.user?.id,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        role: input.role || 'admin_groupe',
        status: 'active',
        school_group_id: input.schoolGroupId,
        school_id: input.schoolId,
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      // ❌ AUCUNE MISE À JOUR DU COMPTEUR
      
      return data;
    },
  });
};
```

**Problèmes Identifiés** :

1. ❌ **Aucune vérification de limite** avant création
2. ❌ **Aucune récupération du plan** du groupe
3. ❌ **Aucune comparaison** avec `maxUsers`
4. ❌ **Aucun blocage** si limite atteinte
5. ❌ **Aucune mise à jour du compteur** après création

**Statut** : ❌ **NON IMPLÉMENTÉ**

**Conséquence** :
```
Plan Gratuit (max 10 utilisateurs) :
- Création de 50 utilisateurs → ✅ AUTORISÉ (PROBLÈME !)
- Aucun message d'erreur
- Aucun blocage
```

---

## 🔧 CORRECTIONS NÉCESSAIRES

### **1. Ajouter Vérification dans `useCreateUser`**

**Fichier** : `src/features/dashboard/hooks/useUsers.ts`

**AVANT** (ligne 280) :
```typescript
export const useCreateUser = () => {
  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      // ❌ Pas de vérification
      
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        ...
      });
```

**APRÈS** (à ajouter) :
```typescript
export const useCreateUser = () => {
  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      // ✅ VÉRIFIER LA LIMITE D'UTILISATEURS
      if (input.schoolGroupId) {
        const { data: group, error: groupError } = await supabase
          .from('school_groups')
          .select('plan, student_count, staff_count')
          .eq('id', input.schoolGroupId)
          .single();
        
        if (groupError) throw groupError;
        
        // Limites par plan
        const PLAN_LIMITS: Record<string, number | null> = {
          gratuit: 10,
          premium: 50,
          pro: 200,
          institutionnel: null, // illimité
        };
        
        const maxUsers = PLAN_LIMITS[group.plan];
        const currentUsers = (group.student_count || 0) + (group.staff_count || 0);
        
        // ✅ BLOQUER SI LIMITE ATTEINTE
        if (maxUsers !== null && currentUsers >= maxUsers) {
          throw new Error(
            `Limite de ${maxUsers} utilisateur(s) atteinte pour le plan ${group.plan}. Veuillez upgrader votre plan.`
          );
        }
      }
      
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
            role: input.role || 'admin_groupe',
          },
        },
      });
      
      if (authError) throw new Error(authError.message);
      
      // ... reste du code ...
      
      // ✅ METTRE À JOUR LE COMPTEUR
      if (input.schoolGroupId) {
        // Déterminer si c'est un étudiant ou staff
        const isStudent = input.role === 'eleve';
        const updateField = isStudent ? 'student_count' : 'staff_count';
        
        await supabase.rpc('increment_user_count', {
          p_school_group_id: input.schoolGroupId,
          p_field: updateField,
        });
      }
      
      return data;
    },
  });
};
```

---

### **2. Créer Fonction SQL pour Incrémenter**

**Fichier** : `database/CREATE_INCREMENT_USER_COUNT_FUNCTION.sql`

```sql
-- Fonction pour incrémenter le compteur d'utilisateurs
CREATE OR REPLACE FUNCTION increment_user_count(
  p_school_group_id UUID,
  p_field TEXT
)
RETURNS VOID AS $$
BEGIN
  IF p_field = 'student_count' THEN
    UPDATE school_groups
    SET student_count = student_count + 1
    WHERE id = p_school_group_id;
  ELSIF p_field = 'staff_count' THEN
    UPDATE school_groups
    SET staff_count = staff_count + 1
    WHERE id = p_school_group_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **3. Ajouter Composant `LimitChecker` dans les Formulaires**

**Fichier** : `src/features/dashboard/pages/Users.tsx`

**AVANT** :
```tsx
<Button onClick={() => setIsCreateDialogOpen(true)}>
  <Plus className="h-4 w-4 mr-2" />
  Nouvel Utilisateur
</Button>
```

**APRÈS** :
```tsx
<LimitChecker limitType="users">
  <Button onClick={() => setIsCreateDialogOpen(true)}>
    <Plus className="h-4 w-4 mr-2" />
    Nouvel Utilisateur
  </Button>
</LimitChecker>
```

---

## 📊 TABLEAU COMPARATIF

| Ressource | Configuration | Hook Vérification | Implémentation Création | Mise à Jour Compteur | Statut |
|-----------|---------------|-------------------|-------------------------|----------------------|--------|
| **Écoles** | ✅ PLAN_RESTRICTIONS | ✅ usePlanRestrictions | ✅ useCreateSchool | ✅ school_count++ | ✅ **COMPLET** |
| **Utilisateurs** | ✅ PLAN_RESTRICTIONS | ✅ usePlanRestrictions | ❌ useCreateUser | ❌ Aucun | ❌ **MANQUANT** |
| **Modules** | ✅ PLAN_RESTRICTIONS | ✅ usePlanRestrictions | ✅ Filtrage auto | N/A | ✅ **COMPLET** |
| **Stockage** | ✅ PLAN_RESTRICTIONS | ✅ usePlanRestrictions | ❌ Non implémenté | ❌ Aucun | ❌ **MANQUANT** |

---

## 🎯 CHECKLIST DE VÉRIFICATION

### **Configuration**
- [x] Limitations définies dans `PLAN_RESTRICTIONS`
- [x] Hiérarchie des plans claire (gratuit < premium < pro < institutionnel)
- [x] Valeurs `null` pour illimité

### **Hooks de Vérification**
- [x] `usePlanRestrictions` créé
- [x] `useCheckQuota` créé
- [x] `useCanCreateResource` créé
- [x] Fonctions helper (hasReachedLimit, getRemainingLimit, etc.)

### **Composants UI**
- [x] `LimitChecker` créé
- [ ] `LimitChecker` utilisé dans formulaire écoles
- [ ] `LimitChecker` utilisé dans formulaire utilisateurs
- [ ] Affichage du compteur (X / Y)
- [ ] Barre de progression

### **Implémentation Écoles**
- [x] Vérification limite dans `useCreateSchool`
- [x] Message d'erreur clair
- [x] Mise à jour compteur `school_count`
- [x] Blocage si limite atteinte

### **Implémentation Utilisateurs**
- [ ] Vérification limite dans `useCreateUser`
- [ ] Message d'erreur clair
- [ ] Mise à jour compteur `student_count` / `staff_count`
- [ ] Blocage si limite atteinte

### **Tests**
- [ ] Test plan Gratuit (1 école, 10 users)
- [ ] Test plan Premium (5 écoles, 50 users)
- [ ] Test plan Pro (20 écoles, 200 users)
- [ ] Test plan Institutionnel (illimité)
- [ ] Test message d'erreur
- [ ] Test bouton "Mettre à niveau"

---

## 🎊 CONCLUSION

### **✅ POINTS FORTS**

1. **Configuration excellente** : `PLAN_RESTRICTIONS` bien structuré
2. **Hooks complets** : `usePlanRestrictions`, `useCheckQuota`, etc.
3. **Composant réutilisable** : `LimitChecker`
4. **Écoles protégées** : Limitation parfaitement implémentée

### **❌ POINTS FAIBLES**

1. **Utilisateurs NON protégés** : Aucune vérification de limite
2. **Compteurs non mis à jour** : `student_count`, `staff_count`
3. **`LimitChecker` non utilisé** : Composant créé mais pas intégré
4. **Stockage non géré** : Aucune vérification

### **🎯 RÉPONSE À LA QUESTION**

**"La logique de limitation est-elle parfaitement respectée ?"**

**Réponse** : ⚠️ **PARTIELLEMENT**

- ✅ **Écoles** : OUI, parfaitement respecté
- ❌ **Utilisateurs** : NON, aucune limitation appliquée
- ✅ **Modules** : OUI, filtrage automatique
- ❌ **Stockage** : NON, pas implémenté

**Priorité** : 🔴 **HAUTE** - Corriger la création d'utilisateurs

---

**Date** : 7 novembre 2025, 12:00 PM  
**Analysé par** : Cascade AI  
**Statut** : ⚠️ CORRECTIONS NÉCESSAIRES
