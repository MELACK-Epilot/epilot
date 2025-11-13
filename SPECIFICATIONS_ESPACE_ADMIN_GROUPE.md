# 🎛️ Spécifications Complètes - Espace Admin Groupe

**Date**: 1er novembre 2025  
**Version**: 1.0  
**Statut**: 📋 **SPÉCIFICATIONS DÉFINIES**

---

## 🎯 Vue d'Ensemble

L'espace Admin Groupe est un **espace privé complètement séparé** où l'administrateur d'un groupe scolaire peut gérer ses écoles, utilisateurs et élèves dans les limites de son plan d'abonnement.

---

## 📊 Fonctionnalités Principales

### 1. Dashboard Principal
- Statistiques globales avec barres de progression
- Informations du groupe et du plan
- Activité récente
- Alertes automatiques (quotas > 80%)

### 2. Gestion des Écoles
- CRUD complet avec vérification quotas
- Filtrage par statut
- Statistiques par école

### 3. Gestion des Utilisateurs
- Création avec mot de passe temporaire
- Génération automatique d'identifiants
- Email de bienvenue
- Forcer changement mot de passe

### 4. Gestion des Élèves
- CRUD complet
- Matricule auto-généré
- Import CSV/Excel avec vérification quotas
- Contact parents

### 5. Visualisation Plan et Quotas
- Affichage plan actuel (lecture seule)
- Barres de progression quotas
- Comparaison plans disponibles
- Historique paiements

### 6. Profil et Paramètres
- Modification informations personnelles
- Changement mot de passe
- Restrictions : pas de modification plan/groupe

---

## 🔒 Règles de Sécurité

### Isolation des Données
```sql
-- TOUTES les requêtes incluent:
WHERE groupe_scolaire_id = :groupe_id_from_token
```

### Vérifications Systématiques
1. Authentification (token valide ?)
2. Autorisation (ressource appartient au groupe ?)
3. Quota (limite non atteinte ?)
4. Validation métier (données valides ?)
5. Opération en base

### Validation des Quotas
```typescript
// Ordre de vérification
if (currentCount >= maxQuota) {
  throw new QuotaExceededError();
}
```

---

## 📱 Structure Frontend

### Routes
```
/groupe/login                    → Connexion dédiée
/groupe/dashboard                → Tableau de bord
/groupe/ecoles                   → Gestion écoles
/groupe/utilisateurs             → Gestion utilisateurs
/groupe/eleves                   → Gestion élèves
/groupe/plan                     → Plan et quotas
/groupe/profil                   → Profil admin
```

### Composants Essentiels
- `QuotaProgressBar` : Barre de progression avec alertes
- `QuotaGuard` : Bloquer actions si quota atteint
- `TableauDeBord` : Cards statistiques
- `CreateUserDialog` : Affichage identifiants temporaires

---

## 🚀 Processus de Création Initial

### Par le Super Admin
1. Crée le `groupe_scolaire` avec `plan_id`
2. Crée l'`admin_groupe` avec mot de passe temporaire
3. Envoie email avec identifiants

### Première Connexion Admin Groupe
1. Se connecte avec identifiants temporaires
2. Forcé de changer son mot de passe
3. Accède à son espace vide
4. Commence à créer ses ressources

---

**Voir les fichiers détaillés pour l'implémentation complète** :
- `ARCHITECTURE_HIERARCHIQUE.md`
- `PERMISSIONS_ADMIN_GROUPE.md`
- `ADMIN_GROUPE_IMPLEMENTATION_COMPLETE.md`
