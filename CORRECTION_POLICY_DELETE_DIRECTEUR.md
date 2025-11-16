# 🔧 CORRECTION - Policy DELETE pour Directeur

## ✅ PROBLÈME RÉSOLU

**Date:** 16 Novembre 2025  
**Problème:** Directeur ne peut pas supprimer ses demandes  

---

## 🐛 PROBLÈME

### Symptôme
```
1. Directeur clique "Supprimer"
2. Dialog de confirmation
3. Confirme
4. Rien ne se passe ❌
5. Demande reste affichée
```

### Cause Racine
**Policy RLS trop restrictive**

```sql
-- AVANT (incorrect)
CREATE POLICY "Group admins can delete requests"
ON resource_requests
FOR DELETE
USING (
  -- Seul admin_groupe peut supprimer
  auth.uid() IN (
    SELECT id FROM users
    WHERE school_group_id = resource_requests.school_group_id
    AND role = 'admin_groupe'
  )
);
```

**Résultat:**
- ✅ Admin peut supprimer
- ❌ Directeur NE PEUT PAS supprimer (même ses propres demandes!)

---

## ✅ SOLUTION APPLIQUÉE

### Nouvelle Policy
```sql
-- APRÈS (correct)
CREATE POLICY "Users can delete their pending requests"
ON resource_requests
FOR DELETE
USING (
  -- Admin de groupe peut tout supprimer
  auth.uid() IN (
    SELECT id FROM users
    WHERE school_group_id = resource_requests.school_group_id
    AND role = 'admin_groupe'
  )
  OR
  -- Créateur peut supprimer ses propres demandes en attente
  (requested_by = auth.uid() AND status = 'pending')
);
```

---

## 🔐 PERMISSIONS FINALES

### Directeur/Proviseur
**Peut supprimer:**
- ✅ Ses propres demandes
- ✅ Seulement si statut = 'pending'

**Ne peut PAS supprimer:**
- ❌ Demandes des autres
- ❌ Ses demandes approuvées
- ❌ Ses demandes rejetées
- ❌ Ses demandes complétées

### Admin de Groupe
**Peut supprimer:**
- ✅ TOUTES les demandes
- ✅ Quel que soit le statut
- ✅ Quel que soit le créateur

---

## 🔍 VÉRIFICATION

### Test 1: Directeur Supprime Sa Demande En Attente ✅
```sql
-- User: Orel DEBA (proviseur)
-- Request: status = 'pending', requested_by = Orel
-- Action: DELETE
-- Résultat: ✅ Suppression autorisée
```

### Test 2: Directeur Supprime Demande Approuvée ❌
```sql
-- User: Orel DEBA (proviseur)
-- Request: status = 'approved', requested_by = Orel
-- Action: DELETE
-- Résultat: ❌ Suppression refusée (correct)
```

### Test 3: Directeur Supprime Demande d'un Autre ❌
```sql
-- User: Orel DEBA (proviseur)
-- Request: status = 'pending', requested_by = Autre
-- Action: DELETE
-- Résultat: ❌ Suppression refusée (correct)
```

### Test 4: Admin Supprime N'importe Quoi ✅
```sql
-- User: Admin (admin_groupe)
-- Request: N'importe laquelle
-- Action: DELETE
-- Résultat: ✅ Suppression autorisée
```

---

## 📊 MATRICE DE PERMISSIONS

| Demande | Directeur (créateur) | Directeur (autre) | Admin |
|---------|---------------------|-------------------|-------|
| Sa demande en attente | ✅ Peut supprimer | ❌ Ne peut pas | ✅ Peut supprimer |
| Sa demande approuvée | ❌ Ne peut pas | ❌ Ne peut pas | ✅ Peut supprimer |
| Demande d'un autre (pending) | ❌ Ne peut pas | ❌ Ne peut pas | ✅ Peut supprimer |
| Demande d'un autre (approved) | ❌ Ne peut pas | ❌ Ne peut pas | ✅ Peut supprimer |

---

## 🔄 WORKFLOW COMPLET

### Scénario 1: Directeur Supprime Sa Demande ✅
```
1. Directeur: Orel DEBA
2. Demande: "Besoin" (status: pending, créée par Orel)
3. Clique "Supprimer"
4. Dialog: "Supprimer cette demande ?"
5. Confirme
   ↓
6. Frontend: handleDelete(requestId)
   ↓
7. Backend: Vérifie policy RLS
   - requested_by = Orel ✅
   - status = 'pending' ✅
   - Policy autorise ✅
   ↓
8. Suppression items
9. Suppression demande
10. Toast: "Demande supprimée"
11. Rechargement
12. ✅ Demande disparue
```

### Scénario 2: Directeur Supprime Demande Approuvée ❌
```
1. Directeur: Orel DEBA
2. Demande: "Besoin" (status: approved, créée par Orel)
3. Bouton "Supprimer" NON VISIBLE
   (canDelete = false car status !== 'pending')
4. ❌ Impossible de supprimer (UI bloque)
```

---

## 🎯 COHÉRENCE UI ↔ BDD

### Frontend (UI)
```typescript
const canDeleteRequest = (request: ResourceRequest) => {
  // Admin peut tout supprimer
  if (user?.role === 'admin_groupe') return true;
  
  // Directeur peut supprimer ses propres demandes en attente
  if (request.status === 'pending' && request.requested_by === user?.id) {
    return true;
  }
  
  return false;
};
```

### Backend (RLS)
```sql
-- Même logique!
(requested_by = auth.uid() AND status = 'pending')
OR
(role = 'admin_groupe')
```

**✅ Cohérence parfaite!**

---

## ✅ RÉSULTAT

**Maintenant:**
- ✅ Directeur peut supprimer ses demandes en attente
- ✅ Policy RLS autorise la suppression
- ✅ Bouton "Supprimer" visible et fonctionnel
- ✅ Admin peut toujours tout supprimer
- ✅ Sécurité maintenue (pas de suppression cross-user)
- ✅ Cohérence UI ↔ BDD

**La suppression fonctionne maintenant!** 🗑️✨

---

## 🔒 SÉCURITÉ

### Protection Garantie
- ✅ Directeur ne peut PAS supprimer les demandes des autres
- ✅ Directeur ne peut PAS supprimer ses demandes approuvées
- ✅ Seul admin peut supprimer les demandes approuvées
- ✅ RLS appliqué au niveau BDD (pas de contournement)

### Audit
```sql
-- Voir qui a supprimé quoi (si audit activé)
SELECT * FROM audit_logs 
WHERE action = 'DELETE' 
AND table_name = 'resource_requests';
```

---

**Développé avec ❤️ pour E-Pilot Congo**  
**Version:** 2.6 Policy DELETE Correcte  
**Date:** 16 Novembre 2025  
**Statut:** 🟢 Fonctionnel
