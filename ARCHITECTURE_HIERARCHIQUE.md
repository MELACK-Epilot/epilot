# 🏗️ Architecture Hiérarchique E-Pilot Congo

**Date**: 1er novembre 2025  
**Version**: 1.0  
**Statut**: ✅ **ARCHITECTURE DÉFINIE**

---

## 🎯 Vue d'Ensemble

E-Pilot Congo est une plateforme SaaS multi-tenant qui aide les groupes scolaires à gérer leurs écoles. L'architecture est basée sur **3 niveaux hiérarchiques** avec des espaces complètement séparés.

---

## 🏢 Niveaux Hiérarchiques

### 1️⃣ **Super Admin E-Pilot** (Niveau Plateforme)

**Rôle**: Gestion de la plateforme E-Pilot

**Responsabilités**:
- ✅ Créer, modifier et supprimer les **plans d'abonnement**
- ✅ Créer et gérer les **groupes scolaires**
- ✅ Assigner un **Admin Groupe** à chaque groupe scolaire
- ✅ Associer un **plan d'abonnement** à un groupe scolaire
- ✅ Voir les statistiques globales de la plateforme

**Restrictions**:
- ❌ Ne gère **PAS** directement les écoles
- ❌ Ne gère **PAS** les élèves
- ❌ Ne gère **PAS** les utilisateurs des écoles

**Espace de connexion**: `/login` → Dashboard Super Admin

**Exemple**:
```
Super Admin E-Pilot
├── Groupe Scolaire A (Plan Premium)
│   └── Admin Groupe A
├── Groupe Scolaire B (Plan Pro)
│   └── Admin Groupe B
└── Groupe Scolaire C (Plan Institutionnel)
    └── Admin Groupe C
```

---

### 2️⃣ **Admin Groupe** (Niveau Groupe Scolaire)

**Rôle**: Gestion d'un groupe scolaire

**Responsabilités**:
- ✅ Créer et gérer les **écoles** de son groupe
- ✅ Créer et gérer les **utilisateurs** (Admin École, Enseignants, CPE, etc.)
- ✅ Voir les statistiques de son groupe
- ✅ Gérer les inscriptions et les paiements
- ✅ Respecter les **quotas** définis par le plan d'abonnement

**Restrictions**:
- ❌ Ne peut voir que **ses propres écoles**
- ❌ Ne peut pas modifier le **plan d'abonnement**
- ❌ Ne peut pas dépasser les **quotas** du plan

**Espace de connexion**: `/login` → **Dashboard Admin Groupe** (espace privé séparé)

**Quotas selon le plan**:
```
Plan Gratuit:
├── 1 école maximum
├── 50 élèves par école
└── 5 personnel par école

Plan Premium (25 000 FCFA/mois):
├── 3 écoles maximum
├── 200 élèves par école
└── 20 personnel par école

Plan Pro (50 000 FCFA/mois):
├── 10 écoles maximum
├── 1000 élèves par école
└── 100 personnel par école

Plan Institutionnel (150 000 FCFA/mois):
├── Écoles illimitées
├── Élèves illimités
└── Personnel illimité
```

**Message si quota dépassé**:
```
⚠️ Vous avez atteint la limite de votre plan actuel.
Veuillez passer à un plan supérieur pour continuer.

[Voir les plans] [Contacter le support]
```

**Exemple**:
```
Admin Groupe "Groupe Scolaire International"
├── École Primaire Saint-Joseph
│   ├── 150 élèves
│   └── 12 enseignants
├── Collège Notre-Dame
│   ├── 180 élèves
│   └── 15 enseignants
└── Lycée Excellence
    ├── 200 élèves
    └── 18 enseignants

Total: 3/3 écoles (Plan Premium)
```

---

### 3️⃣ **Admin École** (Niveau École)

**Rôle**: Gestion d'une école spécifique

**Responsabilités**:
- ✅ Gérer les **élèves** de son école
- ✅ Gérer les **enseignants** de son école
- ✅ Gérer les **classes** et les **emplois du temps**
- ✅ Voir les statistiques de son école

**Restrictions**:
- ❌ Ne peut voir que **son école**
- ❌ Ne peut pas créer d'autres écoles
- ❌ Ne peut pas gérer les utilisateurs d'autres écoles

**Espace de connexion**: `/login` → Dashboard Admin École

**Exemple**:
```
Admin École "École Primaire Saint-Joseph"
├── Classes
│   ├── CP: 25 élèves
│   ├── CE1: 30 élèves
│   └── CE2: 28 élèves
├── Enseignants
│   ├── M. Dupont (Mathématiques)
│   ├── Mme Martin (Français)
│   └── M. Bernard (Sciences)
└── Personnel
    ├── CPE: Mme Dubois
    └── Comptable: M. Lefebvre
```

---

## 🔐 Isolation des Données

### Politiques RLS (Row Level Security)

Chaque niveau ne peut accéder qu'à ses propres données :

```sql
-- Admin Groupe: Voit uniquement ses écoles
CREATE POLICY "admin_groupe_schools" ON schools
FOR SELECT
USING (school_group_id = (
  SELECT school_group_id FROM users WHERE id = auth.uid()
));

-- Admin École: Voit uniquement son école
CREATE POLICY "admin_ecole_school" ON schools
FOR SELECT
USING (id = (
  SELECT school_id FROM users WHERE id = auth.uid()
));
```

---

## 📊 Flux de Création

### Flux 1: Super Admin crée un Groupe Scolaire

```
1. Super Admin se connecte
2. Va dans "Groupes Scolaires"
3. Clique sur "Créer un groupe"
4. Remplit le formulaire:
   - Nom du groupe
   - Email
   - Téléphone
   - Adresse
   - Plan d'abonnement (Gratuit, Premium, Pro, Institutionnel)
5. Crée un Admin Groupe:
   - Prénom
   - Nom
   - Email
   - Mot de passe
6. ✅ Groupe créé + Admin Groupe créé
7. 📧 Email envoyé à l'Admin Groupe avec ses identifiants
```

### Flux 2: Admin Groupe crée une École

```
1. Admin Groupe se connecte (espace privé)
2. Va dans "Écoles"
3. Clique sur "Créer une école"
4. Vérification des quotas:
   - Si quota atteint → ❌ Message d'erreur
   - Si quota OK → ✅ Formulaire affiché
5. Remplit le formulaire:
   - Nom de l'école
   - Code
   - Adresse
   - Téléphone
6. Crée un Admin École (optionnel):
   - Prénom
   - Nom
   - Email
   - Mot de passe
7. ✅ École créée
8. 📧 Email envoyé à l'Admin École (si créé)
```

### Flux 3: Admin École gère son école

```
1. Admin École se connecte
2. Voit uniquement son école
3. Peut:
   - Créer des classes
   - Inscrire des élèves
   - Ajouter des enseignants
   - Gérer les emplois du temps
   - Voir les statistiques
```

---

## 🎨 Interfaces Utilisateur

### Dashboard Super Admin E-Pilot

**Menu**:
- 📊 Tableau de bord
- 🏢 Groupes Scolaires
- 👥 Utilisateurs (Admin Groupes)
- 📦 Plans d'Abonnement
- 💰 Finances
- 📊 Rapports
- ⚙️ Paramètres

**Vue**: Globale - Tous les groupes scolaires

---

### Dashboard Admin Groupe (Espace Privé)

**Menu**:
- 📊 Tableau de bord
- 🏫 **Écoles** (uniquement ses écoles)
- 👥 Utilisateurs (Admin Écoles, Enseignants, etc.)
- 📚 Modules Pédagogiques
- 💰 Finances (son groupe uniquement)
- 📊 Rapports
- ⚙️ Paramètres

**Vue**: Groupe - Ses écoles uniquement

**Quotas affichés**:
```
Plan Premium
├── Écoles: 2/3 utilisées
├── Élèves: 530/600 utilisés
└── Personnel: 45/60 utilisés

[Passer au plan Pro]
```

---

### Dashboard Admin École

**Menu**:
- 📊 Tableau de bord
- 👨‍🎓 Élèves
- 👨‍🏫 Enseignants
- 📚 Classes
- 📅 Emplois du temps
- 💰 Finances (son école uniquement)
- 📊 Rapports
- ⚙️ Paramètres

**Vue**: École - Son école uniquement

---

## 🔄 Gestion des Quotas

### Vérification Automatique

Avant chaque création, le système vérifie :

```tsx
// Hook React
const { canCreate, remaining, limit } = useCanCreateResource('schools');

if (!canCreate) {
  toast.error(
    `Vous avez atteint la limite de ${limit} écoles de votre plan actuel. 
    Veuillez passer à un plan supérieur.`
  );
  return;
}
```

### Fonction SQL

```sql
CREATE OR REPLACE FUNCTION check_quota_before_creation()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Récupérer le quota max du plan
  SELECT sp.max_schools INTO max_allowed
  FROM school_groups sg
  JOIN subscription_plans sp ON sg.plan_id = sp.id
  WHERE sg.id = NEW.school_group_id;

  -- Compter les écoles existantes
  SELECT COUNT(*) INTO current_count
  FROM schools
  WHERE school_group_id = NEW.school_group_id;

  -- Vérifier le quota
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Quota dépassé: % écoles maximum autorisées', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📝 Résumé des Responsabilités

| Niveau | Gère | Ne gère PAS | Quotas |
|--------|------|-------------|--------|
| **Super Admin** | Plans, Groupes scolaires | Écoles, Élèves | ❌ Aucun |
| **Admin Groupe** | Écoles, Utilisateurs | Plans, Autres groupes | ✅ Selon plan |
| **Admin École** | Élèves, Enseignants | Autres écoles | ✅ Selon plan du groupe |

---

## 🎯 Points Clés

1. **Espaces Séparés** ✅
   - Chaque niveau a son propre dashboard
   - Isolation complète des données
   - Connexion unique pour chaque rôle

2. **Quotas Automatiques** ✅
   - Vérification avant chaque création
   - Message clair si quota dépassé
   - Possibilité de passer à un plan supérieur

3. **Sécurité RLS** ✅
   - Politiques PostgreSQL strictes
   - Impossible de voir les données d'autres groupes
   - Audit trail complet

4. **Expérience Utilisateur** ✅
   - Interface adaptée à chaque rôle
   - Statistiques pertinentes
   - Actions contextuelles

---

**L'architecture hiérarchique E-Pilot Congo est maintenant clairement définie !** 🏗️🚀
