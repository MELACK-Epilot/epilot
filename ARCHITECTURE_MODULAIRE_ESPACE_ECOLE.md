# 🏗️ ARCHITECTURE MODULAIRE - ESPACE ÉCOLE

## 📊 FLUX DE DONNÉES MODULAIRE

```
┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣ SUPER ADMIN (Plateforme E-Pilot)                            │
│    • Crée les PLANS (Gratuit, Premium, Pro, Institutionnel)    │
│    • Crée les MODULES (50 modules pédagogiques)                 │
│    • Crée les CATÉGORIES (8 catégories métiers)                │
│    • Assigne modules/catégories aux PLANS via :                 │
│      - plan_modules (plan_id → module_id)                       │
│      - plan_categories (plan_id → category_id)                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2️⃣ ADMIN GROUPE (Réseau d'écoles)                              │
│    • Souscrit à un PLAN via subscriptions                       │
│    • TRIGGER auto_assign → Copie automatique dans :            │
│      - group_module_configs (school_group_id → module_id)       │
│      - group_business_categories (school_group_id → category_id)│
│    • Peut activer/désactiver les modules reçus                  │
│    • Crée les UTILISATEURS (proviseur, enseignant, CPE, etc.)  │
│    • Assigne les utilisateurs aux ÉCOLES                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3️⃣ UTILISATEURS ÉCOLE (Proviseur, Directeur, Enseignant, etc.) │
│    • Accèdent à l'ESPACE ÉCOLE (/user)                         │
│    • Voient UNIQUEMENT les modules de leur groupe via :        │
│      - group_module_configs WHERE school_group_id = user.group │
│      - AND is_enabled = true                                    │
│    • Utilisent les modules assignés pour leur travail          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔑 TABLES CLÉS

### 📋 **Plans & Abonnements**
```sql
-- Plans créés par Super Admin
subscription_plans (id, name, slug, price, features)

-- Abonnement du groupe
subscriptions (
  school_group_id → plan_id,
  status: 'active' | 'expired' | 'cancelled'
)

-- Modules assignés au plan
plan_modules (plan_id → module_id)

-- Catégories assignées au plan
plan_categories (plan_id → category_id)
```

### 🏫 **Configuration Groupe**
```sql
-- Modules disponibles pour le groupe
group_module_configs (
  school_group_id → module_id,
  is_enabled: true/false,
  enabled_by: user_id,
  settings: jsonb
)

-- Catégories disponibles pour le groupe
group_business_categories (
  school_group_id → category_id,
  is_enabled: true/false
)
```

### 👤 **Utilisateurs**
```sql
users (
  id,
  role: 'proviseur' | 'directeur' | 'enseignant' | etc.,
  school_group_id,  -- ✅ Lien vers le groupe
  school_id         -- ✅ Lien vers l'école spécifique
)
```

## 🎯 LOGIQUE POUR L'ESPACE ÉCOLE

### ❌ **CE QU'ON NE PEUT PAS FAIRE**
- ❌ Créer de nouveaux modules (réservé Super Admin)
- ❌ Modifier les modules existants
- ❌ Changer le plan d'abonnement (réservé Admin Groupe)
- ❌ Assigner des modules non inclus dans le plan

### ✅ **CE QU'ON PEUT FAIRE**
- ✅ Afficher les modules disponibles du groupe
- ✅ Utiliser les modules activés
- ✅ Personnaliser l'interface selon le rôle
- ✅ Créer des fonctionnalités métier dans les modules
- ✅ Gérer les données spécifiques à l'école

## 🚀 STRATÉGIE POUR L'ESPACE ÉCOLE

### 1️⃣ **Dashboard Dynamique par Rôle**
```typescript
// Récupérer les modules du groupe de l'utilisateur
const { data: user } = useCurrentUser();
const { data: groupModules } = useQuery({
  queryKey: ['group-modules', user?.schoolGroupId],
  queryFn: async () => {
    const { data } = await supabase
      .from('group_module_configs')
      .select(`
        module_id,
        is_enabled,
        modules!inner(id, name, slug, icon, color)
      `)
      .eq('school_group_id', user.schoolGroupId)
      .eq('is_enabled', true);
    return data;
  }
});

// Afficher les widgets selon les modules disponibles
const widgets = groupModules?.map(gm => ({
  title: gm.modules.name,
  icon: gm.modules.icon,
  link: `/user/modules/${gm.modules.slug}`
}));
```

### 2️⃣ **Navigation Adaptative**
```typescript
// Menu dynamique basé sur les modules du groupe
const menuItems = groupModules
  ?.filter(gm => gm.is_enabled)
  .map(gm => ({
    label: gm.modules.name,
    icon: gm.modules.icon,
    path: `/user/modules/${gm.modules.slug}`,
    color: gm.modules.color
  }));
```

### 3️⃣ **Widgets Personnalisés par Rôle**
```typescript
// Proviseur/Directeur
if (user.role === 'proviseur' || user.role === 'directeur') {
  widgets = [
    { title: 'Écoles', value: stats.totalSchools },
    { title: 'Personnel', value: stats.totalStaff },
    { title: 'Élèves', value: stats.totalStudents },
    { title: 'Budget', value: stats.monthlyBudget }
  ];
}

// Enseignant
if (user.role === 'enseignant') {
  widgets = [
    { title: 'Mes Classes', value: stats.myClasses },
    { title: 'Élèves', value: stats.myStudents },
    { title: 'Notes à saisir', value: stats.pendingGrades }
  ];
}

// CPE
if (user.role === 'cpe') {
  widgets = [
    { title: 'Absences', value: stats.todayAbsences },
    { title: 'Retards', value: stats.todayLates },
    { title: 'Incidents', value: stats.openIncidents }
  ];
}
```

## 📦 MODULES DISPONIBLES (Exemples)

### 🎓 **Scolarité**
- Inscriptions
- Gestion des classes
- Emploi du temps
- Absences/Retards

### 📚 **Pédagogie**
- Notes et évaluations
- Cahier de textes
- Ressources pédagogiques
- Suivi des élèves

### 💰 **Finances**
- Frais de scolarité
- Paiements
- Dépenses
- Budget

### 👥 **RH**
- Gestion du personnel
- Paie
- Congés
- Évaluations

### 🛡️ **Vie Scolaire**
- Discipline
- Sanctions
- Conseils de classe
- Communication parents

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1 : Dashboard Dynamique (Priorité HAUTE)
1. ✅ Récupérer les modules du groupe via `group_module_configs`
2. ✅ Afficher les widgets selon les modules disponibles
3. ✅ Personnaliser selon le rôle (proviseur, enseignant, CPE, etc.)
4. ✅ KPIs temps réel spécifiques au rôle

### Phase 2 : Navigation Adaptative (Priorité HAUTE)
1. ✅ Menu dynamique basé sur les modules activés
2. ✅ Icônes et couleurs depuis la BDD
3. ✅ Raccourcis vers les modules fréquents

### Phase 3 : Pages Modules (Priorité MOYENNE)
1. ✅ Page générique `/user/modules/:slug`
2. ✅ Contenu adapté selon le module
3. ✅ Permissions selon le rôle

### Phase 4 : Fonctionnalités Métier (Priorité VARIABLE)
1. Selon les modules activés pour le groupe
2. Développement progressif
3. Tests avec utilisateurs réels

## 🔒 SÉCURITÉ & PERMISSIONS

### RLS (Row Level Security)
```sql
-- Utilisateurs voient uniquement les données de leur groupe
CREATE POLICY "Users see only their group data" ON group_module_configs
  FOR SELECT USING (
    school_group_id IN (
      SELECT school_group_id FROM users WHERE id = auth.uid()
    )
  );
```

### Vérifications Frontend
```typescript
// Vérifier que l'utilisateur a accès au module
const hasModuleAccess = (moduleSlug: string) => {
  return groupModules?.some(
    gm => gm.modules.slug === moduleSlug && gm.is_enabled
  );
};

// Rediriger si pas d'accès
if (!hasModuleAccess('inscriptions')) {
  navigate('/user');
  toast.error('Vous n\'avez pas accès à ce module');
}
```

## 📝 RÉSUMÉ

**✅ COMPRENDRE :**
- Les modules viennent du PLAN souscrit par l'Admin Groupe
- Les utilisateurs école voient UNIQUEMENT les modules de leur groupe
- On ne peut PAS créer de nouveaux modules dans l'espace école
- On UTILISE les modules disponibles pour créer des fonctionnalités

**🎯 OBJECTIF :**
Créer une interface riche et personnalisée qui exploite intelligemment les modules disponibles pour chaque rôle, sans jamais sortir du cadre défini par le plan d'abonnement.
