# 🏗️ ARCHITECTURE DES RÔLES E-PILOT

**Date** : 9 novembre 2025, 21:05  
**Statut** : ✅ CORRIGÉ ET VALIDÉ

---

## 📊 HIÉRARCHIE DES RÔLES

```
┌─────────────────────────────────────────────────────────────┐
│ 1️⃣ SUPER ADMIN E-PILOT (Plateforme)                        │
│    • Crée les Groupes Scolaires                             │
│    • Crée les Catégories Métiers (8 catégories)            │
│    • Crée les Modules Pédagogiques (50 modules)            │
│    • Définit les Plans d'abonnement (Gratuit→Institutionnel)│
│    • Gère les abonnements des groupes                       │
│    • Voit les finances globales de la plateforme            │
│    ❌ NE GÈRE PAS LES ÉCOLES                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2️⃣ ADMIN DE GROUPE SCOLAIRE (Réseau d'écoles)              │
│    • Voit les modules/catégories selon son PLAN            │
│    • Crée les Écoles de son groupe                          │
│    • Crée les Utilisateurs (enseignants, CPE, comptables)  │
│    • Affecte les utilisateurs aux écoles                    │
│    • Assigne les RÔLES aux utilisateurs                     │
│    • Assigne les MODULES/CATÉGORIES selon le rôle          │
│    • Gère les finances de son groupe                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3️⃣ UTILISATEURS (Personnel des écoles)                      │
│    • Enseignant, CPE, Comptable, Surveillant, etc.         │
│    • Accèdent uniquement aux modules qui leur sont assignés │
│    • Travaillent dans UNE école spécifique                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 RESPONSABILITÉS PAR RÔLE

### **1️⃣ SUPER ADMIN E-PILOT**

**Responsabilités** :
- ✅ Créer et gérer les **Groupes Scolaires**
- ✅ Créer et gérer les **Catégories Métiers** (8 catégories)
- ✅ Créer et gérer les **Modules Pédagogiques** (50 modules)
- ✅ Définir les **Plans d'abonnement** (Gratuit, Premium, Pro, Institutionnel)
- ✅ Gérer les **Abonnements** des groupes
- ✅ Voir les **Finances globales** de la plateforme
- ✅ Gérer les **Utilisateurs** (Super Admin et Admin Groupe uniquement)
- ✅ Voir les **Rapports globaux**
- ✅ Gérer les **Demandes d'upgrade** des groupes

**Restrictions** :
- ❌ **NE GÈRE PAS LES ÉCOLES** (c'est le rôle de l'Admin Groupe)
- ❌ Ne crée pas d'utilisateurs d'école (enseignants, CPE, etc.)
- ❌ N'assigne pas de modules aux utilisateurs

**Menu visible** :
- Tableau de bord
- Groupes Scolaires
- Plans & Tarifs
- Abonnements
- Demandes d'Upgrade
- Catégories Métiers
- Modules Pédagogiques
- Finances (globales)
- Utilisateurs (Super Admin + Admin Groupe)
- Communication
- Rapports
- Journal d'Activité
- Corbeille

---

### **2️⃣ ADMIN DE GROUPE SCOLAIRE**

**Responsabilités** :
- ✅ Créer et gérer les **Écoles** de son groupe
- ✅ Créer et gérer les **Utilisateurs** de son groupe (enseignants, CPE, comptables, etc.)
- ✅ Affecter les utilisateurs aux écoles
- ✅ Assigner les **Rôles** aux utilisateurs
- ✅ Assigner les **Modules/Catégories** selon le rôle
- ✅ Voir les modules/catégories selon son **Plan d'abonnement**
- ✅ Gérer les **Finances** de son groupe
- ✅ Demander des **Upgrades** de plan

**Restrictions** :
- ❌ Ne peut pas créer de groupes scolaires
- ❌ Ne peut pas créer de catégories métiers
- ❌ Ne peut pas créer de modules pédagogiques
- ❌ Ne peut pas modifier les plans d'abonnement
- ❌ Ne voit que les données de son groupe

**Menu visible** :
- Tableau de bord
- Écoles (de son groupe)
- Finances (de son groupe)
- Mes Modules (selon son plan)
- Utilisateurs (de son groupe)
- Assigner Modules
- Communication
- Rapports (de son groupe)
- Journal d'Activité
- Corbeille

---

### **3️⃣ UTILISATEURS (Personnel des écoles)**

**Responsabilités** :
- ✅ Accéder aux **Modules assignés** par l'Admin Groupe
- ✅ Travailler dans **UNE école spécifique**
- ✅ Utiliser les fonctionnalités selon leur rôle

**Restrictions** :
- ❌ Ne peuvent pas créer d'écoles
- ❌ Ne peuvent pas créer d'utilisateurs
- ❌ Ne peuvent pas assigner de modules
- ❌ Accès limité aux modules assignés

**Rôles disponibles** :
- Directeur / Proviseur
- Directeur des Études
- Enseignant
- CPE (Conseiller Principal d'Éducation)
- Comptable
- Secrétaire
- Surveillant
- Bibliothécaire
- Infirmier
- Psychologue

---

## 🔧 CORRECTIONS APPLIQUÉES

### **Problème identifié** :
Le menu "Gestion Écoles" était visible pour le Super Admin, ce qui contredisait l'architecture E-Pilot.

### **Corrections** :

1. **DashboardLayout.tsx** ✅
   - ❌ Supprimé : Menu "Gestion Écoles" pour Super Admin
   - ✅ Conservé : Menu "Écoles" pour Admin Groupe uniquement

2. **App.tsx** ✅
   - ❌ Supprimé : Route `/dashboard/schools-admin` pour Super Admin
   - ❌ Supprimé : Import `SchoolsSuperAdmin`
   - ✅ Conservé : Route `/dashboard/schools` pour Admin Groupe uniquement

---

## 📋 MENU PAR RÔLE

### **Super Admin E-Pilot**
```
✅ Tableau de bord
✅ Groupes Scolaires
✅ Plans & Tarifs
✅ Abonnements
✅ Demandes d'Upgrade
✅ Catégories Métiers
✅ Modules Pédagogiques
✅ Finances (globales)
✅ Utilisateurs (Super Admin + Admin Groupe)
✅ Communication
✅ Rapports
✅ Journal d'Activité
✅ Corbeille
❌ Écoles (NE DOIT PAS APPARAÎTRE)
```

### **Admin de Groupe Scolaire**
```
✅ Tableau de bord
✅ Écoles (de son groupe)
✅ Finances (de son groupe)
✅ Mes Modules (selon son plan)
✅ Utilisateurs (de son groupe)
✅ Assigner Modules
✅ Communication
✅ Rapports (de son groupe)
✅ Journal d'Activité
✅ Corbeille
❌ Groupes Scolaires (NE DOIT PAS APPARAÎTRE)
❌ Plans & Tarifs (NE DOIT PAS APPARAÎTRE)
❌ Catégories Métiers (NE DOIT PAS APPARAÎTRE)
❌ Modules Pédagogiques (NE DOIT PAS APPARAÎTRE)
```

### **Utilisateurs (Personnel des écoles)**
```
✅ Tableau de bord
✅ Mes Modules (assignés)
✅ Mon Profil
✅ Mon Emploi du Temps
✅ Mes Catégories
❌ Écoles (NE DOIT PAS APPARAÎTRE)
❌ Utilisateurs (NE DOIT PAS APPARAÎTRE)
❌ Finances (NE DOIT PAS APPARAÎTRE)
```

---

## 🔐 SÉCURITÉ

### **Routes protégées** :
- Chaque route est protégée par `<ProtectedRoute roles={[...]}>`
- Les rôles sont vérifiés côté frontend ET backend
- RLS (Row Level Security) activé dans Supabase

### **Filtrage des données** :
- Super Admin : Voit TOUTES les données
- Admin Groupe : Voit uniquement les données de son groupe
- Utilisateurs : Voient uniquement les données de leur école

---

## 🎯 WORKFLOW COMPLET

### **1. Super Admin crée un Groupe Scolaire**
```
Super Admin → Crée "Groupe E-Pilot Congo"
            → Assigne un Plan (ex: Premium)
            → Crée un Admin Groupe pour ce groupe
```

### **2. Admin Groupe crée des Écoles**
```
Admin Groupe → Se connecte
             → Voit les modules selon son Plan
             → Crée "École Saint-Joseph"
             → Crée "École Sainte-Marie"
```

### **3. Admin Groupe crée des Utilisateurs**
```
Admin Groupe → Crée "Jean Dupont" (Enseignant)
             → Affecte à "École Saint-Joseph"
             → Assigne le rôle "Enseignant"
             → Assigne les modules (Gestion Notes, Emploi du Temps)
```

### **4. Utilisateur accède à ses Modules**
```
Jean Dupont → Se connecte
            → Voit uniquement ses modules assignés
            → Travaille dans "École Saint-Joseph"
```

---

## ✅ RÉSULTAT FINAL

**✅ L'architecture E-Pilot est maintenant correcte !**

- ✅ **Super Admin** : Gère la plateforme (groupes, plans, catégories, modules)
- ✅ **Admin Groupe** : Gère son réseau d'écoles (écoles, utilisateurs, assignations)
- ✅ **Utilisateurs** : Utilisent les modules assignés dans leur école
- ✅ **Séparation claire** des responsabilités
- ✅ **Sécurité** : Routes et données protégées par rôle

**Le Super Admin ne voit plus "Gestion Écoles" dans son menu !** 🚀

---

## 📁 FICHIERS MODIFIÉS

### **Frontend**
- ✅ `src/features/dashboard/components/DashboardLayout.tsx`
- ✅ `src/App.tsx`

### **Documentation**
- ✅ `ARCHITECTURE_ROLES_E-PILOT.md` (ce fichier)

---

**L'architecture E-Pilot respecte maintenant la hiérarchie des rôles !** 🎯
