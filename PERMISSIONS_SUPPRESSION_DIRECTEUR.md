# 🗑️ PERMISSIONS SUPPRESSION - Directeur

## ✅ AJOUT DE PERMISSION

**Date:** 16 Novembre 2025  
**Ajout:** Directeur peut supprimer ses propres demandes en attente  

---

## 🎯 NOUVELLE PERMISSION

### Directeur/Proviseur
**Peut maintenant supprimer:**
- ✅ **Ses propres demandes**
- ✅ **Seulement si en attente**
- ❌ Pas les demandes approuvées/rejetées/complétées

### Logique
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

---

## 📊 PERMISSIONS COMPLÈTES

### Directeur/Proviseur (École)

#### Peut Supprimer ✅
- ✅ Ses propres demandes
- ✅ Seulement si statut = "En attente"

#### Ne Peut PAS Supprimer ❌
- ❌ Demandes des autres directeurs
- ❌ Ses demandes approuvées
- ❌ Ses demandes rejetées
- ❌ Ses demandes complétées

---

### Admin de Groupe

#### Peut Supprimer ✅
- ✅ **TOUTES** les demandes
- ✅ Quel que soit le statut
- ✅ Quel que soit le créateur

---

## 🎨 INTERFACE

### Vue Directeur - Demande En Attente
```
┌─────────────────────────────────────────┐
│ Demande: Besoin                         │
│ Statut: ⏳ En attente                   │
├─────────────────────────────────────────┤
│ [Modifier]         [Supprimer] [Fermer] │ ✅
└─────────────────────────────────────────┘
```

### Vue Directeur - Demande Approuvée
```
┌─────────────────────────────────────────┐
│ Demande: Besoin                         │
│ Statut: ✅ Approuvée                    │
├─────────────────────────────────────────┤
│                            [Fermer]     │ ✅
└─────────────────────────────────────────┘
```
**Pas de bouton Supprimer** - Demande approuvée

---

### Vue Admin - Toutes Demandes
```
┌─────────────────────────────────────────┐
│ Demande: Besoin                         │
│ Statut: N'importe lequel                │
├─────────────────────────────────────────┤
│ [Modifier] [Approuver] [Rejeter]        │
│                    [Supprimer] [Fermer] │ ✅
└─────────────────────────────────────────┘
```
**Toujours le bouton Supprimer**

---

## 🔄 SCÉNARIOS

### Scénario 1: Directeur Supprime Sa Demande En Attente ✅
```
1. Directeur crée demande "Fournitures Q1"
2. Statut: "En attente"
3. Ouvre la demande
4. Voit bouton "Supprimer"
5. Clique "Supprimer"
6. Dialog: "Supprimer cette demande ?"
7. Confirme
8. Demande supprimée
9. Toast: "Demande supprimée"
```

---

### Scénario 2: Directeur Essaie de Supprimer Demande Approuvée ❌
```
1. Directeur ouvre sa demande approuvée
2. Statut: "Approuvée"
3. Bouton "Supprimer" NON VISIBLE
4. Seul l'admin peut supprimer
```

---

### Scénario 3: Admin Supprime N'importe Quelle Demande ✅
```
1. Admin ouvre n'importe quelle demande
2. N'importe quel statut
3. Bouton "Supprimer" TOUJOURS VISIBLE
4. Clique "Supprimer"
5. Confirme
6. Demande supprimée
```

---

## 🔐 SÉCURITÉ BDD

### Policy DELETE Existante
```sql
CREATE POLICY "Users can delete request items"
ON resource_request_items
FOR DELETE
USING (
  request_id IN (
    SELECT id FROM resource_requests
    WHERE (
      -- Admin de groupe
      auth.uid() IN (
        SELECT id FROM users
        WHERE school_group_id = resource_requests.school_group_id
        AND role = 'admin_groupe'
      )
      OR
      -- Créateur de la demande (si en attente)
      (requested_by = auth.uid() AND status = 'pending')
    )
  )
);
```

**Cette policy permet déjà:**
- ✅ Admin de supprimer tout
- ✅ Créateur de supprimer ses demandes en attente

---

## 📋 TABLEAU RÉCAPITULATIF

| Cas | Directeur | Admin |
|-----|-----------|-------|
| Sa demande en attente | ✅ Peut supprimer | ✅ Peut supprimer |
| Sa demande approuvée | ❌ Ne peut pas | ✅ Peut supprimer |
| Sa demande rejetée | ❌ Ne peut pas | ✅ Peut supprimer |
| Sa demande complétée | ❌ Ne peut pas | ✅ Peut supprimer |
| Demande d'un autre | ❌ Ne peut pas | ✅ Peut supprimer |

---

## ✅ RÉSULTAT

**Maintenant:**
- ✅ Directeur voit bouton "Supprimer" sur ses demandes en attente
- ✅ Directeur peut supprimer ses demandes en attente
- ✅ Directeur ne peut PAS supprimer les demandes approuvées
- ✅ Admin peut toujours tout supprimer
- ✅ Permissions cohérentes avec la BDD
- ✅ Sécurité maintenue

**Le directeur peut maintenant supprimer ses demandes en attente!** 🗑️✨

---

## 💡 JUSTIFICATION

### Pourquoi Permettre au Directeur de Supprimer?

**Cas d'usage:**
1. **Erreur de saisie** - Directeur crée demande par erreur
2. **Doublon** - Directeur crée 2 fois la même demande
3. **Changement de plan** - Besoin annulé avant approbation
4. **Correction** - Préfère supprimer et recréer

**Sécurité:**
- ✅ Seulement ses propres demandes
- ✅ Seulement si en attente
- ✅ Une fois approuvée, seul admin peut supprimer
- ✅ Cohérent avec la possibilité de modifier

---

**Développé avec ❤️ pour E-Pilot Congo**  
**Version:** 2.4 Suppression Directeur  
**Date:** 16 Novembre 2025  
**Statut:** 🟢 Fonctionnel
