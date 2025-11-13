# ✅ CORRECTION - Affichage des Plans Archivés

**Date** : 9 novembre 2025, 22:05  
**Problème** : Clic sur "Plans Archivés" n'affiche rien

---

## ❌ PROBLÈME IDENTIFIÉ

### **Cause**

Le hook `useAllPlansWithContent()` filtrait **toujours** les plans actifs uniquement :

```typescript
// ❌ AVANT - Ligne 192
.eq('is_active', true)  // Filtre uniquement les plans actifs
```

**Résultat** :
- Même quand `showArchived = true`, seuls les plans actifs étaient récupérés
- Les plans archivés n'étaient jamais affichés
- Le bouton "Plans Archivés" ne montrait rien

---

## ✅ SOLUTION APPLIQUÉE

### **1. Modification du Hook `useAllPlansWithContent`**

**Fichier** : `src/features/dashboard/hooks/usePlanWithContent.ts`

**Changements** :

```typescript
// ✅ APRÈS - Ajout du paramètre showArchived
export const useAllPlansWithContent = (
  searchQuery?: string, 
  showArchived?: boolean  // ← Nouveau paramètre
) => {
  return useQuery({
    queryKey: ['all-plans-with-content', searchQuery, showArchived],
    queryFn: async (): Promise<PlanWithContent[]> => {
      let plansQuery = supabase
        .from('subscription_plans')
        .select(`...`)
        .order('price', { ascending: true });

      // ✅ Filtrer par statut si nécessaire
      if (!showArchived) {
        plansQuery = plansQuery.eq('is_active', true);
      }
      // Si showArchived = true, on récupère TOUS les plans (actifs + archivés)

      // ...
    },
  });
};
```

**Logique** :
- `showArchived = false` (défaut) → Récupère uniquement les plans actifs
- `showArchived = true` → Récupère TOUS les plans (actifs + archivés)

---

### **2. Ajout du Champ `isActive` dans l'Interface**

**Interface `PlanWithContent`** :

```typescript
export interface PlanWithContent {
  id: string;
  name: string;
  slug: string;
  // ...
  isPopular: boolean;
  isActive: boolean;  // ← Nouveau champ
  // ...
}
```

**Dans les fonctions de retour** :

```typescript
return {
  id: planData.id,
  name: planData.name,
  // ...
  isPopular: planData.is_popular || false,
  isActive: planData.is_active !== false,  // ← Ajouté
  // ...
};
```

---

### **3. Mise à Jour de l'Appel dans Plans.tsx**

**Fichier** : `src/features/dashboard/pages/Plans.tsx`

```typescript
// ❌ AVANT
const { data: plansWithContent } = useAllPlansWithContent(searchQuery);

// ✅ APRÈS
const { data: plansWithContent } = useAllPlansWithContent(searchQuery, showArchived);
```

**Résultat** :
- Quand `showArchived = false` → Affiche uniquement les plans actifs
- Quand `showArchived = true` → Affiche TOUS les plans (actifs + archivés)

---

## 🔄 WORKFLOW CORRIGÉ

### **Scénario : Voir les Plans Archivés**

```
1. Super Admin clique sur "Plans Archivés"
   ↓
2. État : showArchived = true
   ↓
3. Hook useAllPlansWithContent(searchQuery, true)
   ↓
4. Requête SQL :
   SELECT * FROM subscription_plans
   ORDER BY price ASC
   -- Pas de filtre is_active = true
   ↓
5. Résultat : TOUS les plans (actifs + archivés)
   ↓
6. Affichage :
   - Plans actifs : Opacité 100%, couleurs vives
   - Plans archivés : Opacité 60%, grayscale, badge "Archivé"
```

---

## 📊 REQUÊTES SQL

### **Plans Actifs (showArchived = false)**

```sql
SELECT 
  id, name, slug, description, price, currency,
  billing_period, is_popular, discount, trial_days,
  max_schools, max_students, max_staff, max_storage,
  support_level, custom_branding, api_access, is_active
FROM subscription_plans
WHERE is_active = true  -- ← Filtre appliqué
ORDER BY price ASC;
```

**Résultat** :
```
┌──────────────┬─────────┬───────────┬──────────┐
│ id           │ name    │ price     │ is_active│
├──────────────┼─────────┼───────────┼──────────┤
│ plan-gratuit │ Gratuit │ 0         │ true     │
│ plan-premium │ Premium │ 50000     │ true     │
│ plan-pro     │ Pro     │ 150000    │ true     │
└──────────────┴─────────┴───────────┴──────────┘
```

---

### **Tous les Plans (showArchived = true)**

```sql
SELECT 
  id, name, slug, description, price, currency,
  billing_period, is_popular, discount, trial_days,
  max_schools, max_students, max_staff, max_storage,
  support_level, custom_branding, api_access, is_active
FROM subscription_plans
-- ← Pas de filtre is_active
ORDER BY price ASC;
```

**Résultat** :
```
┌──────────────────┬──────────────┬───────────┬──────────┐
│ id               │ name         │ price     │ is_active│
├──────────────────┼──────────────┼───────────┼──────────┤
│ plan-gratuit     │ Gratuit      │ 0         │ true     │
│ plan-starter     │ Starter      │ 25000     │ false    │ ← Archivé
│ plan-premium-old │ Premium Old  │ 40000     │ false    │ ← Archivé
│ plan-premium     │ Premium      │ 50000     │ true     │
│ plan-pro         │ Pro          │ 150000    │ true     │
└──────────────────┴──────────────┴───────────┴──────────┘
```

---

## 🎨 AFFICHAGE VISUEL

### **Plans Actifs**

```
┌─────────────────────────────────────┐
│ [👑 Populaire]                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Icon]            [✅ Actif]    │ │ ← Couleurs vives
│ │ Plan Premium                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [✏️ Modifier] [🗑️]                 │
└─────────────────────────────────────┘
   ↑ Opacité 100%
```

---

### **Plans Archivés**

```
┌─────────────────────────────────────┐
│ [📦 Archivé]                        │ ← Badge gris
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Icon]            [❌ Inactif]  │ │ ← Grayscale
│ │ Plan Premium Old                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [🔄 Restaurer]                      │ ← Bouton vert
└─────────────────────────────────────┘
   ↑ Opacité 60%
```

---

## 🎯 RÉSUMÉ DES MODIFICATIONS

### **Fichiers Modifiés**

1. ✅ `src/features/dashboard/hooks/usePlanWithContent.ts`
   - Ajout du paramètre `showArchived` dans `useAllPlansWithContent()`
   - Ajout du champ `isActive` dans l'interface `PlanWithContent`
   - Filtrage conditionnel : `if (!showArchived) { ... .eq('is_active', true) }`

2. ✅ `src/features/dashboard/pages/Plans.tsx`
   - Passage du paramètre `showArchived` au hook
   - `useAllPlansWithContent(searchQuery, showArchived)`

---

### **Logique de Filtrage**

```typescript
// Fonction de filtrage
if (!showArchived) {
  // Mode "Plans Actifs" (défaut)
  plansQuery = plansQuery.eq('is_active', true);
} else {
  // Mode "Plans Archivés"
  // Pas de filtre → Récupère TOUS les plans
}
```

**Résultat** :
- ✅ **Plans Actifs** : Affiche uniquement les plans actifs
- ✅ **Plans Archivés** : Affiche TOUS les plans (actifs + archivés)
- ✅ **Distinction visuelle** : Opacité, grayscale, badges

---

## 🔍 VÉRIFICATION

### **Test 1 : Plans Actifs (défaut)**

```
1. Ouvrir la page Plans
   ↓
2. Vérifier : showArchived = false
   ↓
3. Résultat attendu :
   - Affiche uniquement les plans actifs
   - Badge "Plans Archivés (X)" visible si des plans archivés existent
```

---

### **Test 2 : Plans Archivés**

```
1. Cliquer sur "Plans Archivés"
   ↓
2. Vérifier : showArchived = true
   ↓
3. Résultat attendu :
   - Affiche TOUS les plans (actifs + archivés)
   - Plans archivés : Opacité 60%, grayscale, badge "Archivé"
   - Plans actifs : Opacité 100%, couleurs vives
   - Bouton "Restaurer" sur les plans archivés
```

---

### **Test 3 : Restauration**

```
1. Cliquer sur "Plans Archivés"
   ↓
2. Cliquer sur "🔄 Restaurer" sur un plan archivé
   ↓
3. Confirmer la restauration
   ↓
4. Résultat attendu :
   - Plan restauré (is_active = true)
   - Toast : "✅ Plan restauré avec succès"
   - Plan réapparaît dans "Plans Actifs"
```

---

## 🎉 RÉSULTAT FINAL

**Avant la correction** :
- ❌ Clic sur "Plans Archivés" → Aucun plan affiché
- ❌ Message vide ou erreur

**Après la correction** :
- ✅ Clic sur "Plans Archivés" → Affiche TOUS les plans
- ✅ Plans archivés visibles avec distinction visuelle
- ✅ Bouton "Restaurer" fonctionnel
- ✅ Toggle entre "Plans Actifs" et "Plans Archivés" opérationnel

**Le problème est maintenant résolu !** 🎉
