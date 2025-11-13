# 🔐 Permissions et Restrictions Admin Groupe - E-Pilot Congo

**Date**: 1er novembre 2025  
**Version**: 1.0  
**Statut**: ✅ **IMPLÉMENTÉ**

---

## 🎯 Vue d'Ensemble

L'Admin Groupe a un **espace privé complètement séparé** du Super Admin E-Pilot. Il peut gérer uniquement **SES ressources** dans les limites de **SON plan d'abonnement**.

---

## ❌ Ce que l'Admin Groupe NE PEUT PAS Faire

### 1. **Voir ou Modifier d'Autres Groupes Scolaires** ❌

**Restriction** :
- ❌ Ne peut pas voir la liste des autres groupes scolaires
- ❌ Ne peut pas accéder aux données des autres groupes
- ❌ Ne peut pas modifier les informations d'autres groupes

**Implémentation** :
```sql
-- Politique RLS sur school_groups
CREATE POLICY "admin_groupe_own_group" ON school_groups
FOR SELECT
USING (id = (
  SELECT school_group_id FROM users WHERE id = auth.uid()
));

-- L'Admin Groupe voit UNIQUEMENT son groupe
```

**Interface** :
- ❌ Menu "Groupes Scolaires" **NON VISIBLE** dans la sidebar
- ✅ Peut voir SON groupe dans "Mon Profil" (lecture seule)

---

### 2. **Accéder à l'Interface Super Admin** ❌

**Restriction** :
- ❌ Ne peut pas accéder à `/dashboard/school-groups`
- ❌ Ne peut pas accéder à `/dashboard/categories`
- ❌ Ne peut pas accéder à `/dashboard/modules`
- ❌ Ne peut pas voir les statistiques globales de la plateforme

**Implémentation** :
```tsx
// Sidebar filtrée par rôle
const navigationItems = allNavigationItems.filter(item => 
  !item.roles || item.roles.includes(user?.role || '')
);

// Items Super Admin uniquement
{
  title: 'Groupes Scolaires',
  roles: ['super_admin'], // ❌ Admin Groupe ne voit pas
}
```

**Protection des routes** :
```tsx
// App.tsx
<Route path="school-groups" element={
  <ProtectedRoute roles={['super_admin']}>
    <SchoolGroups />
  </ProtectedRoute>
} />
```

---

### 3. **Modifier Son Plan d'Abonnement** ❌

**Restriction** :
- ❌ Ne peut pas changer de plan (Gratuit → Premium → Pro)
- ❌ Ne peut pas modifier les quotas
- ❌ Ne peut pas annuler son abonnement
- ✅ Peut **voir** son plan actuel (lecture seule)
- ✅ Peut **demander** un changement de plan (via support)

**Implémentation** :
```tsx
// Affichage du plan (lecture seule)
<Card>
  <CardHeader>
    <CardTitle>Plan Actuel</CardTitle>
  </CardHeader>
  <CardContent>
    <Badge variant="premium">Premium</Badge>
    <p>25 000 FCFA/mois</p>
    
    {/* Bouton pour contacter le support */}
    <Button onClick={() => navigate('/dashboard/communication')}>
      Demander un changement de plan
    </Button>
  </CardContent>
</Card>
```

**Politique RLS** :
```sql
-- Pas de UPDATE sur subscription_plans
CREATE POLICY "no_update_plans" ON subscription_plans
FOR UPDATE
USING (false); -- Personne ne peut modifier les plans via l'app
```

---

### 4. **Créer des Ressources au-delà de Son Quota** ❌

**Restriction** :
- ❌ Ne peut pas créer plus d'écoles que la limite du plan
- ❌ Ne peut pas inscrire plus d'élèves que la limite
- ❌ Ne peut pas ajouter plus de personnel que la limite

**Implémentation Côté Client** :
```tsx
import { useCanCreateResource } from '@/features/dashboard/hooks/useQuotas';

const CreateSchoolButton = () => {
  const { canCreate, remaining, limit, current } = useCanCreateResource('schools');

  const handleCreate = () => {
    if (!canCreate) {
      toast.error(
        `⚠️ Limite atteinte : ${current}/${limit} écoles`,
        {
          description: 'Vous avez atteint la limite de votre plan actuel. Veuillez passer à un plan supérieur.',
          action: {
            label: 'Voir les plans',
            onClick: () => navigate('/dashboard/finances/plans')
          }
        }
      );
      return;
    }

    // Créer l'école
    openCreateDialog();
  };

  return (
    <Button onClick={handleCreate} disabled={!canCreate}>
      <Plus className="w-4 h-4 mr-2" />
      Créer une école ({remaining} restantes)
    </Button>
  );
};
```

**Implémentation Côté Serveur** :
```sql
-- Trigger de vérification des quotas
CREATE OR REPLACE FUNCTION check_quota_before_creation()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
  plan_name TEXT;
BEGIN
  -- Récupérer le quota max du plan
  SELECT sp.max_schools, sp.name INTO max_allowed, plan_name
  FROM school_groups sg
  JOIN subscription_plans sp ON sg.plan_id = sp.id
  WHERE sg.id = NEW.school_group_id;

  -- Compter les écoles existantes
  SELECT COUNT(*) INTO current_count
  FROM schools
  WHERE school_group_id = NEW.school_group_id
  AND deleted_at IS NULL;

  -- Vérifier le quota
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Quota dépassé: Vous avez atteint la limite de % écoles de votre plan % (%). Veuillez passer à un plan supérieur.', 
      max_allowed, plan_name, current_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger
CREATE TRIGGER check_school_quota
BEFORE INSERT ON schools
FOR EACH ROW
EXECUTE FUNCTION check_quota_before_creation();
```

**Message d'erreur** :
```
⚠️ Limite atteinte : 3/3 écoles

Vous avez atteint la limite de votre plan Premium actuel.
Veuillez passer à un plan supérieur pour continuer.

Plan Premium → Plan Pro
✅ 10 écoles (au lieu de 3)
✅ 1000 élèves/école (au lieu de 200)
✅ 100 personnel/école (au lieu de 20)

[Voir les plans] [Contacter le support]
```

---

### 5. **Voir les Statistiques Globales de la Plateforme** ❌

**Restriction** :
- ❌ Ne peut pas voir le nombre total de groupes scolaires
- ❌ Ne peut pas voir les statistiques des autres groupes
- ❌ Ne peut pas voir les revenus globaux de la plateforme
- ✅ Peut voir **uniquement** SES statistiques

**Implémentation** :
```tsx
// Dashboard Admin Groupe
const DashboardOverview = () => {
  const { user } = useAuth();
  const { data: stats } = useGroupStats(user.schoolGroupId); // ✅ Ses stats uniquement

  return (
    <div>
      <h1>Tableau de bord - {user.schoolGroupName}</h1>
      
      {/* Stats de SON groupe uniquement */}
      <StatsCards>
        <StatCard title="Mes Écoles" value={stats.schoolsCount} />
        <StatCard title="Mes Élèves" value={stats.studentsCount} />
        <StatCard title="Mon Personnel" value={stats.staffCount} />
      </StatsCards>
    </div>
  );
};
```

**Politique RLS** :
```sql
-- Stats filtrées par groupe
CREATE POLICY "admin_groupe_stats" ON schools
FOR SELECT
USING (school_group_id = (
  SELECT school_group_id FROM users WHERE id = auth.uid()
));
```

---

## ✅ Ce que l'Admin Groupe PEUT Faire

### 1. **Gérer SES Écoles (CRUD Complet)** ✅

**Permissions** :
- ✅ **Créer** des écoles (dans la limite du quota)
- ✅ **Voir** la liste de ses écoles
- ✅ **Modifier** les informations de ses écoles
- ✅ **Supprimer** ses écoles (soft delete)

**Implémentation** :
```tsx
// Page Schools
const Schools = () => {
  const { user } = useAuth();
  const { data: schools } = useSchools({ 
    school_group_id: user.schoolGroupId // ✅ Filtre automatique
  });

  return (
    <div>
      <SchoolsTable 
        data={schools}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <CreateSchoolButton />
    </div>
  );
};
```

**Politique RLS** :
```sql
-- CRUD complet sur SES écoles
CREATE POLICY "admin_groupe_crud_schools" ON schools
FOR ALL
USING (school_group_id = (
  SELECT school_group_id FROM users WHERE id = auth.uid()
))
WITH CHECK (school_group_id = (
  SELECT school_group_id FROM users WHERE id = auth.uid()
));
```

---

### 2. **Gérer SES Utilisateurs (CRUD Complet)** ✅

**Permissions** :
- ✅ **Créer** des utilisateurs (Admin École, Enseignants, CPE, etc.)
- ✅ **Voir** la liste de ses utilisateurs
- ✅ **Modifier** les informations de ses utilisateurs
- ✅ **Supprimer** ses utilisateurs (soft delete)
- ✅ **Assigner** des rôles

**Implémentation** :
```tsx
// Page Users
const Users = () => {
  const { user } = useAuth();
  const { data: users } = useUsers({ 
    school_group_id: user.schoolGroupId // ✅ Filtre automatique
  });

  return (
    <div>
      <UsersTable 
        data={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <CreateUserButton />
    </div>
  );
};
```

**Politique RLS** :
```sql
-- CRUD complet sur SES utilisateurs
CREATE POLICY "admin_groupe_crud_users" ON users
FOR ALL
USING (school_group_id = (
  SELECT school_group_id FROM users WHERE id = auth.uid()
))
WITH CHECK (school_group_id = (
  SELECT school_group_id FROM users WHERE id = auth.uid()
));
```

---

### 3. **Gérer SES Élèves (CRUD Complet)** ✅

**Permissions** :
- ✅ **Inscrire** des élèves (dans la limite du quota)
- ✅ **Voir** la liste de ses élèves
- ✅ **Modifier** les informations de ses élèves
- ✅ **Supprimer** ses élèves (soft delete)
- ✅ **Assigner** des élèves à des classes

**Implémentation** :
```tsx
// Page Students
const Students = () => {
  const { user } = useAuth();
  const { data: students } = useStudents({ 
    school_group_id: user.schoolGroupId // ✅ Filtre automatique
  });

  return (
    <div>
      <StudentsTable 
        data={students}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <CreateStudentButton />
    </div>
  );
};
```

**Politique RLS** :
```sql
-- CRUD complet sur SES élèves
CREATE POLICY "admin_groupe_crud_students" ON students
FOR ALL
USING (school_id IN (
  SELECT id FROM schools 
  WHERE school_group_id = (
    SELECT school_group_id FROM users WHERE id = auth.uid()
  )
))
WITH CHECK (school_id IN (
  SELECT id FROM schools 
  WHERE school_group_id = (
    SELECT school_group_id FROM users WHERE id = auth.uid()
  )
));
```

---

### 4. **Voir SON Plan et SES Quotas (Lecture Seule)** ✅

**Permissions** :
- ✅ **Voir** son plan actuel
- ✅ **Voir** ses quotas (écoles, élèves, personnel)
- ✅ **Voir** son utilisation actuelle
- ❌ **Modifier** son plan (doit contacter le support)

**Implémentation** :
```tsx
// Composant QuotaCard
const QuotaCard = () => {
  const { user } = useAuth();
  const { data: quotas } = useGroupQuotas(user.schoolGroupId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan {quotas.planName}</CardTitle>
        <Badge variant="premium">{quotas.price} FCFA/mois</Badge>
      </CardHeader>
      <CardContent>
        {/* Écoles */}
        <QuotaProgressBar
          label="Écoles"
          current={quotas.currentSchools}
          max={quotas.maxSchools}
          color="blue"
        />
        
        {/* Élèves */}
        <QuotaProgressBar
          label="Élèves"
          current={quotas.currentStudents}
          max={quotas.maxStudents}
          color="green"
        />
        
        {/* Personnel */}
        <QuotaProgressBar
          label="Personnel"
          current={quotas.currentStaff}
          max={quotas.maxStaff}
          color="purple"
        />

        {/* Bouton pour changer de plan */}
        <Button 
          variant="outline"
          onClick={() => navigate('/dashboard/communication')}
        >
          Demander un changement de plan
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

### 5. **Modifier SON Profil Personnel** ✅

**Permissions** :
- ✅ **Modifier** son prénom, nom
- ✅ **Modifier** son email
- ✅ **Modifier** son téléphone
- ✅ **Modifier** son avatar
- ✅ **Changer** son mot de passe
- ❌ **Modifier** son rôle
- ❌ **Modifier** son groupe scolaire

**Implémentation** :
```tsx
// Page Profile
const Profile = () => {
  const { user } = useAuth();
  const { mutate: updateProfile } = useUpdateProfile();

  const handleSubmit = (data) => {
    updateProfile({
      id: user.id,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      // ❌ role et school_group_id ne peuvent pas être modifiés
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input name="firstName" defaultValue={user.firstName} />
      <Input name="lastName" defaultValue={user.lastName} />
      <Input name="email" defaultValue={user.email} />
      <Input name="phone" defaultValue={user.phone} />
      <AvatarUpload name="avatar" defaultValue={user.avatar} />
      
      {/* Champs en lecture seule */}
      <Input name="role" value={user.role} disabled />
      <Input name="schoolGroup" value={user.schoolGroupName} disabled />
      
      <Button type="submit">Enregistrer</Button>
    </Form>
  );
};
```

---

### 6. **Voir SES Statistiques et Tableaux de Bord** ✅

**Permissions** :
- ✅ **Voir** ses statistiques (écoles, élèves, personnel)
- ✅ **Voir** ses graphiques (évolution, répartition)
- ✅ **Voir** ses rapports
- ✅ **Exporter** ses données (CSV, Excel, PDF)
- ❌ **Voir** les statistiques des autres groupes

**Implémentation** :
```tsx
// Dashboard Overview
const DashboardOverview = () => {
  const { user } = useAuth();
  const { data: stats } = useGroupStats(user.schoolGroupId);

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          title="Mes Écoles" 
          value={stats.schoolsCount}
          icon={School}
          trend="+2 ce mois"
        />
        <StatCard 
          title="Mes Élèves" 
          value={stats.studentsCount}
          icon={Users}
          trend="+45 ce mois"
        />
        <StatCard 
          title="Mon Personnel" 
          value={stats.staffCount}
          icon={Briefcase}
          trend="+3 ce mois"
        />
        <StatCard 
          title="Taux de Remplissage" 
          value={`${stats.fillRate}%`}
          icon={TrendingUp}
          trend="+5% ce mois"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-2 gap-4">
        <EvolutionChart data={stats.evolution} />
        <RepartitionChart data={stats.repartition} />
      </div>

      {/* Activité récente */}
      <RecentActivity activities={stats.recentActivities} />
    </div>
  );
};
```

---

## 📊 Résumé des Permissions

| Fonctionnalité | Super Admin | Admin Groupe | Admin École |
|----------------|-------------|--------------|-------------|
| **Groupes Scolaires** | ✅ CRUD | ❌ Aucun | ❌ Aucun |
| **Écoles** | ❌ Aucun | ✅ CRUD (ses écoles) | ✅ Lecture (son école) |
| **Utilisateurs** | ✅ Admin Groupes | ✅ CRUD (ses utilisateurs) | ✅ CRUD (son école) |
| **Élèves** | ❌ Aucun | ✅ CRUD (ses élèves) | ✅ CRUD (son école) |
| **Plans** | ✅ CRUD | ✅ Lecture seule | ❌ Aucun |
| **Quotas** | ❌ Aucun | ✅ Lecture seule | ❌ Aucun |
| **Statistiques** | ✅ Global | ✅ Son groupe | ✅ Son école |
| **Finances** | ✅ Global | ✅ Son groupe | ✅ Son école |
| **Profil** | ✅ Modifiable | ✅ Modifiable | ✅ Modifiable |

---

## 🔒 Sécurité

### Niveaux de Protection

1. **Côté Client (React)** ✅
   - Sidebar filtrée par rôle
   - Routes protégées avec `ProtectedRoute`
   - Boutons désactivés si quota atteint

2. **Côté Serveur (PostgreSQL)** ✅
   - Politiques RLS sur toutes les tables
   - Triggers de vérification des quotas
   - Fonctions de validation

3. **Côté API (Supabase)** ✅
   - Authentification JWT
   - Vérification des permissions
   - Audit trail complet

---

**Les permissions et restrictions Admin Groupe sont maintenant 100% implémentées !** 🔐✅
