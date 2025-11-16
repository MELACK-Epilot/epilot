# 📋 ÉTAT DES BESOINS - PROGRESSION

## ✅ CE QUI A ÉTÉ FAIT

### 1. Store Zustand ✅
**Fichier:** `src/features/resource-requests/store/useResourceRequestsStore.ts`

**Fonctionnalités:**
- ✅ État global des demandes
- ✅ Actions optimistes (add, update, delete)
- ✅ Actions statut (approve, reject, complete)
- ✅ Types TypeScript complets

**Types:**
```typescript
- ResourceRequest (demande complète)
- ResourceRequestItem (item de demande)
- RequestStatus: 'pending' | 'approved' | 'rejected' | 'completed'
- RequestPriority: 'low' | 'normal' | 'high' | 'urgent'
```

---

### 2. Hook Optimisé ✅
**Fichier:** `src/features/resource-requests/hooks/useResourceRequestsOptimized.ts`

**Fonctionnalités:**
- ✅ `loadRequests()` - Charger depuis BDD
- ✅ `createRequest()` - Créer demande + items
- ✅ `handleApprove()` - Approuver (optimistic)
- ✅ `handleReject()` - Rejeter (optimistic)
- ✅ `handleComplete()` - Compléter (optimistic)
- ✅ `handleDelete()` - Supprimer (optimistic)

**Optimistic Updates:**
- Update immédiat de l'UI
- Requête BDD en arrière-plan
- Rollback si erreur

---

### 3. Structure BDD Vérifiée ✅

#### Table `resource_requests`
```sql
- id (uuid)
- school_id (uuid)
- school_group_id (uuid)
- requested_by (uuid)
- status (varchar) - pending, approved, rejected, completed
- priority (varchar) - low, normal, high, urgent
- title (varchar)
- description (text)
- notes (text)
- total_estimated_amount (numeric)
- created_at (timestamp)
- updated_at (timestamp)
- approved_at (timestamp)
- approved_by (uuid)
- completed_at (timestamp)
```

#### Table `resource_request_items`
```sql
- id (uuid)
- request_id (uuid)
- resource_name (varchar)
- resource_category (varchar)
- quantity (integer)
- unit (varchar)
- unit_price (numeric)
- total_price (numeric)
- justification (text)
- created_at (timestamp)
```

---

## 🔄 CE QUI RESTE À FAIRE

### 1. Modal Créer Demande 🔄
**À créer:** `CreateRequestModal.tsx`

**Fonctionnalités:**
- Formulaire multi-étapes
- Ajout d'items dynamique
- Calcul automatique du total
- Validation des champs

**Structure:**
```typescript
<CreateRequestModal
  open={open}
  onOpenChange={setOpen}
  onSubmit={createRequest}
  schools={schools}
/>
```

---

### 2. Modal Voir Détails 🔄
**À créer:** `ViewRequestModal.tsx`

**Fonctionnalités:**
- Affichage détails demande
- Liste des items
- Historique des actions
- Boutons d'action (Approuver, Rejeter, etc.)

---

### 3. Page Optimisée 🔄
**À créer:** `ResourceRequestsPageOptimized.tsx`

**Fonctionnalités:**
- Utilise le hook optimisé
- KPIs avec StatsCard
- Liste des demandes
- Filtres et tri
- Modals intégrés

---

### 4. Temps Réel 🔄
**À faire:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE resource_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE resource_request_items;
```

**Hook:** `useRealtimeResourceRequests.ts`

---

### 5. Composants Manquants 🔄

#### RequestCard
- Affichage d'une demande
- Badges statut/priorité
- Actions rapides

#### RequestFilters
- Filtre par statut
- Filtre par priorité
- Filtre par école
- Recherche

#### RequestStats
- KPIs avec StatsCard
- Total demandes
- En attente
- Approuvées
- Rejetées

---

## 📊 KPIs À Implémenter

### 1. Total Demandes
```typescript
value={requests.length}
```

### 2. En Attente
```typescript
value={requests.filter(r => r.status === 'pending').length}
```

### 3. Approuvées
```typescript
value={requests.filter(r => r.status === 'approved').length}
```

### 4. Rejetées
```typescript
value={requests.filter(r => r.status === 'rejected').length}
```

### 5. Montant Total
```typescript
value={requests.reduce((sum, r) => sum + (r.total_estimated_amount || 0), 0)}
```

### 6. Montant Approuvé
```typescript
value={requests
  .filter(r => r.status === 'approved')
  .reduce((sum, r) => sum + (r.total_estimated_amount || 0), 0)}
```

---

## 🎨 Design Badges

### Statut
```typescript
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};
```

### Priorité
```typescript
const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};
```

---

## 🔐 Permissions

### Créer Demande
```typescript
const canCreate = ['proviseur', 'directeur', 'directeur_etudes', 'comptable'].includes(role);
```

### Approuver/Rejeter
```typescript
const canApprove = ['admin_groupe', 'proviseur'].includes(role);
```

### Supprimer
```typescript
const canDelete = role === 'admin_groupe' || request.requested_by === userId;
```

---

## 📝 Prochaines Étapes

1. ✅ Store Zustand créé
2. ✅ Hook optimisé créé
3. 🔄 Créer CreateRequestModal
4. 🔄 Créer ViewRequestModal
5. 🔄 Créer RequestCard
6. 🔄 Créer ResourceRequestsPageOptimized
7. 🔄 Activer temps réel
8. 🔄 Intégrer dans App.tsx
9. 🔄 Tester toutes les fonctionnalités

---

## 🎯 Objectif Final

**Page État des Besoins avec:**
- ✅ Connexion BDD complète
- ✅ Optimistic updates
- ✅ Temps réel
- ✅ Modals CRUD
- ✅ KPIs dynamiques
- ✅ Filtres et tri
- ✅ Permissions par rôle

**Prêt pour la production!** 🚀

---

**Date:** 16 Novembre 2025  
**Statut:** 🟡 En cours (40% complété)  
**Prochaine étape:** Créer les modals
