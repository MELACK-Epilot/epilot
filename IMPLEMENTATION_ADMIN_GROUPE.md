# 🏫 Implémentation Administrateur Groupe Scolaire

**Date**: 31 octobre 2025  
**Objectif**: Implémenter le rôle Admin Groupe avec vision multi-écoles  
**Statut**: 🚧 **EN COURS**

---

## 🎯 Vision du Rôle

### Administrateur Groupe Scolaire (Niveau Réseau)

**Responsabilités**:
- ✅ Gère **plusieurs écoles** de son groupe
- ✅ Crée et gère les **Administrateurs d'écoles**
- ✅ Crée et gère tous les **utilisateurs** (enseignants, CPE, comptables, etc.)
- ✅ Vue consolidée **multi-écoles**
- ✅ Statistiques agrégées de son réseau

**Scope**: Multi-écoles (méso)

---

## 📋 Fonctionnalités à Implémenter

### 1. **Module Écoles (Schools)** ⭐⭐⭐⭐⭐

#### Page Liste des Écoles
- ✅ Liste des écoles du groupe
- ✅ Stats: Total écoles, Actives, Inactives, Total élèves
- ✅ Filtres: Statut, Ville, Département
- ✅ Actions: Créer, Modifier, Désactiver, Voir détails
- ✅ Export CSV/Excel

#### Formulaire École
**Champs**:
- Nom de l'école
- Code établissement
- Adresse complète (rue, ville, département, région)
- Téléphone, Email
- Directeur (Administrateur d'école)
- Capacité (nombre d'élèves max)
- Niveaux proposés (Maternelle, Primaire, Collège, Lycée)
- Statut (Active, Inactive, En construction)
- Logo école (upload)

#### Dialog Détails École
- Informations complètes
- Stats: Élèves, Personnel, Classes
- Administrateur assigné
- Historique

---

### 2. **Dashboard Admin Groupe** ⭐⭐⭐⭐⭐

#### KPIs Multi-Écoles
1. **Total Écoles** (actives/total)
2. **Total Élèves** (agrégé de toutes les écoles)
3. **Total Personnel** (agrégé)
4. **Taux d'Occupation** (élèves/capacité)

#### Graphiques
1. **Répartition élèves par école** (Bar Chart)
2. **Évolution inscriptions** (Line Chart)
3. **Personnel par école** (Pie Chart)
4. **Occupation par école** (Bar Chart)

#### Liste Écoles Rapide
- 5 dernières écoles créées
- Bouton "Voir toutes"

---

### 3. **Gestion Utilisateurs Adaptée** ⭐⭐⭐⭐⭐

#### Filtres Admin Groupe
- ✅ Filtre par **École** (ses écoles uniquement)
- ✅ Filtre par **Rôle**
- ✅ Filtre par **Statut**

#### Création Utilisateur
**Rôles disponibles**:
- ✅ Administrateur École (pour ses écoles)
- ✅ Enseignant
- ✅ CPE (Conseiller Principal d'Éducation)
- ✅ Comptable
- ✅ Documentaliste
- ✅ Surveillant
- ✅ Orientation
- ✅ Vie scolaire

**Champs supplémentaires**:
- ✅ Sélection de l'école (obligatoire)
- ✅ Matières enseignées (si enseignant)
- ✅ Niveau d'enseignement

---

### 4. **Module Inscriptions Multi-Écoles** ⭐⭐⭐⭐

#### Vue Consolidée
- ✅ Inscriptions de **toutes les écoles** du groupe
- ✅ Filtre par école
- ✅ Stats agrégées
- ✅ Export global

---

### 5. **Permissions & Sécurité (RLS)** ⭐⭐⭐⭐⭐

#### Row Level Security

**Table `schools`**:
```sql
-- Admin Groupe voit ses écoles uniquement
CREATE POLICY "admin_groupe_schools" ON schools
FOR ALL USING (
  school_group_id = (
    SELECT school_group_id FROM users 
    WHERE id = auth.uid()
  )
);
```

**Table `users`**:
```sql
-- Admin Groupe voit les utilisateurs de ses écoles
CREATE POLICY "admin_groupe_users" ON users
FOR ALL USING (
  school_id IN (
    SELECT id FROM schools 
    WHERE school_group_id = (
      SELECT school_group_id FROM users 
      WHERE id = auth.uid()
    )
  )
);
```

**Table `inscriptions`**:
```sql
-- Admin Groupe voit les inscriptions de ses écoles
CREATE POLICY "admin_groupe_inscriptions" ON inscriptions
FOR ALL USING (
  school_id IN (
    SELECT id FROM schools 
    WHERE school_group_id = (
      SELECT school_group_id FROM users 
      WHERE id = auth.uid()
    )
  )
);
```

---

## 🗄️ Schéma Base de Données

### Table `schools` (Écoles)

```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  
  -- Informations de base
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE, -- Code établissement
  logo TEXT, -- URL logo
  
  -- Adresse
  address TEXT,
  city VARCHAR(100),
  department VARCHAR(100),
  region VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(200),
  
  -- Administration
  director_id UUID REFERENCES users(id), -- Administrateur d'école
  
  -- Capacité
  capacity INTEGER DEFAULT 0, -- Nombre d'élèves max
  current_students INTEGER DEFAULT 0, -- Nombre actuel
  
  -- Niveaux proposés
  has_preschool BOOLEAN DEFAULT false,
  has_primary BOOLEAN DEFAULT false,
  has_middle BOOLEAN DEFAULT false,
  has_high BOOLEAN DEFAULT false,
  
  -- Statut
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'construction')),
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Contraintes
  CONSTRAINT valid_capacity CHECK (capacity >= 0),
  CONSTRAINT valid_students CHECK (current_students >= 0 AND current_students <= capacity)
);

-- Index
CREATE INDEX idx_schools_group ON schools(school_group_id);
CREATE INDEX idx_schools_status ON schools(status);
CREATE INDEX idx_schools_director ON schools(director_id);
CREATE INDEX idx_schools_city ON schools(city);

-- Trigger mise à jour
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON schools
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 📊 Structure des Composants

### Page Schools

```
src/features/dashboard/pages/Schools.tsx
├── SchoolsStats (4 KPIs)
├── SchoolsFilters (Recherche + Filtres)
├── SchoolsTable (Liste avec actions)
├── SchoolFormDialog (Créer/Modifier)
└── SchoolDetailsDialog (Détails complets)
```

### Hooks React Query

```typescript
// src/features/dashboard/hooks/useSchools.ts

export const useSchools = (filters) => {
  return useQuery({
    queryKey: ['schools', filters],
    queryFn: async () => {
      let query = supabase
        .from('schools')
        .select('*, school_groups(name), users!director_id(first_name, last_name)')
        .order('created_at', { ascending: false });
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
};

export const useCreateSchool = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (school) => {
      const { data, error } = await supabase
        .from('schools')
        .insert(school)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schools']);
      toast.success('École créée avec succès');
    }
  });
};
```

---

## 🎨 Design des Composants

### Stats Cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Total Écoles */}
  <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Total Écoles</p>
          <p className="text-3xl font-bold text-[#1D3557]">
            {stats.activeSchools}/{stats.totalSchools}
          </p>
        </div>
        <School className="w-12 h-12 text-[#1D3557]" />
      </div>
    </CardContent>
  </Card>
  
  {/* Total Élèves */}
  <Card className="bg-gradient-to-br from-green-50 to-green-100">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Total Élèves</p>
          <p className="text-3xl font-bold text-[#2A9D8F]">
            {stats.totalStudents.toLocaleString()}
          </p>
        </div>
        <Users className="w-12 h-12 text-[#2A9D8F]" />
      </div>
    </CardContent>
  </Card>
  
  {/* Total Personnel */}
  <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Total Personnel</p>
          <p className="text-3xl font-bold text-[#E9C46A]">
            {stats.totalStaff}
          </p>
        </div>
        <UserCheck className="w-12 h-12 text-[#E9C46A]" />
      </div>
    </CardContent>
  </Card>
  
  {/* Taux d'Occupation */}
  <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Occupation</p>
          <p className="text-3xl font-bold text-purple-600">
            {stats.occupancyRate}%
          </p>
        </div>
        <TrendingUp className="w-12 h-12 text-purple-600" />
      </div>
    </CardContent>
  </Card>
</div>
```

---

## 🔄 Flux de Travail Admin Groupe

### 1. Création d'une École

```
1. Admin Groupe clique "Nouvelle École"
2. Formulaire s'ouvre
3. Remplit les informations
4. Sélectionne un Directeur (optionnel)
5. Définit la capacité
6. Coche les niveaux proposés
7. Clique "Créer"
8. École créée et visible dans la liste
```

### 2. Assignation d'un Directeur

```
1. Admin Groupe va dans "Utilisateurs"
2. Clique "Nouvel Utilisateur"
3. Sélectionne rôle "Administrateur École"
4. Sélectionne l'école
5. Remplit les informations
6. Clique "Créer"
7. Utilisateur créé et assigné comme directeur
```

### 3. Création d'Enseignants

```
1. Admin Groupe va dans "Utilisateurs"
2. Clique "Nouvel Utilisateur"
3. Sélectionne rôle "Enseignant"
4. Sélectionne l'école
5. Sélectionne les matières
6. Remplit les informations
7. Clique "Créer"
8. Enseignant créé et assigné à l'école
```

---

## 📈 Métriques & Analytics

### Dashboard Admin Groupe

**Graphique 1: Répartition Élèves par École**
```tsx
<BarChart data={schoolsData}>
  <XAxis dataKey="schoolName" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="students" fill="#2A9D8F" />
</BarChart>
```

**Graphique 2: Évolution Inscriptions**
```tsx
<LineChart data={evolutionData}>
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="inscriptions" stroke="#1D3557" />
</LineChart>
```

**Graphique 3: Personnel par École**
```tsx
<PieChart>
  <Pie data={staffData} dataKey="count" nameKey="school" fill="#E9C46A" />
  <Tooltip />
</PieChart>
```

---

## ✅ Checklist d'Implémentation

### Phase 1: Base de Données
- [ ] Créer table `schools`
- [ ] Ajouter index
- [ ] Créer politiques RLS
- [ ] Créer triggers
- [ ] Tester les requêtes

### Phase 2: Backend (Hooks)
- [ ] `useSchools` (liste)
- [ ] `useSchoolStats` (statistiques)
- [ ] `useCreateSchool` (création)
- [ ] `useUpdateSchool` (modification)
- [ ] `useDeleteSchool` (suppression)

### Phase 3: Frontend (Composants)
- [ ] Page `Schools.tsx`
- [ ] `SchoolsStats` (4 KPIs)
- [ ] `SchoolsFilters` (recherche + filtres)
- [ ] `SchoolsTable` (liste)
- [ ] `SchoolFormDialog` (formulaire)
- [ ] `SchoolDetailsDialog` (détails)

### Phase 4: Dashboard
- [ ] Dashboard Admin Groupe
- [ ] 4 KPIs multi-écoles
- [ ] 3 graphiques
- [ ] Liste écoles rapide

### Phase 5: Utilisateurs
- [ ] Adapter formulaire utilisateurs
- [ ] Ajouter filtre par école
- [ ] Restreindre rôles disponibles
- [ ] Tester création Admin École

### Phase 6: Tests & Documentation
- [ ] Tester toutes les fonctionnalités
- [ ] Vérifier les permissions RLS
- [ ] Créer documentation utilisateur
- [ ] Créer guide Admin Groupe

---

## 🎯 Prochaines Étapes

1. ✅ Créer le schéma SQL `schools`
2. ⏳ Créer les hooks React Query
3. ⏳ Créer la page Schools
4. ⏳ Créer le Dashboard Admin Groupe
5. ⏳ Adapter le formulaire Utilisateurs
6. ⏳ Tester et valider

---

**Implémentation en cours...** 🚧

Le rôle Admin Groupe sera le cœur de la gestion multi-écoles !
