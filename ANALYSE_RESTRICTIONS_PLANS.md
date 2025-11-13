# 🔒 ANALYSE COMPLÈTE - RESTRICTIONS DES PLANS

**Date** : 6 novembre 2025  
**Statut** : Vérification de cohérence

---

## ✅ CE QUI EXISTE DÉJÀ

### **1. Configuration des restrictions** ✅

**Fichier** : `planRestrictions.ts`

**4 plans configurés** :

| Plan | Écoles | Users | Storage | Modules | Prix/mois |
|------|--------|-------|---------|---------|-----------|
| **Gratuit** | 1 | 10 | 1 GB | 5 | 0 FCFA |
| **Premium** | 5 | 50 | 10 GB | 15 | 50,000 FCFA |
| **Pro** | 20 | 200 | 50 GB | Illimité | 150,000 FCFA |
| **Institutionnel** | Illimité | Illimité | Illimité | Illimité | 500,000 FCFA |

**Fonctions utilitaires** :
- ✅ `canPerformAction()` - Vérifier permission
- ✅ `hasReachedLimit()` - Vérifier limite atteinte
- ✅ `getLimitUsagePercentage()` - % utilisation
- ✅ `getRemainingLimit()` - Restant
- ✅ `getRecommendedPlan()` - Plan recommandé
- ✅ `getLimitErrorMessage()` - Message erreur

---

### **2. Hook usePlanRestrictions** ✅

**Fichier** : `usePlanRestrictions.ts`

**API disponible** :
```typescript
const {
  can,                    // can('exportData')
  isLimitReached,         // isLimitReached('schools')
  getUsagePercentage,     // getUsagePercentage('users')
  getRemaining,           // getRemaining('storage')
  needsUpgrade,           // boolean
  recommendedPlan,        // 'premium' | 'pro' | null
  limitAlerts,            // Array<Alert>
} = usePlanRestrictions();
```

---

### **3. Widget Plan Limits** ✅

**Fichier** : `PlanLimitsWidget.tsx`

**Affichage** :
- Badge plan actuel
- 4 barres de progression
- Alertes si ≥ 80%
- Bouton "Demander upgrade"

---

## ❌ CE QUI MANQUE (CRITIQUE !)

### **1. Vérification avant création école** ❌

**Fichier** : `useSchools.ts` / `useSchools-simple.ts`

**Problème** : Aucune vérification de limite !

```typescript
// ACTUEL (MAUVAIS) ❌
export const useCreateSchool = () => {
  return useMutation({
    mutationFn: async (input) => {
      // ❌ PAS DE VÉRIFICATION !
      const { data, error } = await supabase
        .from('schools')
        .insert(input);
      
      return data;
    }
  });
};

// CE QU'IL FAUT (BON) ✅
export const useCreateSchool = () => {
  return useMutation({
    mutationFn: async (input) => {
      // ✅ VÉRIFIER LA LIMITE
      const { data: group } = await supabase
        .from('school_groups')
        .select('plan, school_count')
        .eq('id', input.school_group_id)
        .single();
      
      const planLimits = PLAN_RESTRICTIONS[group.plan];
      
      if (planLimits.maxSchools !== null && 
          group.school_count >= planLimits.maxSchools) {
        throw new Error(
          `Limite de ${planLimits.maxSchools} école(s) atteinte pour le plan ${planLimits.name}`
        );
      }
      
      // Créer l'école
      const { data, error } = await supabase
        .from('schools')
        .insert(input);
      
      return data;
    }
  });
};
```

---

### **2. Vérification avant création utilisateur** ❌

**Fichier** : `useUsers.ts`

**Problème** : Aucune vérification de limite !

```typescript
// CE QU'IL FAUT ✅
export const useCreateUser = () => {
  return useMutation({
    mutationFn: async (input) => {
      // ✅ VÉRIFIER LA LIMITE
      const { data: group } = await supabase
        .from('school_groups')
        .select('plan, student_count, staff_count')
        .eq('id', input.school_group_id)
        .single();
      
      const planLimits = PLAN_RESTRICTIONS[group.plan];
      const currentUsers = group.student_count + group.staff_count;
      
      if (planLimits.maxUsers !== null && 
          currentUsers >= planLimits.maxUsers) {
        throw new Error(
          `Limite de ${planLimits.maxUsers} utilisateur(s) atteinte pour le plan ${planLimits.name}`
        );
      }
      
      // Créer l'utilisateur
      // ...
    }
  });
};
```

---

### **3. Vérification avant upload fichier** ❌

**Problème** : Aucune vérification de stockage !

```typescript
// CE QU'IL FAUT ✅
export const uploadFile = async (file: File, groupId: string) => {
  // ✅ VÉRIFIER LE STOCKAGE
  const { data: group } = await supabase
    .from('school_groups')
    .select('plan, storage_used')
    .eq('id', groupId)
    .single();
  
  const planLimits = PLAN_RESTRICTIONS[group.plan];
  const fileSizeGB = file.size / (1024 * 1024 * 1024);
  const newStorageUsed = group.storage_used + fileSizeGB;
  
  if (planLimits.maxStorage !== null && 
      newStorageUsed > planLimits.maxStorage) {
    throw new Error(
      `Limite de stockage de ${planLimits.maxStorage} GB atteinte pour le plan ${planLimits.name}`
    );
  }
  
  // Upload le fichier
  // ...
};
```

---

### **4. Vérification fonctionnalités** ❌

**Problème** : Pas de vérification avant actions !

```typescript
// CE QU'IL FAUT ✅
// Avant d'exporter des données
const { can } = usePlanRestrictions();

if (!can('exportData')) {
  toast.error('Fonctionnalité réservée au plan Premium');
  return;
}

// Avant bulk operations
if (!can('bulkOperations')) {
  toast.error('Opérations en masse réservées au plan Premium');
  return;
}

// Avant d'accéder à l'API
if (!can('api')) {
  toast.error('Accès API réservé au plan Pro');
  return;
}
```

---

### **5. Mise à jour compteurs** ❌

**Problème** : Les compteurs ne sont pas mis à jour !

**Tables à mettre à jour** :
- `school_groups.school_count` après création école
- `school_groups.student_count` après création élève
- `school_groups.staff_count` après création personnel
- `school_groups.storage_used` après upload fichier

**Solution** : Triggers SQL ou mise à jour manuelle

---

## 📊 SCORE ACTUEL

| Fonctionnalité | Implémenté | Score |
|---|---|---|
| Configuration restrictions | ✅ Complet | 10/10 |
| Hook usePlanRestrictions | ✅ Complet | 10/10 |
| Widget Plan Limits | ✅ Complet | 10/10 |
| **Vérification création école** | ❌ **Manquant** | **0/10** |
| **Vérification création user** | ❌ **Manquant** | **0/10** |
| **Vérification upload fichier** | ❌ **Manquant** | **0/10** |
| **Vérification fonctionnalités** | ❌ **Manquant** | **0/10** |
| **Mise à jour compteurs** | ❌ **Manquant** | **0/10** |

**SCORE GLOBAL** : **3.8/10** ⚠️

---

## 🚨 PROBLÈMES IDENTIFIÉS

### **P0 - CRITIQUE** (Bloquant)

1. ❌ **Pas de vérification avant création école**
   - Un groupe Gratuit (limite 1) peut créer 100 écoles !
   
2. ❌ **Pas de vérification avant création utilisateur**
   - Un groupe Gratuit (limite 10) peut créer 1000 users !

3. ❌ **Pas de vérification stockage**
   - Un groupe Gratuit (limite 1 GB) peut uploader 100 GB !

### **P1 - IMPORTANT**

4. ⚠️ **Compteurs pas mis à jour**
   - `school_count`, `student_count`, `staff_count`, `storage_used` ne changent pas

5. ⚠️ **Fonctionnalités pas vérifiées**
   - Export, bulk operations, API accessibles à tous

---

## 🎯 ACTIONS URGENTES

### **À implémenter MAINTENANT** :

1. ✅ **Ajouter vérifications dans hooks**
   - `useCreateSchool` - Vérifier maxSchools
   - `useCreateUser` - Vérifier maxUsers
   - Upload fichier - Vérifier maxStorage

2. ✅ **Créer triggers SQL**
   - Mettre à jour compteurs automatiquement
   - Vérifier limites côté BDD (sécurité)

3. ✅ **Ajouter vérifications UI**
   - Désactiver boutons si limite atteinte
   - Afficher messages d'erreur clairs
   - Suggérer upgrade

---

## 💡 RECOMMANDATION

**OUI, les restrictions existent mais NE SONT PAS APPLIQUÉES !**

C'est comme avoir un **cadenas sans clé** :
- ✅ Le système est configuré
- ❌ Mais rien ne l'empêche de dépasser les limites

**PRIORITÉ ABSOLUE** : Implémenter les vérifications dans les hooks !

---

## 🎯 PLAN D'ACTION

### **Phase 1 : Vérifications côté client** (2h)
1. Modifier `useCreateSchool`
2. Modifier `useCreateUser`
3. Ajouter vérification upload
4. Ajouter vérifications fonctionnalités

### **Phase 2 : Triggers SQL** (1h)
1. Trigger mise à jour `school_count`
2. Trigger mise à jour `student_count`
3. Trigger mise à jour `staff_count`
4. Trigger mise à jour `storage_used`

### **Phase 3 : Vérifications BDD** (1h)
1. Contraintes CHECK sur compteurs
2. Fonctions SQL de vérification
3. RLS avec restrictions

**TOTAL** : 4 heures pour système complet

---

**Voulez-vous que j'implémente tout cela maintenant ?**
