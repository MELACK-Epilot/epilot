# 📊 Structure Table Schools - Analyse Complète

**Date** : 1er novembre 2025

---

## 🗃️ Colonnes de la Table

### Identifiants
- `id` : UUID (PK)
- `code` : TEXT (UNIQUE) - Ex: "TEST-001"
- `school_group_id` : UUID (FK → school_groups) ✅ **FILTRAGE**
- `admin_id` : UUID (FK → users) - Directeur/Admin de l'école

### Informations de Base
- `name` : TEXT - Nom de l'école
- `type_etablissement` : TEXT - "prive" ou "public"
- `niveau_enseignement` : TEXT[] - Array: ["primaire", "college"]
- `status` : TEXT - "active", "inactive", "suspended"

### Localisation
- `address` : TEXT
- `city` : TEXT - "Brazzaville"
- `commune` : TEXT
- `departement` : TEXT - "Brazzaville"
- `region` : TEXT
- `pays` : TEXT - "Congo"
- `code_postal` : TEXT
- `gps_latitude` : NUMERIC
- `gps_longitude` : NUMERIC

### Contact
- `phone` : TEXT
- `telephone_fixe` : TEXT
- `telephone_mobile` : TEXT
- `email` : TEXT
- `email_institutionnel` : TEXT
- `site_web` : TEXT

### Directeur
- `directeur_nom_complet` : TEXT
- `directeur_telephone` : TEXT
- `directeur_email` : TEXT
- `directeur_fonction` : TEXT - "Directeur"

### Statistiques
- `student_count` : INTEGER - Nombre d'élèves (legacy)
- `nombre_eleves_actuels` : INTEGER - Nombre actuel
- `max_eleves_autorises` : INTEGER - Quota max
- `nombre_enseignants` : INTEGER
- `staff_count` : INTEGER - Personnel (legacy)
- `nombre_classes` : INTEGER
- `annee_ouverture` : INTEGER

### Abonnement & Facturation
- `plan_id` : UUID (FK → plans)
- `date_debut_abonnement` : DATE
- `date_expiration_abonnement` : DATE
- `statut_paiement` : TEXT - "a_jour", "en_retard", "impaye"
- `identifiant_fiscal` : TEXT
- `identifiant_administratif` : TEXT

### Configuration
- `logo_url` : TEXT
- `devise` : TEXT - "FCFA"
- `fuseau_horaire` : TEXT - "Africa/Brazzaville"
- `description` : TEXT
- `notes_internes` : TEXT

### Métadonnées
- `created_at` : TIMESTAMP
- `updated_at` : TIMESTAMP
- `created_by` : UUID
- `updated_by` : UUID

---

## 🔍 Colonnes Clés pour Admin Groupe

### Filtrage
```sql
WHERE school_group_id = 'user.schoolGroupId'
```

### Affichage Prioritaire
1. `name` - Nom de l'école
2. `code` - Code unique
3. `type_etablissement` - Type (privé/public)
4. `niveau_enseignement` - Niveaux enseignés
5. `city` - Ville
6. `nombre_eleves_actuels` - Élèves actuels
7. `nombre_enseignants` - Enseignants
8. `status` - Statut

### Statistiques
- `nombre_eleves_actuels` : Total élèves
- `nombre_enseignants` : Total enseignants
- `nombre_classes` : Total classes
- `max_eleves_autorises` : Quota max

---

## 📝 Formulaire de Création/Édition

### Onglet 1 : Informations Générales
- Nom de l'école *
- Code *
- Type d'établissement * (privé/public)
- Niveaux d'enseignement * (multi-select)
- Année d'ouverture
- Description

### Onglet 2 : Localisation
- Adresse
- Ville *
- Commune
- Département
- Région
- Pays (défaut: Congo)
- Code postal
- GPS (latitude, longitude)

### Onglet 3 : Contact
- Téléphone fixe
- Téléphone mobile
- Email
- Email institutionnel
- Site web

### Onglet 4 : Directeur
- Nom complet *
- Téléphone
- Email
- Fonction (défaut: Directeur)

### Onglet 5 : Statistiques
- Nombre d'élèves actuels
- Nombre d'enseignants
- Nombre de classes
- Max élèves autorisés

### Onglet 6 : Configuration
- Logo (upload)
- Devise (défaut: FCFA)
- Fuseau horaire (défaut: Africa/Brazzaville)
- Notes internes

---

## 🎨 Affichage dans la Liste

### Card/Table Row
```
┌─────────────────────────────────────────────────┐
│ [LOGO] École de Test E-Pilot                    │
│        TEST-001 • Privé • Brazzaville           │
│        🎓 0 élèves • 👨‍🏫 0 enseignants • 📚 0 classes │
│        [Badge: Active]                           │
└─────────────────────────────────────────────────┘
```

### Colonnes Tableau
1. Logo + Nom
2. Code
3. Type
4. Ville
5. Élèves
6. Enseignants
7. Statut
8. Actions

---

## 🔒 Sécurité

### RLS Policy
```sql
CREATE POLICY "Admin groupe can only see their schools"
ON schools FOR SELECT
USING (school_group_id = (
  SELECT school_group_id FROM users WHERE id = auth.uid()
));
```

### Vérifications Frontend
```typescript
// Vérifier le school_group_id
if (!user.schoolGroupId) {
  return <Alert>Erreur de configuration</Alert>;
}

// Filtrer automatiquement
const { data: schools } = useSchools({ 
  school_group_id: user.schoolGroupId 
});
```

---

## 📊 Stats à Afficher

### Card Stats
1. **Total Écoles** : COUNT(*)
2. **Écoles Actives** : COUNT(*) WHERE status = 'active'
3. **Total Élèves** : SUM(nombre_eleves_actuels)
4. **Total Enseignants** : SUM(nombre_enseignants)

### Graphiques
1. **Répartition par type** : Pie chart (privé/public)
2. **Répartition par niveau** : Bar chart (primaire, collège, lycée)
3. **Évolution élèves** : Line chart (par mois)

---

## ✅ Validation

### Champs Obligatoires
- `name` : Nom de l'école
- `code` : Code unique
- `school_group_id` : Groupe scolaire (auto)
- `type_etablissement` : Type
- `niveau_enseignement` : Au moins un niveau
- `city` : Ville
- `directeur_nom_complet` : Nom du directeur

### Contraintes
- `code` : UNIQUE
- `email` : Format email valide
- `site_web` : Format URL valide
- `nombre_eleves_actuels` : >= 0
- `nombre_enseignants` : >= 0
- `max_eleves_autorises` : >= nombre_eleves_actuels

---

## 🚀 Utilisation dans le Code

### Type TypeScript
```typescript
interface School {
  id: string;
  name: string;
  code: string;
  school_group_id: string;
  admin_id?: string;
  type_etablissement: 'prive' | 'public';
  niveau_enseignement: string[];
  city: string;
  departement?: string;
  region?: string;
  pays?: string;
  phone?: string;
  email?: string;
  site_web?: string;
  directeur_nom_complet?: string;
  directeur_telephone?: string;
  directeur_email?: string;
  nombre_eleves_actuels: number;
  nombre_enseignants: number;
  nombre_classes: number;
  max_eleves_autorises?: number;
  logo_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}
```

### Hook
```typescript
const { data: schools, isLoading } = useSchools({ 
  school_group_id: user.schoolGroupId,
  search: searchQuery,
  status: statusFilter,
});
```

---

**Structure complète documentée !** 📚
