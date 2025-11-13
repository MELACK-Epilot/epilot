# 🏫 Schéma Complet - Table SCHOOLS

## 📋 Vue d'ensemble

La table `schools` contient **toutes les informations** nécessaires pour gérer une école dans E-Pilot Congo.

---

## 🎯 Champs de la table

### **🏫 Informations générales** (7 champs)

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `id` | UUID | Identifiant unique | Auto-généré |
| `school_group_id` | UUID | Groupe scolaire rattaché | UUID du groupe |
| `name` | VARCHAR(255) | Nom de l'école | "Collège Privé La Sagesse" |
| `code` | VARCHAR(100) | Code unique (auto-généré) | "SAG-001" |
| `type_etablissement` | VARCHAR(50) | Type d'établissement | `public`, `prive`, `confessionnel`, `autre` |
| `niveau_enseignement` | VARCHAR(50)[] | Niveaux enseignés (array) | `['primaire', 'college']` |
| `status` | VARCHAR(50) | Statut | `active`, `inactive`, `suspended`, `archived` |

### **📍 Localisation** (8 champs)

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `address` | TEXT | Adresse complète | "Avenue de la Paix, Quartier Moungali" |
| `city` | VARCHAR(100) | Ville | "Brazzaville" |
| `commune` | VARCHAR(100) | Commune | "Moungali" |
| `departement` | VARCHAR(100) | Département/Région | "Brazzaville" |
| `pays` | VARCHAR(100) | Pays | "Congo" |
| `code_postal` | VARCHAR(20) | Code postal | "BP 123" |
| `gps_latitude` | DECIMAL(10,8) | Latitude GPS | -4.2634 |
| `gps_longitude` | DECIMAL(11,8) | Longitude GPS | 15.2429 |

### **👤 Responsable de l'école** (4 champs)

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `directeur_nom_complet` | VARCHAR(255) | Nom du directeur | "Dr. Jean Dupont" |
| `directeur_telephone` | VARCHAR(20) | Téléphone | "+242 06 123 4567" |
| `directeur_email` | VARCHAR(100) | Email | "directeur@sagesse.cg" |
| `directeur_fonction` | VARCHAR(100) | Fonction | "Directeur", "Proviseur", "Principal" |

### **☎️ Contacts de l'école** (4 champs)

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `telephone_fixe` | VARCHAR(20) | Téléphone fixe | "+242 22 123 4567" |
| `telephone_mobile` | VARCHAR(20) | Téléphone mobile | "+242 06 123 4567" |
| `email_institutionnel` | VARCHAR(100) | Email officiel | "contact@sagesse.cg" |
| `site_web` | TEXT | Site web | "https://sagesse.cg" |

### **👨‍🏫 Données administratives** (6 champs)

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `nombre_eleves_actuels` | INTEGER | Nombre d'élèves | 450 |
| `nombre_enseignants` | INTEGER | Nombre d'enseignants | 35 |
| `nombre_classes` | INTEGER | Nombre de classes | 18 |
| `annee_ouverture` | INTEGER | Année d'ouverture | 2005 |
| `identifiant_fiscal` | VARCHAR(100) | NIF ou autre | "NIF-123456789" |
| `identifiant_administratif` | VARCHAR(100) | Numéro ministère | "MIN-EDU-2005-001" |

### **💳 Abonnement / Gestion E-Pilot** (5 champs)

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `plan_id` | UUID | Plan d'abonnement | UUID du plan |
| `max_eleves_autorises` | INTEGER | Quota d'élèves | 500 |
| `date_debut_abonnement` | DATE | Date de début | "2024-01-01" |
| `date_expiration_abonnement` | DATE | Date d'expiration | "2025-01-01" |
| `statut_paiement` | VARCHAR(50) | Statut paiement | `a_jour`, `en_retard`, `suspendu`, `gratuit` |

### **🗂️ Autres informations** (5 champs)

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `logo_url` | TEXT | URL du logo | "https://storage.../logo.png" |
| `devise` | VARCHAR(10) | Devise utilisée | "FCFA", "EUR", "USD" |
| `fuseau_horaire` | VARCHAR(50) | Fuseau horaire | "Africa/Brazzaville" |
| `description` | TEXT | Présentation | "Établissement d'excellence..." |
| `notes_internes` | TEXT | Notes admin | "Groupe prioritaire" |

### **📊 Métadonnées** (4 champs)

| Champ | Type | Description |
|-------|------|-------------|
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de modification |
| `created_by` | UUID | Créé par (user_id) |
| `updated_by` | UUID | Modifié par (user_id) |

---

## 🎯 Fonctionnalités automatiques

### **1. Code auto-généré** 🔢
```sql
-- Exemple : Groupe "La Sagesse" → Écoles "SAG-001", "SAG-002", etc.
```

### **2. Trigger `updated_at`** ⏰
- Mis à jour automatiquement à chaque modification

### **3. Vues SQL** 📊

#### **`schools_complete`**
```sql
SELECT * FROM schools_complete;
-- Retourne : école + groupe + plan + créateur + taux de remplissage
```

#### **`schools_stats_by_group`**
```sql
SELECT * FROM schools_stats_by_group;
-- Retourne : stats agrégées par groupe
```

### **4. Fonction `update_school_counters`** 📈
```sql
-- Mettre à jour les compteurs
SELECT update_school_counters(
  'school_id',
  450,  -- nombre_eleves
  35,   -- nombre_enseignants
  18    -- nombre_classes
);
```

---

## 🔐 Sécurité (RLS)

### **Politiques**

1. **Super Admin** : Accès total à toutes les écoles
2. **Admin Groupe** : Accès uniquement aux écoles de son groupe

```sql
-- Admin Groupe voit UNIQUEMENT ses écoles
SELECT * FROM schools;
-- RLS filtre automatiquement par school_group_id
```

---

## 📋 Installation

### **Option 1 : Nouvelle table**
```sql
-- Exécuter dans Supabase SQL Editor
-- Copier/coller le contenu de SCHOOLS_SCHEMA_COMPLETE.sql
```

### **Option 2 : Migration (table existante)**
```sql
-- Si la table schools existe déjà
-- Exécuter MIGRATE_SCHOOLS_ADD_COLUMNS.sql
```

---

## 🧪 Tester l'installation

### **1. Vérifier la structure**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'schools'
ORDER BY ordinal_position;
```

### **2. Créer une école de test**
```sql
INSERT INTO schools (
  school_group_id,
  name,
  type_etablissement,
  niveau_enseignement,
  city,
  departement,
  directeur_nom_complet,
  directeur_telephone,
  nombre_eleves_actuels,
  status
) VALUES (
  (SELECT id FROM school_groups LIMIT 1),
  'École de Test',
  'prive',
  ARRAY['primaire', 'college'],
  'Brazzaville',
  'Brazzaville',
  'Jean Dupont',
  '+242 06 123 4567',
  100,
  'active'
);
```

### **3. Vérifier le code auto-généré**
```sql
SELECT code, name FROM schools;
-- Devrait afficher : "SAG-001" ou similaire
```

### **4. Tester la vue complète**
```sql
SELECT 
  name,
  code,
  group_name,
  plan_name,
  taux_remplissage
FROM schools_complete;
```

---

## 📊 Exemples d'utilisation

### **Exemple 1 : École primaire publique**
```json
{
  "name": "École Primaire Publique Moungali",
  "type_etablissement": "public",
  "niveau_enseignement": ["primaire"],
  "city": "Brazzaville",
  "nombre_eleves_actuels": 320,
  "nombre_enseignants": 15,
  "nombre_classes": 12,
  "devise": "FCFA"
}
```

### **Exemple 2 : Collège privé confessionnel**
```json
{
  "name": "Collège Catholique Saint-Joseph",
  "type_etablissement": "confessionnel",
  "niveau_enseignement": ["college"],
  "directeur_nom_complet": "Père Michel Nkounkou",
  "directeur_fonction": "Directeur",
  "nombre_eleves_actuels": 450,
  "annee_ouverture": 1998,
  "description": "Établissement catholique fondé en 1998"
}
```

### **Exemple 3 : Complexe scolaire (primaire + collège + lycée)**
```json
{
  "name": "Complexe Scolaire La Sagesse",
  "type_etablissement": "prive",
  "niveau_enseignement": ["primaire", "college", "lycee"],
  "nombre_eleves_actuels": 1200,
  "nombre_enseignants": 85,
  "nombre_classes": 45,
  "max_eleves_autorises": 1500,
  "site_web": "https://sagesse.cg"
}
```

---

## 🎯 Intégration avec les autres modules

### **Relation avec `inscriptions`**
```sql
-- Une inscription appartient à une école
inscriptions.school_id → schools.id
```

### **Relation avec `school_groups`**
```sql
-- Une école appartient à un groupe
schools.school_group_id → school_groups.id
```

### **Relation avec `classes`** (futur)
```sql
-- Une classe appartient à une école
classes.school_id → schools.id
```

### **Relation avec `users`**
```sql
-- Un utilisateur peut être rattaché à une école
users.school_id → schools.id (optionnel)
```

---

## ✅ Checklist de validation

- [ ] Table `schools` créée avec tous les champs
- [ ] Index créés pour la performance
- [ ] Triggers fonctionnels (updated_at, code auto)
- [ ] Vues créées (`schools_complete`, `schools_stats_by_group`)
- [ ] Politiques RLS configurées
- [ ] Fonction `update_school_counters` testée
- [ ] Données de test insérées
- [ ] Code auto-généré vérifié

---

## 📁 Fichiers créés

1. **SCHOOLS_SCHEMA_COMPLETE.sql** - Schéma complet (nouvelle table)
2. **MIGRATE_SCHOOLS_ADD_COLUMNS.sql** - Migration (table existante)
3. **SCHOOLS_SCHEMA_DOCUMENTATION.md** - Ce document

---

## 🎉 Résultat

La table `schools` est maintenant :
- ✅ **Complète** - Tous les champs nécessaires
- ✅ **Optimisée** - Index et vues pour la performance
- ✅ **Automatisée** - Code auto-généré, triggers
- ✅ **Sécurisée** - RLS configuré
- ✅ **Documentée** - Guide complet

**Prête pour la production !** 🚀🇨🇬

---

**Date** : 31 octobre 2025  
**Projet** : E-Pilot Congo 🇨🇬
