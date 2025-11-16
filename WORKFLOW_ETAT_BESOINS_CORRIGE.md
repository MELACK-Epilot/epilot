# 🔄 WORKFLOW ÉTAT DES BESOINS - CORRIGÉ

## ✅ LOGIQUE CORRECTE IMPLÉMENTÉE

**Date:** 16 Novembre 2025  
**Correction:** Workflow École → Admin Groupe  

---

## 🎯 WORKFLOW CORRECT

### Direction du Flux
```
ÉCOLE (Directeur/Proviseur)
    ↓ Soumet besoin
ADMIN DE GROUPE
    ↓ Approuve/Rejette
ÉCOLE (Directeur)
    ↓ Reçoit ressources
ADMIN DE GROUPE
    ← Marque comme complété
```

---

## 👥 RÔLES ET ACTIONS

### 1. DIRECTEUR / PROVISEUR (École)
**Rôle:** Demandeur de ressources

**Actions:**
- ✅ **Créer** une demande de ressources
- ✅ **Voir** ses propres demandes
- ✅ **Modifier** ses demandes en attente
- ❌ **Ne peut PAS** approuver/rejeter
- ❌ **Ne peut PAS** voir les demandes des autres écoles

**Workflow:**
```
1. Identifie les besoins de son école
2. Crée une demande avec liste de ressources
3. Soumet à l'admin de groupe
4. Attend l'approbation
5. Reçoit les ressources si approuvé
```

---

### 2. ADMIN DE GROUPE
**Rôle:** Gestionnaire et approbateur

**Actions:**
- ✅ **Voir** TOUTES les demandes du groupe
- ✅ **Approuver** les demandes
- ✅ **Rejeter** les demandes
- ✅ **Compléter** les demandes (ressources livrées)
- ✅ **Supprimer** les demandes
- ✅ **Créer** des demandes (si besoin)

**Workflow:**
```
1. Reçoit les demandes des écoles
2. Examine les besoins et justifications
3. Approuve ou rejette selon budget/priorité
4. Organise l'achat/livraison
5. Marque comme complété une fois livré
```

---

## 📊 FILTRAGE DES DONNÉES

### Pour Directeur/Proviseur
```typescript
// Ne voir QUE les demandes de SON école
query = query
  .eq('school_group_id', schoolGroupId)
  .eq('school_id', userSchoolId);
```

**Résultat:**
- Voit uniquement ses propres demandes
- Ne voit pas les demandes des autres écoles
- Peut suivre l'état de ses demandes

---

### Pour Admin de Groupe
```typescript
// Voir TOUTES les demandes du groupe
query = query
  .eq('school_group_id', schoolGroupId);
```

**Résultat:**
- Voit toutes les demandes de toutes les écoles
- Peut filtrer par école
- Peut filtrer par statut/priorité
- Vue d'ensemble complète

---

## 🎨 INTERFACE ADAPTÉE

### Directeur/Proviseur
```
┌─────────────────────────────────────────┐
│  État des Besoins                       │
│  Soumettez vos besoins en ressources    │
│  à l'administration du groupe           │
│                                         │
│  [Soumettre un besoin]                  │
└─────────────────────────────────────────┘

KPIs:
- Mes demandes totales
- En attente d'approbation
- Approuvées
- Rejetées
- Montant demandé
- Montant approuvé
```

---

### Admin de Groupe
```
┌─────────────────────────────────────────┐
│  État des Besoins                       │
│  Gérez les demandes de ressources       │
│  de vos écoles                          │
│                                         │
│  [Nouvelle demande]                     │
└─────────────────────────────────────────┘

KPIs:
- Total demandes (toutes écoles)
- En attente de traitement
- Approuvées
- Rejetées
- Budget total demandé
- Budget approuvé

Filtres:
- Par école
- Par statut
- Par priorité
```

---

## 🔐 PERMISSIONS DÉTAILLÉES

### Créer Demande
```typescript
const canCreate = [
  'proviseur',        // ✅ Peut créer pour son école
  'directeur',        // ✅ Peut créer pour son école
  'directeur_etudes', // ✅ Peut créer pour son école
  'admin_groupe',     // ✅ Peut créer (cas exceptionnel)
].includes(role);
```

### Approuver/Rejeter
```typescript
const canApprove = [
  'admin_groupe',     // ✅ Seul à pouvoir approuver
].includes(role);
```

### Compléter (Marquer livré)
```typescript
const canComplete = [
  'admin_groupe',     // ✅ Confirme la livraison
].includes(role);
```

### Supprimer
```typescript
const canDelete = 
  role === 'admin_groupe' ||           // ✅ Admin peut tout supprimer
  (role === 'proviseur' && 
   request.requested_by === userId &&  // ✅ Directeur peut supprimer
   request.status === 'pending');      //    ses demandes en attente
```

---

## 📋 SCÉNARIOS D'UTILISATION

### Scénario 1: Demande Normale
```
1. Directeur École A identifie besoin de 50 cahiers
2. Crée une demande "Fournitures rentrée"
3. Ajoute items: 50 cahiers × 500 FCFA
4. Soumet à admin_groupe
5. Admin_groupe reçoit notification
6. Admin_groupe examine et approuve
7. Admin_groupe organise achat
8. Admin_groupe livre à École A
9. Admin_groupe marque comme "Complété"
10. Directeur voit statut "Complétée"
```

---

### Scénario 2: Demande Urgente
```
1. Directeur École B: besoin urgent projecteur
2. Crée demande avec priorité "Urgente"
3. Justification: "Présentation inspection demain"
4. Admin_groupe voit priorité rouge
5. Admin_groupe approuve rapidement
6. Livraison express
7. Marque comme complété
```

---

### Scénario 3: Demande Rejetée
```
1. Directeur École C demande 10 ordinateurs
2. Montant: 5,000,000 FCFA
3. Admin_groupe examine
4. Budget insuffisant
5. Admin_groupe rejette avec note:
   "Budget dépassé, réduire à 5 ordinateurs"
6. Directeur voit statut "Rejetée" + note
7. Directeur crée nouvelle demande ajustée
```

---

## 🔄 ÉTATS DE LA DEMANDE

### 1. ⏳ En Attente (pending)
- **Créée par:** Directeur
- **Visible par:** Directeur + Admin
- **Actions possibles:**
  - Directeur: Modifier, Supprimer
  - Admin: Approuver, Rejeter

### 2. ✅ Approuvée (approved)
- **Approuvée par:** Admin
- **Visible par:** Directeur + Admin
- **Actions possibles:**
  - Admin: Compléter, Supprimer

### 3. ❌ Rejetée (rejected)
- **Rejetée par:** Admin
- **Visible par:** Directeur + Admin
- **Actions possibles:**
  - Admin: Supprimer
  - Directeur: Voir raison

### 4. 🎉 Complétée (completed)
- **Complétée par:** Admin
- **Visible par:** Directeur + Admin
- **Actions possibles:**
  - Admin: Supprimer (archivage)

---

## 📊 NOTIFICATIONS (À implémenter)

### Pour Directeur
- ✅ Demande approuvée
- ✅ Demande rejetée
- ✅ Demande complétée (ressources livrées)

### Pour Admin
- ✅ Nouvelle demande soumise
- ✅ Demande urgente créée

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Filtrage des Données ✅
```typescript
// Directeur: Voir uniquement ses demandes
if (['proviseur', 'directeur', 'directeur_etudes'].includes(role)) {
  query = query.eq('school_id', userSchoolId);
}
```

### 2. Textes Adaptés ✅
```typescript
// Directeur
"Soumettez vos besoins en ressources à l'administration du groupe"
"Soumettre un besoin"

// Admin
"Gérez les demandes de ressources de vos écoles"
"Nouvelle demande"
```

### 3. Permissions Claires ✅
- Directeur: Créer, Voir ses demandes
- Admin: Tout gérer, Voir tout

---

## 🎯 RÉSULTAT

**Le workflow est maintenant CORRECT:**
- ✅ École soumet → Admin approuve
- ✅ Directeur voit ses demandes uniquement
- ✅ Admin voit toutes les demandes
- ✅ Permissions cohérentes
- ✅ Textes adaptés au rôle

**Logique métier respectée!** ✨🎉

---

**Développé avec ❤️ pour E-Pilot Congo**  
**Version:** 1.1 Corrigée  
**Date:** 16 Novembre 2025  
**Statut:** 🟢 Workflow Correct
