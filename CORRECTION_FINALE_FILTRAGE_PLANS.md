# ✅ CORRECTION FINALE - Filtrage Plans Actifs/Archivés

**Date** : 9 novembre 2025, 23:10  
**Problème résolu** : Plans restaurés apparaissaient toujours dans les plans archivés

---

## ❌ PROBLÈME IDENTIFIÉ

### **Double Affichage des Plans**

**Symptôme** :
- Plan restauré → Apparaissait dans "Plans Actifs" ET "Plans Archivés"
- Plan archivé → Apparaissait dans les deux vues

**Cause Racine** :
Deux hooks utilisés pour afficher les plans :
1. ✅ `usePlans()` - Filtrait correctement
2. ❌ `useAllPlansWithContent()` - Ne filtrait PAS correctement

---

## 🔍 ANALYSE DU CODE

### **Hook usePlans (Correct)** ✅

```typescript
// Plans.tsx ligne 49
const { data: plans } = usePlans({ 
  query: searchQuery, 
  status: showArchived ? 'archived' : 'active'  // ✅ Correct
});

// usePlans.ts lignes 84-91
if (filters?.status) {
  if (filters.status === 'active') {
    query = query.eq('is_active', true);      // ✅ Plans actifs
  } else if (filters.status === 'archived') {
    query = query.eq('is_active', false);     // ✅ Plans archivés
  }
}
```

**Résultat** : Filtre correctement ✅

---

### **Hook useAllPlansWithContent (Incorrect)** ❌

```typescript
// AVANT (Incorrect)
if (!showArchived) {
  plansQuery = plansQuery.eq('is_active', true);  // ✅ OK pour actifs
}
// ❌ Mais si showArchived = true, AUCUN filtre !
// Résultat : Affiche TOUS les plans (actifs + archivés)
```

**Problème** :
- `showArchived = false` → Filtre `is_active = true` ✅
- `showArchived = true` → **Aucun filtre** ❌ → Affiche TOUT

---

## ✅ SOLUTION APPLIQUÉE

### **Correction du Hook useAllPlansWithContent**

```typescript
// APRÈS (Correct)
if (showArchived) {
  // Afficher uniquement les plans archivés
  plansQuery = plansQuery.eq('is_active', false);  // ✅ Archivés seulement
} else {
  // Afficher uniquement les plans actifs
  plansQuery = plansQuery.eq('is_active', true);   // ✅ Actifs seulement
}
```

**Fichier modifié** : `usePlanWithContent.ts` lignes 196-203

---

## 📊 COMPORTEMENT CORRIGÉ

### **Vue "Plans Actifs"**

```typescript
showArchived = false

// Hook usePlans
status = 'active'
→ WHERE is_active = true ✅

// Hook useAllPlansWithContent
showArchived = false
→ WHERE is_active = true ✅

// Résultat : Plans actifs uniquement
```

---

### **Vue "Plans Archivés"**

```typescript
showArchived = true

// Hook usePlans
status = 'archived'
→ WHERE is_active = false ✅

// Hook useAllPlansWithContent
showArchived = true
→ WHERE is_active = false ✅

// Résultat : Plans archivés uniquement
```

---

## 🎯 TESTS DE VÉRIFICATION

### **Test 1 : Restaurer un Plan**

```
1. Vue "Plans Archivés"
   → Plan "Premium Old" visible (is_active = false)
   
2. Clic "🔄 Restaurer"
   → UPDATE is_active = true
   
3. Invalidation des caches
   → queryClient.invalidateQueries(['plans'])
   → queryClient.invalidateQueries(['all-plans-with-content'])
   
4. Rafraîchissement automatique
   → usePlans filtre : is_active = false (aucun résultat)
   → useAllPlansWithContent filtre : is_active = false (aucun résultat)
   
5. Plan disparaît de "Plans Archivés" ✅
   
6. Bascule sur "Plans Actifs"
   → usePlans filtre : is_active = true (trouve le plan)
   → useAllPlansWithContent filtre : is_active = true (trouve le plan)
   
7. Plan apparaît dans "Plans Actifs" ✅
```

**Résultat** : ✅ Plan uniquement dans "Plans Actifs"

---

### **Test 2 : Archiver un Plan**

```
1. Vue "Plans Actifs"
   → Plan "Premium" visible (is_active = true)
   
2. Clic "📦 Archiver"
   → UPDATE is_active = false
   
3. Invalidation des caches
   
4. Rafraîchissement automatique
   → usePlans filtre : is_active = true (aucun résultat)
   → useAllPlansWithContent filtre : is_active = true (aucun résultat)
   
5. Plan disparaît de "Plans Actifs" ✅
   
6. Clic sur "Plans Archivés"
   → usePlans filtre : is_active = false (trouve le plan)
   → useAllPlansWithContent filtre : is_active = false (trouve le plan)
   
7. Plan apparaît dans "Plans Archivés" ✅
```

**Résultat** : ✅ Plan uniquement dans "Plans Archivés"

---

## 🔧 MODIFICATIONS DÉTAILLÉES

### **Fichier : usePlanWithContent.ts**

**Lignes modifiées** : 196-203

**Avant** :
```typescript
// Filtrer par statut si nécessaire
if (!showArchived) {
  plansQuery = plansQuery.eq('is_active', true);
}
```

**Après** :
```typescript
// Filtrer par statut
if (showArchived) {
  // Afficher uniquement les plans archivés
  plansQuery = plansQuery.eq('is_active', false);
} else {
  // Afficher uniquement les plans actifs
  plansQuery = plansQuery.eq('is_active', true);
}
```

---

## ✅ GARANTIES

### **1. Séparation Stricte**

```sql
-- Plans Actifs
SELECT * FROM subscription_plans WHERE is_active = true;

-- Plans Archivés
SELECT * FROM subscription_plans WHERE is_active = false;

-- Intersection = VIDE (aucun plan dans les deux)
```

---

### **2. Cohérence des Hooks**

| Hook | showArchived = false | showArchived = true |
|------|---------------------|---------------------|
| `usePlans` | `is_active = true` | `is_active = false` |
| `useAllPlansWithContent` | `is_active = true` | `is_active = false` |

**Résultat** : Les deux hooks filtrent de la même manière ✅

---

### **3. Invalidation des Caches**

```typescript
// Après restauration/archivage
queryClient.invalidateQueries({ queryKey: ['plans'] });
queryClient.invalidateQueries({ queryKey: ['all-plans-with-content'] });
```

**Résultat** : Les deux hooks rechargent les données ✅

---

## 🎉 RÉSULTAT FINAL

**Avant** ❌ :
- Plans restaurés dans "Plans Actifs" ET "Plans Archivés"
- Confusion totale
- Double affichage

**Après** ✅ :
- **Plans Actifs** : Uniquement `is_active = true`
- **Plans Archivés** : Uniquement `is_active = false`
- **Séparation stricte** : Un plan dans UNE seule vue
- **Cohérence totale** : Les deux hooks filtrent pareil
- **Temps réel** : Rafraîchissement automatique

**Le problème de double affichage est définitivement résolu !** 🚀
