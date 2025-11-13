# ✅ FILTRAGE STRICT - Plans Actifs vs Archivés

**Date** : 9 novembre 2025, 23:00  
**Problème corrigé** : Séparation stricte entre plans actifs et archivés

---

## ❌ PROBLÈME IDENTIFIÉ

### **Plans Apparaissaient dans les Deux Vues**

**Avant** :
- Plan restauré → Apparaissait dans "Plans Actifs" ET "Plans Archivés"
- Plan archivé → Apparaissait dans "Plans Actifs" ET "Plans Archivés"
- Confusion totale pour l'utilisateur

**Cause** :
```typescript
// ❌ AVANT : Affichait TOUS les plans quand showArchived = true
const { data: plans } = usePlans({ 
  query: searchQuery, 
  status: showArchived ? 'all' : 'active'  // ← Problème ici
});
```

---

## ✅ SOLUTION APPLIQUÉE

### **1. Correction du Paramètre de Filtrage**

```typescript
// ✅ APRÈS : Filtre strict par statut
const { data: plans } = usePlans({ 
  query: searchQuery, 
  status: showArchived ? 'archived' : 'active'  // ← Corrigé
});
```

**Résultat** :
- `showArchived = false` → Affiche uniquement `is_active = true`
- `showArchived = true` → Affiche uniquement `is_active = false`

---

### **2. Mise à Jour du Hook usePlans**

```typescript
// Hook : usePlans.ts
if (filters?.status) {
  if (filters.status === 'active') {
    query = query.eq('is_active', true);      // ← Plans actifs uniquement
  } else if (filters.status === 'archived') {
    query = query.eq('is_active', false);     // ← Plans archivés uniquement
  }
  // Si 'all', on ne filtre pas (pour usage futur)
}
```

---

## 🔄 COMPORTEMENT CORRIGÉ

### **Vue "Plans Actifs"**

```sql
-- Requête SQL
SELECT * FROM subscription_plans 
WHERE is_active = true
ORDER BY price ASC;
```

**Affiche** :
- ✅ Plans avec `is_active = true`
- ❌ Plans avec `is_active = false` (cachés)

**Boutons disponibles** :
- [✏️ Modifier] [📦 Archiver] [🗑️ Supprimer]

---

### **Vue "Plans Archivés"**

```sql
-- Requête SQL
SELECT * FROM subscription_plans 
WHERE is_active = false
ORDER BY price ASC;
```

**Affiche** :
- ✅ Plans avec `is_active = false`
- ❌ Plans avec `is_active = true` (cachés)

**Boutons disponibles** :
- [🔄 Restaurer] [🗑️ Supprimer]

---

## 📊 SCÉNARIOS DE TEST

### **Scénario 1 : Archiver un Plan**

```
1. Vue "Plans Actifs"
   → Plan "Premium" visible (is_active = true)
   
2. Clic sur "📦 Archiver"
   → UPDATE is_active = false
   
3. Rafraîchissement automatique
   → Plan "Premium" disparaît de "Plans Actifs"
   
4. Clic sur "Plans Archivés"
   → Plan "Premium" apparaît (is_active = false)
```

**Résultat** : ✅ Plan uniquement dans "Plans Archivés"

---

### **Scénario 2 : Restaurer un Plan**

```
1. Vue "Plans Archivés"
   → Plan "Premium Old" visible (is_active = false)
   
2. Clic sur "🔄 Restaurer"
   → UPDATE is_active = true
   
3. Rafraîchissement automatique
   → Plan "Premium Old" disparaît de "Plans Archivés"
   → Bascule automatique sur "Plans Actifs"
   
4. Vue "Plans Actifs"
   → Plan "Premium Old" apparaît (is_active = true)
```

**Résultat** : ✅ Plan uniquement dans "Plans Actifs"

---

### **Scénario 3 : Supprimer Définitivement**

```
1. Vue "Plans Archivés" (ou "Plans Actifs")
   → Plan "Starter" visible
   
2. Clic sur "🗑️ Supprimer"
   → DELETE FROM subscription_plans
   
3. Rafraîchissement automatique
   → Plan "Starter" disparaît complètement
   
4. Vérification dans les deux vues
   → Plan n'existe plus nulle part
```

**Résultat** : ✅ Plan supprimé définitivement

---

## 🎯 RÈGLES DE FILTRAGE

### **Statuts Disponibles**

| Statut | Valeur SQL | Description |
|--------|------------|-------------|
| `'active'` | `is_active = true` | Plans actifs uniquement |
| `'archived'` | `is_active = false` | Plans archivés uniquement |
| `'all'` | Pas de filtre | Tous les plans (non utilisé) |

---

### **Mapping Vue → Statut**

```typescript
// Plans.tsx
const status = showArchived ? 'archived' : 'active';

// showArchived = false → status = 'active'  → is_active = true
// showArchived = true  → status = 'archived' → is_active = false
```

---

## ✅ AVANTAGES

### **1. Séparation Claire**

- ✅ Plans actifs dans "Plans Actifs"
- ✅ Plans archivés dans "Plans Archivés"
- ✅ Aucun doublon
- ✅ Aucune confusion

---

### **2. Cohérence des Données**

- ✅ Un plan ne peut être que dans UNE vue
- ✅ État synchronisé avec la BDD
- ✅ Pas de décalage
- ✅ Pas de plans fantômes

---

### **3. UX Améliorée**

- ✅ Utilisateur sait toujours où chercher
- ✅ Pas de surprise (plan qui apparaît partout)
- ✅ Navigation intuitive
- ✅ Feedback clair

---

## 🔍 VÉRIFICATION

### **Test 1 : Plan Actif**

```sql
-- Vérifier qu'un plan actif n'apparaît PAS dans les archivés
SELECT * FROM subscription_plans 
WHERE name = 'Premium' AND is_active = true;

-- Résultat : 1 ligne
-- Doit apparaître dans "Plans Actifs" uniquement
```

---

### **Test 2 : Plan Archivé**

```sql
-- Vérifier qu'un plan archivé n'apparaît PAS dans les actifs
SELECT * FROM subscription_plans 
WHERE name = 'Premium Old' AND is_active = false;

-- Résultat : 1 ligne
-- Doit apparaître dans "Plans Archivés" uniquement
```

---

### **Test 3 : Compteurs**

```sql
-- Compter les plans actifs
SELECT COUNT(*) FROM subscription_plans WHERE is_active = true;

-- Compter les plans archivés
SELECT COUNT(*) FROM subscription_plans WHERE is_active = false;

-- Total = actifs + archivés
```

---

## 📁 FICHIERS MODIFIÉS

### **1. Plans.tsx**

```typescript
// Ligne 49
const { data: plans } = usePlans({ 
  query: searchQuery, 
  status: showArchived ? 'archived' : 'active'  // ← Modifié
});
```

---

### **2. usePlans.ts**

```typescript
// Lignes 84-91
if (filters?.status) {
  if (filters.status === 'active') {
    query = query.eq('is_active', true);      // ← Ajouté
  } else if (filters.status === 'archived') {
    query = query.eq('is_active', false);     // ← Ajouté
  }
}
```

---

## 🎉 RÉSULTAT FINAL

**Avant** ❌ :
- Plans apparaissaient dans les deux vues
- Confusion totale
- Pas de séparation claire

**Après** ✅ :
- **Plans Actifs** : Uniquement `is_active = true`
- **Plans Archivés** : Uniquement `is_active = false`
- **Séparation stricte** : Un plan dans UNE seule vue
- **Cohérence totale** : État synchronisé avec la BDD

**La séparation entre plans actifs et archivés est maintenant parfaite !** 🚀
