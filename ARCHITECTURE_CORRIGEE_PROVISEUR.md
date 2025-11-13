# 🎯 ARCHITECTURE CORRIGÉE - PROVISEUR/DIRECTEUR

## ✅ **COMPRÉHENSION CORRECTE**

### 🏫 **PROVISEUR = RESPONSABLE D'UNE ÉCOLE SPÉCIFIQUE**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣ SUPER ADMIN E-PILOT (Plateforme)                            │
│    • Gère toute la plateforme                                   │
│    • Pas de school_group_id, pas de school_id                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2️⃣ ADMIN GROUPE (Réseau d'écoles)                              │
│    • Gère PLUSIEURS écoles d'un groupe                          │
│    • A un school_group_id                                       │
│    • Voit TOUTES les écoles de son groupe                       │
│    • Crée les utilisateurs et les affecte aux écoles           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3️⃣ PROVISEUR/DIRECTEUR (UNE école spécifique)                  │
│    • Responsable d'UNE SEULE école                              │
│    • A un school_group_id ET un school_id                       │
│    • Voit UNIQUEMENT son école (WHERE school_id = user.school_id)│
│    • Gère le personnel et les élèves de SON école              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4️⃣ PERSONNEL ÉCOLE (Enseignant, CPE, Comptable, etc.)          │
│    • Travaille dans UNE école spécifique                        │
│    • A un school_group_id ET un school_id                       │
│    • Voit uniquement les données de son école                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔑 **STRUCTURE BDD UTILISATEURS**

```sql
-- Table users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  role user_role NOT NULL,
  
  -- Liens hiérarchiques
  school_group_id UUID REFERENCES school_groups(id),  -- Groupe scolaire
  school_id UUID REFERENCES schools(id),              -- École spécifique
  
  status user_status DEFAULT 'active',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contraintes CHECK
-- Proviseur/Directeur DOIT avoir school_id
ALTER TABLE users ADD CONSTRAINT check_directeur_has_school 
CHECK (
  (role NOT IN ('directeur', 'proviseur', 'directeur_etudes') 
   OR school_id IS NOT NULL)
);
```

## 📊 **PORTÉE DES DONNÉES PAR RÔLE**

### 🔴 **Super Admin**
```sql
-- Voit TOUT
SELECT * FROM schools;
SELECT * FROM users;
```

### 🟠 **Admin Groupe**
```sql
-- Voit TOUTES les écoles de son groupe
SELECT * FROM schools 
WHERE school_group_id = user.school_group_id;

-- Voit TOUS les utilisateurs de son groupe
SELECT * FROM users 
WHERE school_group_id = user.school_group_id;
```

### 🟢 **Proviseur/Directeur** ← **TON RÔLE**
```sql
-- Voit UNIQUEMENT son école
SELECT * FROM schools 
WHERE id = user.school_id;

-- Voit UNIQUEMENT le personnel de son école
SELECT * FROM users 
WHERE school_id = user.school_id;

-- Voit UNIQUEMENT les élèves de son école
SELECT * FROM users 
WHERE school_id = user.school_id 
AND role = 'eleve';

-- Voit UNIQUEMENT les classes de son école
SELECT * FROM classes 
WHERE school_id = user.school_id;

-- Voit UNIQUEMENT les paiements de son école
SELECT * FROM fee_payments 
WHERE school_id = user.school_id;
```

### 🔵 **Enseignant/CPE/Personnel**
```sql
-- Voit UNIQUEMENT son école
SELECT * FROM schools 
WHERE id = user.school_id;

-- Voit les élèves de son école (selon permissions)
SELECT * FROM users 
WHERE school_id = user.school_id 
AND role = 'eleve';
```

## 🎯 **DASHBOARD PROVISEUR CORRIGÉ**

### ✅ **Ce que le Proviseur PEUT voir**

1. **SON École uniquement**
   - Nom, adresse, statut
   - Informations de contact

2. **Personnel de SON école**
   - Enseignants
   - CPE
   - Surveillants
   - Secrétaires
   - Comptables
   - Autres personnels

3. **Élèves de SON école**
   - Liste complète
   - Inscriptions
   - Absences/Retards
   - Résultats scolaires

4. **Classes de SON école**
   - Toutes les classes
   - Effectifs
   - Enseignants assignés

5. **Finances de SON école**
   - Paiements reçus
   - Frais en attente
   - Dépenses de l'école
   - Budget alloué

6. **Modules du groupe**
   - Modules disponibles via `group_module_configs`
   - Filtrés par `school_group_id`
   - Utilisables dans le contexte de son école

### ❌ **Ce que le Proviseur NE PEUT PAS voir**

- ❌ Les autres écoles du groupe
- ❌ Le personnel des autres écoles
- ❌ Les élèves des autres écoles
- ❌ Les finances des autres écoles
- ❌ Les statistiques globales du groupe

## 🚀 **PLAN D'ACTION CORRIGÉ**

### **Phase 1 : Dashboard Proviseur (2-3h)**

#### 1.1 - Hook Statistiques École (30min)
```typescript
/**
 * Hook pour récupérer les statistiques de L'ÉCOLE du Proviseur
 * Filtré par school_id de l'utilisateur
 */
export const useSchoolStats = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['school-stats', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) {
        throw new Error('Proviseur non associé à une école');
      }
      
      // 1. Informations de l'école
      const { data: school } = await supabase
        .from('schools')
        .select('id, name, address, status, phone, email')
        .eq('id', user.schoolId)
        .single();
      
      // 2. Personnel de l'école
      const { data: staff } = await supabase
        .from('users')
        .select('id, role, status')
        .eq('school_id', user.schoolId)
        .eq('status', 'active')
        .in('role', [
          'enseignant', 'cpe', 'surveillant', 
          'secretaire', 'comptable', 'bibliothecaire'
        ]);
      
      // 3. Élèves de l'école
      const { data: students } = await supabase
        .from('users')
        .select('id')
        .eq('school_id', user.schoolId)
        .eq('role', 'eleve')
        .eq('status', 'active');
      
      // 4. Classes de l'école
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, level, current_enrollment')
        .eq('school_id', user.schoolId)
        .eq('status', 'active');
      
      // 5. Budget de l'école (si module finances activé)
      const { data: payments } = await supabase
        .from('fee_payments')
        .select('amount, status')
        .eq('school_id', user.schoolId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      
      const monthlyRevenue = payments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0) || 0;
      
      return {
        school,
        totalStaff: staff?.length || 0,
        totalStudents: students?.length || 0,
        totalClasses: classes?.length || 0,
        monthlyRevenue,
        staffByRole: staff?.reduce((acc, s) => {
          acc[s.role] = (acc[s.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    },
    enabled: !!user?.schoolId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

#### 1.2 - Widgets KPIs École (1h)
```typescript
/**
 * Widgets KPIs pour le Proviseur
 * Affiche les données de SON école uniquement
 */
export const SchoolWidgets = () => {
  const { data: stats, isLoading } = useSchoolStats();
  
  const widgets = [
    {
      title: 'Mon École',
      value: stats?.school?.name || '...',
      icon: Building2,
      color: 'from-[#2A9D8F] to-[#1d7a6f]',
      description: stats?.school?.address || '',
      link: '/user/school/info'
    },
    {
      title: 'Personnel',
      value: stats?.totalStaff || 0,
      icon: Users,
      color: 'from-[#1D3557] to-[#0d1f3d]',
      description: 'Membres actifs',
      link: '/user/staff'
    },
    {
      title: 'Élèves',
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      description: 'Inscrits cette année',
      link: '/user/students'
    },
    {
      title: 'Classes',
      value: stats?.totalClasses || 0,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      description: 'Classes actives',
      link: '/user/classes'
    },
    {
      title: 'Revenus Mois',
      value: `${((stats?.monthlyRevenue || 0) / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      description: 'FCFA ce mois',
      link: '/user/finances'
    }
  ];
  
  // ... reste du code avec design glassmorphism
};
```

#### 1.3 - Liste Personnel École (45min)
```typescript
/**
 * Liste du personnel de l'école
 */
export const SchoolStaff = () => {
  const { data: user } = useCurrentUser();
  
  const { data: staff } = useQuery({
    queryKey: ['school-staff', user?.schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, role, email, avatar, status')
        .eq('school_id', user?.schoolId)
        .in('role', [
          'enseignant', 'cpe', 'surveillant',
          'secretaire', 'comptable', 'bibliothecaire'
        ])
        .order('role', { ascending: true })
        .order('last_name', { ascending: true });
      
      return data;
    },
    enabled: !!user?.schoolId
  });
  
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">
        Personnel de l'École
      </h2>
      
      <div className="space-y-3">
        {staff?.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Avatar */}
            <div className="relative">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#2A9D8F] text-white flex items-center justify-center font-semibold">
                  {member.first_name?.[0]}{member.last_name?.[0]}
                </div>
              )}
              {member.status === 'active' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {member.first_name} {member.last_name}
              </p>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>
            
            {/* Badge rôle */}
            <Badge variant="outline">
              {getRoleLabel(member.role)}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
```

#### 1.4 - Modules Disponibles (45min)
```typescript
/**
 * Modules disponibles pour le groupe
 * (Même code que précédemment car les modules viennent du groupe)
 */
export const AvailableModules = () => {
  const { data: user } = useCurrentUser();
  
  const { data: modules } = useQuery({
    queryKey: ['available-modules', user?.schoolGroupId],
    queryFn: async () => {
      const { data } = await supabase
        .from('group_module_configs')
        .select(`
          module_id,
          is_enabled,
          modules!inner(
            id, name, slug, description, icon, color,
            business_categories(name, icon, color)
          )
        `)
        .eq('school_group_id', user?.schoolGroupId)
        .eq('is_enabled', true);
      
      return data;
    },
    enabled: !!user?.schoolGroupId
  });
  
  // ... reste du code
};
```

### **Phase 2 : Navigation (1h)**

Menu adapté au Proviseur :
- 🏠 Tableau de bord
- 🏫 Mon École (infos)
- 👥 Personnel
- 🎓 Élèves
- 📚 Classes
- 💰 Finances (de l'école)
- 📦 Modules disponibles

### **Phase 3 : Pages Spécifiques (variable)**

1. **Page Mon École** - Infos détaillées
2. **Page Personnel** - Gestion équipe
3. **Page Élèves** - Liste + inscriptions
4. **Page Classes** - Gestion classes
5. **Page Finances** - Suivi paiements école

## 🔒 **SÉCURITÉ RLS**

```sql
-- Proviseur voit uniquement son école
CREATE POLICY "Proviseur sees only their school" ON schools
  FOR SELECT USING (
    id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('proviseur', 'directeur')
    )
  );

-- Proviseur voit uniquement le personnel de son école
CREATE POLICY "Proviseur sees only their school staff" ON users
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('proviseur', 'directeur')
    )
  );
```

## ✅ **RÉSUMÉ COMPRÉHENSION**

**Proviseur Orel DEBA :**
- ✅ Responsable d'UNE école spécifique
- ✅ A un `school_id` dans la table users
- ✅ Voit UNIQUEMENT son école (WHERE school_id = user.school_id)
- ✅ Gère le personnel de son école
- ✅ Gère les élèves de son école
- ✅ Gère les classes de son école
- ✅ Suit les finances de son école
- ✅ Utilise les modules du groupe (via school_group_id)
- ❌ Ne voit PAS les autres écoles du groupe

**C'est bien ça ?** 🎯
