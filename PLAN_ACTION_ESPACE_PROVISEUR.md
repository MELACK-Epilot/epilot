# 🎯 PLAN D'ACTION - ESPACE PROVISEUR OREL DEBA

## 📊 CONTEXTE

**Utilisateur :** Proviseur/Directeur Orel DEBA  
**Rôle :** `proviseur`  
**Espace :** `/user/*` (Espace École)  
**Contrainte :** Modules définis par le plan d'abonnement du groupe

## 🚀 PHASE 1 : DASHBOARD PROVISEUR ENRICHI (2-3h)

### 🎯 Objectif
Créer un dashboard moderne et fonctionnel qui affiche les données réelles du groupe scolaire du Proviseur, en utilisant les modules disponibles.

### 📋 Tâches

#### 1.1 - Récupération des Données Groupe (30min)
**Fichier :** `src/features/user-space/hooks/useProvisionerStats.ts`

```typescript
/**
 * Hook pour récupérer les statistiques du Proviseur
 * Basé sur le school_group_id de l'utilisateur
 */
export const useProvisionerStats = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['provisioner-stats', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) throw new Error('Groupe non trouvé');
      
      // 1. Écoles du groupe
      const { data: schools } = await supabase
        .from('schools')
        .select('id, name, status')
        .eq('school_group_id', user.schoolGroupId)
        .eq('status', 'active');
      
      // 2. Personnel du groupe
      const { data: staff } = await supabase
        .from('users')
        .select('id, role, status')
        .eq('school_group_id', user.schoolGroupId)
        .eq('status', 'active')
        .in('role', ['enseignant', 'cpe', 'comptable', 'secretaire']);
      
      // 3. Élèves du groupe
      const { data: students } = await supabase
        .from('users')
        .select('id')
        .eq('school_group_id', user.schoolGroupId)
        .eq('role', 'eleve')
        .eq('status', 'active');
      
      // 4. Budget mensuel (si module finances activé)
      const { data: budget } = await supabase
        .from('group_module_configs')
        .select('settings')
        .eq('school_group_id', user.schoolGroupId)
        .eq('module_id', 'MODULE_FINANCES_ID')
        .eq('is_enabled', true)
        .single();
      
      return {
        totalSchools: schools?.length || 0,
        totalStaff: staff?.length || 0,
        totalStudents: students?.length || 0,
        monthlyBudget: budget?.settings?.monthly_budget || 0,
        schools: schools || [],
        staffByRole: staff?.reduce((acc, s) => {
          acc[s.role] = (acc[s.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    },
    enabled: !!user?.schoolGroupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

#### 1.2 - Widgets KPIs Proviseur (1h)
**Fichier :** `src/features/user-space/components/ProvisionerWidgets.tsx`

```typescript
/**
 * Widgets KPIs pour le Proviseur
 * Design glassmorphism moderne
 */
export const ProvisionerWidgets = () => {
  const { data: stats, isLoading } = useProvisionerStats();
  
  const widgets = [
    {
      title: 'Écoles',
      value: stats?.totalSchools || 0,
      icon: Building2,
      color: 'from-[#2A9D8F] to-[#1d7a6f]',
      description: 'Établissements actifs',
      link: '/user/schools'
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
      description: 'Total élèves',
      link: '/user/students'
    },
    {
      title: 'Budget',
      value: `${(stats?.monthlyBudget || 0) / 1000}K`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      description: 'FCFA mensuel',
      link: '/user/finances'
    }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {widgets.map((widget, index) => (
        <motion.div
          key={widget.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link to={widget.link}>
            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 cursor-pointer">
              <div className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-90`} />
              
              {/* Cercles décoratifs */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="relative p-6">
                {/* Icône */}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <widget.icon className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                {/* Titre */}
                <h3 className="text-white/70 text-sm font-semibold mb-2 tracking-wide uppercase">
                  {widget.title}
                </h3>
                
                {/* Valeur */}
                <p className="text-4xl font-extrabold text-white drop-shadow-lg mb-1">
                  {isLoading ? '...' : widget.value}
                </p>
                
                {/* Description */}
                <p className="text-white/60 text-xs font-medium">
                  {widget.description}
                </p>
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};
```

#### 1.3 - Modules Disponibles (45min)
**Fichier :** `src/features/user-space/components/AvailableModules.tsx`

```typescript
/**
 * Affiche les modules disponibles pour le groupe
 * Récupérés depuis group_module_configs
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
            id,
            name,
            slug,
            description,
            icon,
            color,
            business_categories(name, icon, color)
          )
        `)
        .eq('school_group_id', user?.schoolGroupId)
        .eq('is_enabled', true)
        .order('modules(name)');
      
      return data;
    },
    enabled: !!user?.schoolGroupId
  });
  
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="h-6 w-6 text-[#2A9D8F]" />
        Modules Disponibles
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules?.map((mod) => (
          <Link
            key={mod.module_id}
            to={`/user/modules/${mod.modules.slug}`}
            className="group"
          >
            <Card className="p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-[#2A9D8F]">
              <div className="flex items-start gap-3">
                {/* Icône du module */}
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${mod.modules.color}20` }}
                >
                  {getLucideIcon(mod.modules.icon, {
                    className: "h-6 w-6",
                    style: { color: mod.modules.color }
                  })}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#2A9D8F] transition-colors">
                    {mod.modules.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {mod.modules.description}
                  </p>
                  
                  {/* Badge catégorie */}
                  {mod.modules.business_categories && (
                    <div className="flex items-center gap-1 mt-2">
                      {getLucideIcon(mod.modules.business_categories.icon, {
                        className: "h-3 w-3",
                        style: { color: mod.modules.business_categories.color }
                      })}
                      <span className="text-xs text-gray-400">
                        {mod.modules.business_categories.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      
      {modules?.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucun module disponible pour le moment</p>
          <p className="text-sm mt-2">
            Contactez votre administrateur de groupe
          </p>
        </div>
      )}
    </Card>
  );
};
```

#### 1.4 - Alertes & Notifications (45min)
**Fichier :** `src/features/user-space/components/ProvisionerAlerts.tsx`

```typescript
/**
 * Alertes importantes pour le Proviseur
 */
export const ProvisionerAlerts = () => {
  const { data: user } = useCurrentUser();
  
  const { data: alerts } = useQuery({
    queryKey: ['provisioner-alerts', user?.schoolGroupId],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('school_group_id', user?.schoolGroupId)
        .eq('is_read', false)
        .in('severity', ['critical', 'error'])
        .order('created_at', { ascending: false })
        .limit(5);
      
      return data;
    },
    enabled: !!user?.schoolGroupId,
    refetchInterval: 60000 // 1 minute
  });
  
  if (!alerts || alerts.length === 0) return null;
  
  return (
    <Card className="p-6 border-l-4 border-red-500">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
        <AlertCircle className="h-5 w-5" />
        Alertes Importantes ({alerts.length})
      </h3>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-3 bg-red-50 rounded-lg"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{alert.title}</p>
              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(new Date(alert.created_at), {
                  addSuffix: true,
                  locale: fr
                })}
              </p>
            </div>
            
            {alert.action_url && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = alert.action_url}
              >
                Voir
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
```

#### 1.5 - Intégration Dashboard (30min)
**Fichier :** `src/features/user-space/pages/UserDashboard.tsx`

```typescript
export const UserDashboard = () => {
  const { data: user, isLoading } = useCurrentUser();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <ErrorMessage />;
  
  // Dashboard spécifique PROVISEUR
  if (user.role === 'proviseur' || user.role === 'directeur') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord - Direction
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenue {user.firstName} {user.lastName}
          </p>
        </div>
        
        {/* Alertes critiques */}
        <ProvisionerAlerts />
        
        {/* KPIs */}
        <ProvisionerWidgets />
        
        {/* Modules disponibles */}
        <AvailableModules />
        
        {/* Activité récente */}
        <RecentActivity />
      </div>
    );
  }
  
  // Autres rôles...
  return <DefaultDashboard />;
};
```

## 🎨 PHASE 2 : NAVIGATION ADAPTATIVE (1h)

### 2.1 - Menu Dynamique (45min)
**Fichier :** `src/features/user-space/components/UserSidebar.tsx`

```typescript
// Récupérer les modules du groupe pour construire le menu
const { data: groupModules } = useQuery({
  queryKey: ['group-modules-menu', user?.schoolGroupId],
  queryFn: async () => {
    const { data } = await supabase
      .from('group_module_configs')
      .select(`
        modules!inner(slug, name, icon, color, category_id)
      `)
      .eq('school_group_id', user?.schoolGroupId)
      .eq('is_enabled', true);
    return data;
  }
});

// Construire le menu dynamiquement
const menuItems = [
  { to: '/user', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/user/profile', icon: User, label: 'Mon Profil' },
  ...groupModules?.map(gm => ({
    to: `/user/modules/${gm.modules.slug}`,
    icon: gm.modules.icon,
    label: gm.modules.name,
    color: gm.modules.color
  })) || []
];
```

### 2.2 - Breadcrumbs (15min)
**Fichier :** `src/features/user-space/components/Breadcrumbs.tsx`

```typescript
export const Breadcrumbs = () => {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);
  
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <Link to="/user" className="hover:text-[#2A9D8F]">
        Accueil
      </Link>
      {paths.slice(1).map((path, index) => (
        <Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          <span className="capitalize">{path}</span>
        </Fragment>
      ))}
    </nav>
  );
};
```

## 📦 PHASE 3 : PAGES MODULES (Variable selon modules)

### 3.1 - Page Générique Module
**Fichier :** `src/features/user-space/pages/ModulePage.tsx`

```typescript
export const ModulePage = () => {
  const { slug } = useParams();
  const { data: user } = useCurrentUser();
  
  // Vérifier l'accès au module
  const { data: hasAccess } = useQuery({
    queryKey: ['module-access', slug, user?.schoolGroupId],
    queryFn: async () => {
      const { data } = await supabase
        .from('group_module_configs')
        .select('is_enabled, modules!inner(name, description)')
        .eq('school_group_id', user?.schoolGroupId)
        .eq('modules.slug', slug)
        .eq('is_enabled', true)
        .single();
      
      return data;
    }
  });
  
  if (!hasAccess) {
    return <AccessDenied />;
  }
  
  // Charger le composant du module dynamiquement
  return (
    <div>
      <h1>{hasAccess.modules.name}</h1>
      <p>{hasAccess.modules.description}</p>
      {/* Contenu du module */}
    </div>
  );
};
```

## ✅ CHECKLIST DE RÉALISATION

### Phase 1 : Dashboard (2-3h)
- [ ] Créer `useProvisionerStats.ts`
- [ ] Créer `ProvisionerWidgets.tsx`
- [ ] Créer `AvailableModules.tsx`
- [ ] Créer `ProvisionerAlerts.tsx`
- [ ] Modifier `UserDashboard.tsx`
- [ ] Tester avec données réelles

### Phase 2 : Navigation (1h)
- [ ] Modifier `UserSidebar.tsx` (menu dynamique)
- [ ] Créer `Breadcrumbs.tsx`
- [ ] Tester navigation

### Phase 3 : Modules (Variable)
- [ ] Créer `ModulePage.tsx` (générique)
- [ ] Implémenter modules spécifiques selon besoins
- [ ] Tester accès et permissions

## 🎯 RÉSULTAT ATTENDU

**Dashboard Proviseur avec :**
- ✅ 4 KPIs temps réel (Écoles, Personnel, Élèves, Budget)
- ✅ Liste des modules disponibles du groupe
- ✅ Alertes critiques en temps réel
- ✅ Navigation adaptative selon modules
- ✅ Design moderne glassmorphism
- ✅ Responsive mobile/desktop
- ✅ Performance optimisée (React Query cache)

**Temps estimé total :** 3-4 heures  
**Complexité :** Moyenne  
**Impact :** HAUTE - Interface complète et fonctionnelle
