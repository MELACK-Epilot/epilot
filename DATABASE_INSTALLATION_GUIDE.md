# 🗄️ Guide d'Installation Base de Données E-Pilot Congo

## 📋 Vue d'ensemble

Ce guide explique comment installer et configurer la base de données complète E-Pilot avec **4 plans**, **8 catégories métiers** et **50 modules pédagogiques**.

## 🎯 Architecture de la Base de Données

### Tables Principales
1. **plans** - 4 plans d'abonnement (Gratuit, Premium, Pro, Institutionnel)
2. **subscriptions** - Abonnements des groupes scolaires
3. **subscription_history** - Historique des changements d'abonnements
4. **business_categories** - 8 catégories métiers
5. **modules** - 50 modules pédagogiques
6. **group_module_configs** - Configuration des modules par groupe
7. **payments** - Historique des paiements
8. **system_alerts** - Alertes système pour le Super Admin

### Vues SQL
- **financial_stats** - Statistiques financières globales
- **plan_stats** - Statistiques par plan
- **unread_alerts** - Alertes non lues

## 📦 Fichiers SQL (Ordre d'exécution)

### 1️⃣ Plans & Abonnements
**Fichier**: `database/SUPABASE_PLANS_SUBSCRIPTIONS.sql`

**Contenu**:
- Table `plans` avec 4 plans pré-configurés
- Table `subscriptions` avec gestion complète
- Table `subscription_history` pour l'audit
- RLS (Row Level Security) configuré
- Triggers pour `updated_at`

**Plans inclus**:
- ✅ **Gratuit** - 0 FCFA/mois - 1 école, 100 élèves, 30 jours d'essai
- ✅ **Premium** - 75,000 FCFA/mois - 5 écoles, 1000 élèves, support prioritaire
- ✅ **Pro** - 150,000 FCFA/mois - 15 écoles, 5000 élèves, API + branding
- ✅ **Institutionnel** - Sur devis - Illimité, support 24/7, SLA garanti

### 2️⃣ Catégories Métiers
**Fichier**: `database/SUPABASE_CATEGORIES.sql`

**Contenu**:
- Table `business_categories`
- 8 catégories pré-configurées avec icônes et couleurs
- Trigger pour `module_count` automatique

**Catégories incluses**:
1. 🎓 **Scolarité & Admissions** (#2A9D8F) - 6 modules
2. 📚 **Pédagogie & Évaluations** (#1D3557) - 10 modules
3. 💰 **Finances & Comptabilité** (#E9C46A) - 6 modules
4. 👥 **Ressources Humaines** (#457B9D) - 7 modules
5. 🛡️ **Vie Scolaire & Discipline** (#E63946) - 6 modules
6. 🏢 **Services & Infrastructures** (#F77F00) - 6 modules
7. 🔒 **Sécurité & Accès** (#6A4C93) - 3 modules
8. 📄 **Documents & Rapports** (#06A77D) - 3 modules

### 3️⃣ Modules Pédagogiques
**Fichiers**: 
- `database/SUPABASE_MODULES_STRUCTURE.sql` (structure)
- `database/SUPABASE_MODULES_DATA_PART1.sql` (25 premiers modules)
- `database/SUPABASE_MODULES_DATA_PART2.sql` (25 derniers modules)

**Contenu**:
- Table `modules` avec 50 modules
- Table `group_module_configs` pour activation par groupe
- Trigger pour mettre à jour `module_count` dans les catégories

### 4️⃣ Paiements & Alertes
**Fichier**: `database/SUPABASE_PAYMENTS_ALERTS.sql`

**Contenu**:
- Table `payments` avec génération automatique de factures
- Table `system_alerts` pour alertes Super Admin
- Fonctions automatiques pour alertes d'expiration
- 3 vues SQL pour statistiques

## 🚀 Installation Étape par Étape

### Prérequis
- Compte Supabase actif
- Projet Supabase créé
- Accès au SQL Editor

### Étape 1: Exécuter les Scripts SQL

Connectez-vous à votre projet Supabase et exécutez les fichiers dans cet ordre:

```sql
-- 1. Plans & Abonnements (OBLIGATOIRE EN PREMIER)
-- Exécuter: database/SUPABASE_PLANS_SUBSCRIPTIONS.sql

-- 2. Catégories Métiers
-- Exécuter: database/SUPABASE_CATEGORIES.sql

-- 3. Modules - Structure
-- Exécuter: database/SUPABASE_MODULES_STRUCTURE.sql

-- 4. Modules - Données Partie 1
-- Exécuter: database/SUPABASE_MODULES_DATA_PART1.sql

-- 5. Modules - Données Partie 2
-- Exécuter: database/SUPABASE_MODULES_DATA_PART2.sql

-- 6. Paiements & Alertes
-- Exécuter: database/SUPABASE_PAYMENTS_ALERTS.sql
```

### Étape 2: Vérification

Vérifiez que tout est bien installé:

```sql
-- Vérifier les plans (devrait retourner 4)
SELECT COUNT(*) FROM plans;

-- Vérifier les catégories (devrait retourner 8)
SELECT COUNT(*) FROM business_categories;

-- Vérifier les modules (devrait retourner 50)
SELECT COUNT(*) FROM modules;

-- Vérifier la répartition par catégorie
SELECT 
  bc.name,
  bc.module_count,
  COUNT(m.id) as actual_count
FROM business_categories bc
LEFT JOIN modules m ON m.category_id = bc.id
GROUP BY bc.id, bc.name, bc.module_count
ORDER BY bc.order_index;
```

### Étape 3: Configuration RLS (Row Level Security)

Les politiques RLS sont déjà configurées dans les scripts SQL:
- ✅ Super Admin: Accès total à toutes les tables
- ✅ Admin Groupe: Lecture de ses abonnements
- ✅ Utilisateurs authentifiés: Lecture des catégories et modules

## 📊 Statistiques de la Base de Données

### Résumé
- **4 Plans** d'abonnement configurés
- **8 Catégories** métiers organisées
- **50 Modules** pédagogiques répartis
- **3 Vues SQL** pour statistiques
- **7 Tables** principales
- **15+ Triggers** automatiques
- **20+ Index** pour performance

### Répartition des Modules par Catégorie
| Catégorie | Modules | Plan Minimum |
|-----------|---------|--------------|
| Scolarité & Admissions | 6 | Gratuit |
| Pédagogie & Évaluations | 10 | Gratuit |
| Finances & Comptabilité | 6 | Premium |
| Ressources Humaines | 7 | Premium |
| Vie Scolaire & Discipline | 6 | Premium |
| Services & Infrastructures | 6 | Pro |
| Sécurité & Accès | 3 | Gratuit |
| Documents & Rapports | 3 | Premium |

## 🔧 Fonctionnalités Automatiques

### Triggers Configurés
1. **updated_at** - Mise à jour automatique de la date de modification
2. **module_count** - Calcul automatique du nombre de modules par catégorie
3. **invoice_number** - Génération automatique des numéros de facture
4. **payment_alerts** - Création d'alertes pour paiements échoués
5. **subscription_expiry_alerts** - Alertes d'expiration d'abonnements

### Fonctions Utiles
```sql
-- Créer des alertes d'expiration (à exécuter quotidiennement)
SELECT create_subscription_expiry_alerts();

-- Voir les statistiques financières
SELECT * FROM financial_stats;

-- Voir les statistiques par plan
SELECT * FROM plan_stats;

-- Voir les alertes non lues
SELECT * FROM unread_alerts;
```

## 🎨 Icônes Lucide React Utilisées

Les catégories et modules utilisent des icônes de la bibliothèque **Lucide React**:

- GraduationCap, BookOpen, DollarSign, Users
- Shield, Building2, Lock, FileText
- UserPlus, School, Calculator, Briefcase
- Et 30+ autres icônes...

## 📝 Prochaines Étapes

Après l'installation de la base de données:

1. ✅ Créer les hooks React Query (usePlans, useSubscriptions, useModules)
2. ✅ Améliorer le formulaire SchoolGroup avec section Abonnement
3. ✅ Créer la page Plans & Tarifs
4. ✅ Créer la page Catégories Métiers
5. ✅ Créer la page Modules Pédagogiques
6. ✅ Créer la page Abonnements (suivi global)
7. ✅ Créer le dashboard financier avec KPIs

## 🆘 Support

En cas de problème:
1. Vérifier les logs Supabase
2. Vérifier que les tables `users` et `school_groups` existent
3. Vérifier les permissions RLS
4. Consulter la documentation Supabase

## 📄 Licence

E-Pilot Congo - Plateforme de Gestion Scolaire
© 2025 - Tous droits réservés
