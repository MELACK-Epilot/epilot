# 🔄 Architecture - Gestion du Cycle Scolaire Dynamique

## 🎯 Problématique

Chaque année scolaire apporte des changements majeurs :
- ✅ Passage en classe supérieure (élèves)
- ✅ Nouvelles inscriptions
- ✅ Fin de scolarité (diplômés)
- ✅ Changements de poste (enseignants)
- ✅ Nouvelles affectations
- ✅ Archivage des données historiques
- ✅ Réinitialisation des KPIs

**Question** : Comment gérer tout cela de manière **dynamique et automatique** ?

---

## 🏗️ Solution Proposée : Système Multi-Années

### 1. Concept Clé : `academic_year` (Année Scolaire)

Toutes les données sont liées à une **année scolaire** :
```
2024-2025 (année en cours)
2023-2024 (année passée)
2022-2023 (archives)
```

---

## 📊 Architecture de Base de Données

### A. Tables Existantes à Modifier

#### 1. Table `students` (Élèves)

**Colonnes à ajouter/utiliser** :
```sql
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) DEFAULT '2024-2025',
ADD COLUMN IF NOT EXISTS current_class VARCHAR(100),
ADD COLUMN IF NOT EXISTS previous_class VARCHAR(100),
ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
ADD COLUMN IF NOT EXISTS is_graduated BOOLEAN DEFAULT FALSE;

-- Index pour performances
CREATE INDEX idx_students_academic_year ON students(academic_year);
CREATE INDEX idx_students_status_year ON students(status, academic_year);
```

**Exemple de données** :
```sql
-- Élève en CE1 (2024-2025)
{
  id: 'uuid',
  first_name: 'Jean',
  last_name: 'Dupont',
  level: 'primaire',
  academic_year: '2024-2025',  -- ✅ Année actuelle
  current_class: 'CE1-A',
  previous_class: 'CP-B',       -- ✅ Classe année dernière
  status: 'active'
}

-- Même élève l'année prochaine (2025-2026)
{
  id: 'uuid',
  academic_year: '2025-2026',  -- ✅ Nouvelle année
  current_class: 'CE2-A',       -- ✅ Passage automatique
  previous_class: 'CE1-A',
  status: 'active'
}
```

---

#### 2. Table `classes` (Classes)

**Colonnes à ajouter** :
```sql
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) DEFAULT '2024-2025',
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS current_enrollment INTEGER DEFAULT 0;

CREATE INDEX idx_classes_academic_year ON classes(academic_year);
```

**Exemple** :
```sql
-- Classe CE1-A (2024-2025)
{
  id: 'uuid',
  name: 'CE1-A',
  level: 'primaire',
  academic_year: '2024-2025',
  max_capacity: 30,
  current_enrollment: 28,
  status: 'active'
}

-- Même classe l'année suivante
{
  id: 'new-uuid',  -- ✅ Nouvelle instance
  name: 'CE1-A',
  academic_year: '2025-2026',
  max_capacity: 30,
  current_enrollment: 0,  -- ✅ Réinitialisé
  status: 'active'
}
```

---

#### 3. Table `grades` (Notes)

**Déjà OK** : Contient déjà `academic_year` et `term`

```sql
-- Index supplémentaires
CREATE INDEX idx_grades_academic_year ON grades(academic_year);
CREATE INDEX idx_grades_term ON grades(term);
```

---

#### 4. Table `users` (Enseignants)

**Colonnes à ajouter** :
```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS assignment_history JSONB DEFAULT '[]'::jsonb;

-- Exemple de structure
{
  id: 'uuid',
  role: 'enseignant',
  school_id: 'school-1',
  assignment_history: [
    {
      academic_year: '2023-2024',
      school_id: 'school-1',
      classes: ['CE1-A', 'CE1-B'],
      subjects: ['Mathématiques'],
      start_date: '2023-09-01',
      end_date: '2024-06-30'
    },
    {
      academic_year: '2024-2025',
      school_id: 'school-2',  -- ✅ Changement d'école
      classes: ['CE2-A'],
      subjects: ['Mathématiques', 'Sciences'],
      start_date: '2024-09-01',
      end_date: null  -- ✅ En cours
    }
  ]
}
```

---

### B. Nouvelle Table : `academic_years` (Années Scolaires)

**Création** :
```sql
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  year_code VARCHAR(20) NOT NULL,  -- '2024-2025'
  start_date DATE NOT NULL,         -- 2024-09-01
  end_date DATE NOT NULL,           -- 2025-06-30
  status VARCHAR(20) DEFAULT 'upcoming',  -- upcoming, active, completed, archived
  is_current BOOLEAN DEFAULT FALSE,
  
  -- Statistiques de fin d'année
  total_students INTEGER DEFAULT 0,
  total_graduates INTEGER DEFAULT 0,
  average_success_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(school_id, year_code)
);

CREATE INDEX idx_academic_years_school ON academic_years(school_id);
CREATE INDEX idx_academic_years_status ON academic_years(status);
CREATE INDEX idx_academic_years_current ON academic_years(is_current);
```

**Exemple de données** :
```sql
INSERT INTO academic_years (school_id, year_code, start_date, end_date, status, is_current)
VALUES 
  ('school-1', '2023-2024', '2023-09-01', '2024-06-30', 'completed', FALSE),
  ('school-1', '2024-2025', '2024-09-01', '2025-06-30', 'active', TRUE),
  ('school-1', '2025-2026', '2025-09-01', '2026-06-30', 'upcoming', FALSE);
```

---

### C. Nouvelle Table : `student_promotions` (Passages de Classe)

**Création** :
```sql
CREATE TABLE student_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Année source
  from_academic_year VARCHAR(20) NOT NULL,
  from_class VARCHAR(100),
  from_level VARCHAR(50),
  
  -- Année destination
  to_academic_year VARCHAR(20) NOT NULL,
  to_class VARCHAR(100),
  to_level VARCHAR(50),
  
  -- Statut
  promotion_type VARCHAR(20) DEFAULT 'normal',  -- normal, redoublement, saut_classe, diplome
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected, completed
  
  -- Résultats année précédente
  final_average NUMERIC(5,2),
  success_rate NUMERIC(5,2),
  
  -- Métadonnées
  promoted_at TIMESTAMPTZ,
  promoted_by UUID REFERENCES users(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_student ON student_promotions(student_id);
CREATE INDEX idx_promotions_year ON student_promotions(to_academic_year);
CREATE INDEX idx_promotions_status ON student_promotions(status);
```

---

## 🔄 Processus Automatisés

### 1. Fonction : Passage Automatique en Classe Supérieure

**Fonction PostgreSQL** :
```sql
CREATE OR REPLACE FUNCTION promote_students_to_next_year(
  p_school_id UUID,
  p_from_year VARCHAR(20),
  p_to_year VARCHAR(20)
)
RETURNS TABLE (
  total_students INTEGER,
  promoted INTEGER,
  redoublants INTEGER,
  diplomes INTEGER
) AS $$
DECLARE
  v_total INTEGER := 0;
  v_promoted INTEGER := 0;
  v_redoublants INTEGER := 0;
  v_diplomes INTEGER := 0;
BEGIN
  -- 1. Récupérer tous les élèves actifs de l'année source
  FOR student_record IN 
    SELECT 
      s.id,
      s.level,
      s.current_class,
      AVG(g.grade) as average_grade,
      CASE 
        WHEN AVG(g.grade) >= 10 THEN 'promote'
        WHEN AVG(g.grade) < 10 THEN 'redouble'
        ELSE 'promote'
      END as decision
    FROM students s
    LEFT JOIN grades g ON g.student_id = s.id AND g.academic_year = p_from_year
    WHERE s.school_id = p_school_id
    AND s.academic_year = p_from_year
    AND s.status = 'active'
    GROUP BY s.id, s.level, s.current_class
  LOOP
    v_total := v_total + 1;
    
    -- 2. Déterminer la classe suivante
    IF student_record.decision = 'promote' THEN
      -- Logique de passage (CP → CE1 → CE2, etc.)
      INSERT INTO student_promotions (
        student_id,
        school_id,
        from_academic_year,
        from_class,
        from_level,
        to_academic_year,
        to_class,
        to_level,
        promotion_type,
        status,
        final_average
      ) VALUES (
        student_record.id,
        p_school_id,
        p_from_year,
        student_record.current_class,
        student_record.level,
        p_to_year,
        get_next_class(student_record.current_class),  -- Fonction helper
        get_next_level(student_record.level),          -- Fonction helper
        'normal',
        'approved',
        student_record.average_grade
      );
      
      v_promoted := v_promoted + 1;
    ELSE
      -- Redoublement
      v_redoublants := v_redoublants + 1;
    END IF;
  END LOOP;
  
  -- 3. Retourner les statistiques
  RETURN QUERY SELECT v_total, v_promoted, v_redoublants, v_diplomes;
END;
$$ LANGUAGE plpgsql;
```

---

### 2. Fonction : Initialiser Nouvelle Année Scolaire

**Fonction PostgreSQL** :
```sql
CREATE OR REPLACE FUNCTION initialize_new_academic_year(
  p_school_id UUID,
  p_new_year VARCHAR(20),
  p_start_date DATE,
  p_end_date DATE
)
RETURNS VOID AS $$
BEGIN
  -- 1. Créer l'année scolaire
  INSERT INTO academic_years (school_id, year_code, start_date, end_date, status, is_current)
  VALUES (p_school_id, p_new_year, p_start_date, p_end_date, 'upcoming', FALSE);
  
  -- 2. Dupliquer les classes (structure uniquement)
  INSERT INTO classes (school_id, name, level, academic_year, max_capacity, status)
  SELECT 
    school_id,
    name,
    level,
    p_new_year,  -- ✅ Nouvelle année
    max_capacity,
    'active'
  FROM classes
  WHERE school_id = p_school_id
  AND academic_year = (
    SELECT year_code 
    FROM academic_years 
    WHERE school_id = p_school_id 
    AND is_current = TRUE
  );
  
  -- 3. Log
  RAISE NOTICE 'Nouvelle année % initialisée pour école %', p_new_year, p_school_id;
END;
$$ LANGUAGE plpgsql;
```

---

### 3. Fonction : Clôturer Année Scolaire

**Fonction PostgreSQL** :
```sql
CREATE OR REPLACE FUNCTION close_academic_year(
  p_school_id UUID,
  p_year VARCHAR(20)
)
RETURNS VOID AS $$
DECLARE
  v_stats RECORD;
BEGIN
  -- 1. Calculer les statistiques finales
  SELECT 
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT CASE WHEN s.is_graduated THEN s.id END) as total_graduates,
    ROUND(AVG(g.grade) / 20 * 100, 2) as avg_success_rate
  INTO v_stats
  FROM students s
  LEFT JOIN grades g ON g.student_id = s.id AND g.academic_year = p_year
  WHERE s.school_id = p_school_id
  AND s.academic_year = p_year;
  
  -- 2. Mettre à jour l'année
  UPDATE academic_years
  SET 
    status = 'completed',
    is_current = FALSE,
    total_students = v_stats.total_students,
    total_graduates = v_stats.total_graduates,
    average_success_rate = v_stats.avg_success_rate,
    updated_at = NOW()
  WHERE school_id = p_school_id
  AND year_code = p_year;
  
  -- 3. Archiver les élèves diplômés
  UPDATE students
  SET status = 'graduated'
  WHERE school_id = p_school_id
  AND academic_year = p_year
  AND is_graduated = TRUE;
  
  -- 4. Log
  RAISE NOTICE 'Année % clôturée: % élèves, % diplômés, taux %',
    p_year, v_stats.total_students, v_stats.total_graduates, v_stats.avg_success_rate;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Modifications du Dashboard

### A. Filtrer par Année Scolaire

**Hook `useDirectorDashboard.ts`** :
```typescript
export function useDirectorDashboard() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<string>('2024-2025');
  
  // Récupérer l'année courante
  const { data: currentYear } = useQuery({
    queryKey: ['currentYear', user?.schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('academic_years')
        .select('year_code')
        .eq('school_id', user?.schoolId)
        .eq('is_current', true)
        .single();
      
      return data?.year_code || '2024-2025';
    }
  });
  
  // Charger les données pour l'année sélectionnée
  const loadSchoolLevels = useCallback(async () => {
    // ✅ Ajouter le filtre academic_year partout
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', user.schoolId)
      .eq('academic_year', selectedYear)  // ✅ Filtre année
      .eq('status', 'active');
    
    // ... reste du code
  }, [user?.schoolId, selectedYear]);  // ✅ Dépendance année
  
  return {
    schoolLevels,
    globalKPIs,
    selectedYear,
    setSelectedYear,
    availableYears: ['2022-2023', '2023-2024', '2024-2025', '2025-2026']
  };
}
```

---

### B. Sélecteur d'Année dans le Dashboard

**Composant `YearSelector.tsx`** :
```typescript
interface YearSelectorProps {
  currentYear: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
}

export function YearSelector({ currentYear, availableYears, onYearChange }: YearSelectorProps) {
  return (
    <Select value={currentYear} onValueChange={onYearChange}>
      <SelectTrigger className="w-48">
        <Calendar className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableYears.map(year => (
          <SelectItem key={year} value={year}>
            <div className="flex items-center justify-between w-full">
              <span>{year}</span>
              {year === currentYear && (
                <Badge variant="default" className="ml-2">
                  En cours
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Intégration dans `DirectorDashboardOptimized.tsx`** :
```typescript
// En haut du dashboard
<div className="flex items-center justify-between mb-6">
  <h1 className="text-3xl font-bold">Dashboard Proviseur</h1>
  
  <YearSelector
    currentYear={selectedYear}
    availableYears={availableYears}
    onYearChange={setSelectedYear}
  />
</div>
```

---

## 🔄 Interface Admin : Gestion des Années

### Page `AcademicYearManagement.tsx`

```typescript
export function AcademicYearManagement() {
  const { user } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  
  // Actions disponibles
  const actions = {
    // 1. Créer nouvelle année
    createNewYear: async (yearData) => {
      await supabase.rpc('initialize_new_academic_year', {
        p_school_id: user.schoolId,
        p_new_year: yearData.year_code,
        p_start_date: yearData.start_date,
        p_end_date: yearData.end_date
      });
    },
    
    // 2. Promouvoir les élèves
    promoteStudents: async (fromYear, toYear) => {
      const { data } = await supabase.rpc('promote_students_to_next_year', {
        p_school_id: user.schoolId,
        p_from_year: fromYear,
        p_to_year: toYear
      });
      
      toast.success(`${data.promoted} élèves promus, ${data.redoublants} redoublants`);
    },
    
    // 3. Clôturer année
    closeYear: async (year) => {
      await supabase.rpc('close_academic_year', {
        p_school_id: user.schoolId,
        p_year: year
      });
      
      toast.success(`Année ${year} clôturée avec succès`);
    },
    
    // 4. Activer année
    activateYear: async (year) => {
      // Désactiver toutes les autres années
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('school_id', user.schoolId);
      
      // Activer la nouvelle
      await supabase
        .from('academic_years')
        .update({ is_current: true, status: 'active' })
        .eq('school_id', user.schoolId)
        .eq('year_code', year);
    }
  };
  
  return (
    <div className="p-6">
      <h1>Gestion des Années Scolaires</h1>
      
      {/* Liste des années */}
      {years.map(year => (
        <Card key={year.id}>
          <CardHeader>
            <CardTitle>{year.year_code}</CardTitle>
            <Badge>{year.status}</Badge>
          </CardHeader>
          <CardContent>
            <p>Début: {year.start_date}</p>
            <p>Fin: {year.end_date}</p>
            <p>Élèves: {year.total_students}</p>
          </CardContent>
          <CardFooter>
            {year.status === 'upcoming' && (
              <Button onClick={() => actions.activateYear(year.year_code)}>
                Activer
              </Button>
            )}
            {year.status === 'active' && (
              <Button onClick={() => actions.closeYear(year.year_code)}>
                Clôturer
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
      
      {/* Bouton créer nouvelle année */}
      <Button onClick={() => setShowCreateDialog(true)}>
        + Nouvelle Année Scolaire
      </Button>
    </div>
  );
}
```

---

## 📅 Workflow Annuel Complet

### Étape 1 : Fin d'Année (Juin)

```
1. Proviseur clique "Clôturer année 2024-2025"
   ↓
2. Système calcule les statistiques finales
   ↓
3. Système archive les données
   ↓
4. Système marque les diplômés
   ↓
5. Année 2024-2025 → status = 'completed'
```

### Étape 2 : Préparation Nouvelle Année (Juillet-Août)

```
1. Admin crée année 2025-2026
   ↓
2. Système duplique la structure des classes
   ↓
3. Système prépare les promotions
   ↓
4. Proviseur valide les passages de classe
   ↓
5. Système génère les listes prévisionnelles
```

### Étape 3 : Rentrée (Septembre)

```
1. Proviseur clique "Activer année 2025-2026"
   ↓
2. Système applique les promotions
   ↓
3. Élèves passent en classe supérieure
   ↓
4. Dashboard bascule sur nouvelle année
   ↓
5. KPIs réinitialisés pour nouvelle année
```

---

## 🎯 Avantages de cette Architecture

### 1. Historique Complet
```sql
-- Voir l'évolution d'un élève sur plusieurs années
SELECT 
  s.academic_year,
  s.current_class,
  AVG(g.grade) as moyenne
FROM students s
LEFT JOIN grades g ON g.student_id = s.id
WHERE s.id = 'student-uuid'
GROUP BY s.academic_year, s.current_class
ORDER BY s.academic_year;
```

### 2. Comparaisons Inter-Années
```sql
-- Comparer les performances entre années
SELECT 
  academic_year,
  COUNT(*) as total_students,
  ROUND(AVG(grade) / 20 * 100, 2) as taux_reussite
FROM students s
JOIN grades g ON g.student_id = s.id
WHERE s.school_id = 'school-uuid'
GROUP BY academic_year
ORDER BY academic_year DESC;
```

### 3. Gestion des Enseignants
```typescript
// Voir l'historique d'un enseignant
const teacherHistory = await supabase
  .from('users')
  .select('assignment_history')
  .eq('id', teacherId)
  .single();

// Afficher: 
// 2022-2023: École A, CE1-A
// 2023-2024: École A, CE2-B
// 2024-2025: École B, CM1-A (changement d'école)
```

---

## 📊 Résumé

| Fonctionnalité | Solution | Statut |
|----------------|----------|--------|
| Passage automatique | Fonction `promote_students_to_next_year()` | ✅ Prêt |
| Nouvelle année | Fonction `initialize_new_academic_year()` | ✅ Prêt |
| Clôture année | Fonction `close_academic_year()` | ✅ Prêt |
| Historique élèves | Colonne `academic_year` partout | ✅ Prêt |
| Changement poste | Colonne `assignment_history` | ✅ Prêt |
| Dashboard multi-années | Sélecteur d'année | 🔨 À implémenter |
| Interface admin | Page gestion années | 🔨 À implémenter |

---

**Date** : 16 novembre 2025  
**Version** : 4.0.0 - Architecture Cycle Scolaire  
**Statut** : 📐 ARCHITECTURE DÉFINIE
