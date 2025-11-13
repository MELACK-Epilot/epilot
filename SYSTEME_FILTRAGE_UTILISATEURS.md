# 🎯 SYSTÈME DE FILTRAGE DES UTILISATEURS E-PILOT

**Date :** 3 novembre 2025  
**Statut :** ✅ **OPÉRATIONNEL**

---

## 📊 **STRUCTURE DE LA TABLE USERS**

### **Colonnes Complètes**
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin_groupe', 'admin_ecole', 'enseignant', 'cpe', 'comptable')),
  school_group_id UUID REFERENCES school_groups(id),
  school_id UUID REFERENCES schools(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gender VARCHAR(1) CHECK (gender IN ('M', 'F')),  -- ✅ Existe
  date_of_birth DATE  -- ✅ Existe
);
```

### **Exemple de Données**
```sql
INSERT INTO users VALUES (
  '38b66419-97c1-489f-abbe-fb107568d347',
  'admin@epilot.cg',
  'Ramsès',
  'MELACK',
  '+242069698620',
  'super_admin',
  NULL,  -- Super Admin n'a pas de groupe
  NULL,  -- Super Admin n'a pas d'école
  'active',
  'https://csltuxbanvweyfzqpfap.supabase.co/storage/v1/object/public/avatars/...',
  NULL,
  '2025-11-03 14:50:06.833155+00',
  '2025-11-03 20:37:19.274988+00',
  NULL,  -- Genre non renseigné
  NULL   -- Date de naissance non renseignée
);
```

---

## 🔐 **SYSTÈME DE FILTRAGE PAR RÔLE**

### **1. Protection des Routes** (`ProtectedRoute.tsx`)

```typescript
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  
  // Vérifier l'authentification
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Vérifier les rôles autorisés
  if (roles && !roles.includes(user.role)) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
}
```

**Utilisation dans App.tsx :**
```typescript
<Route path="school-groups" element={
  <ProtectedRoute roles={['super_admin']}>
    <SchoolGroups />
  </ProtectedRoute>
} />

<Route path="schools" element={
  <ProtectedRoute roles={['admin_groupe', 'group_admin']}>
    <Schools />
  </ProtectedRoute>
} />
```

---

### **2. Menu Dynamique** (`DashboardLayout.tsx`)

```typescript
const allNavigationItems = [
  {
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    href: '/dashboard',
    roles: ['super_admin', 'admin_groupe', 'admin_ecole'], // Tous
  },
  {
    title: 'Groupes Scolaires',
    icon: Building2,
    href: '/dashboard/school-groups',
    roles: ['super_admin'], // ✅ Super Admin uniquement
  },
  {
    title: 'Écoles',
    icon: School,
    href: '/dashboard/schools',
    roles: ['admin_groupe', 'group_admin'], // ✅ Admin Groupe uniquement
  },
  {
    title: 'Utilisateurs',
    icon: Users,
    href: '/dashboard/users',
    roles: ['super_admin', 'admin_groupe'], // ✅ Les deux
  },
];

// Filtrage automatique selon le rôle
const navigationItems = useMemo(() => {
  return allNavigationItems.filter(item => 
    item.roles.includes(user?.role || '')
  );
}, [user?.role]);
```

---

### **3. Labels des Rôles**

```typescript
const getRoleLabel = (role: string | undefined) => {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'admin_groupe':
    case 'group_admin': return 'Admin Groupe';
    case 'admin_ecole': return 'Admin École';
    case 'enseignant': return 'Enseignant';
    case 'cpe': return 'CPE';
    case 'comptable': return 'Comptable';
    default: return 'Utilisateur';
  }
};
```

---

## 🎯 **HIÉRARCHIE DES RÔLES**

### **Super Admin E-Pilot (Niveau Plateforme)**

**Permissions :**
- ✅ Voir tous les groupes scolaires
- ✅ Créer/modifier/supprimer des groupes
- ✅ Créer des Administrateurs de Groupes
- ✅ Gérer les plans d'abonnement
- ✅ Gérer les catégories métiers
- ✅ Gérer les modules pédagogiques
- ❌ Ne gère PAS directement les écoles
- ❌ Ne gère PAS les utilisateurs des écoles

**Interface affichée :**
```
Menu :
- Tableau de bord
- Groupes Scolaires ✅
- Utilisateurs (Admin Groupes uniquement)
- Catégories Métiers
- Plans
- Modules Pédagogiques
- Abonnements
- Finances
- Communication
- Rapports
```

**Données visibles :**
```sql
-- Tous les groupes scolaires
SELECT * FROM school_groups;

-- Tous les Admin Groupes
SELECT * FROM users 
WHERE role = 'admin_groupe';
```

---

### **Admin Groupe Scolaire (Niveau Groupe)**

**Permissions :**
- ✅ Voir toutes les écoles de son groupe
- ✅ Créer/modifier/supprimer des écoles
- ✅ Créer des Administrateurs d'École
- ✅ Créer tous types d'utilisateurs (enseignants, CPE, etc.)
- ✅ Voir les modules de son groupe
- ❌ Ne peut pas voir les autres groupes
- ❌ Ne peut pas gérer les plans

**Interface affichée :**
```
Menu :
- Tableau de bord
- Écoles ✅
- Utilisateurs (de son groupe)
- Mes Modules
- Finances (de son groupe)
- Communication
- Rapports
```

**Données visibles :**
```sql
-- Ses écoles uniquement
SELECT * FROM schools 
WHERE school_group_id = :user_school_group_id;

-- Ses utilisateurs uniquement
SELECT * FROM users 
WHERE school_group_id = :user_school_group_id;
```

---

### **Admin École (Niveau École)**

**Permissions :**
- ✅ Voir uniquement son école
- ✅ Créer/modifier des utilisateurs de son école
- ❌ Ne peut pas voir les autres écoles
- ❌ Ne peut pas créer d'Admin École

**Interface affichée :**
```
Menu :
- Tableau de bord
- Mon École
- Utilisateurs (de son école)
- Modules (de son école)
- Rapports
```

**Données visibles :**
```sql
-- Son école uniquement
SELECT * FROM schools 
WHERE id = :user_school_id;

-- Ses utilisateurs uniquement
SELECT * FROM users 
WHERE school_id = :user_school_id;
```

---

## 📋 **FILTRAGE DES DONNÉES**

### **1. Hooks React Query avec Filtrage**

```typescript
// useUsers.ts - Filtrage automatique
export const useUsers = (filters?: UserFilters) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      let query = supabase.from('users').select('*');
      
      // Filtrage selon le rôle
      if (user?.role === 'admin_groupe') {
        query = query.eq('school_group_id', user.schoolGroupId);
      } else if (user?.role === 'admin_ecole') {
        query = query.eq('school_id', user.schoolId);
      }
      // Super Admin voit tout (pas de filtre)
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
```

---

### **2. Policies RLS (Row Level Security)**

```sql
-- Policy pour Super Admin (voit tout)
CREATE POLICY "super_admin_all_access" ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_admin'
  )
);

-- Policy pour Admin Groupe (son groupe uniquement)
CREATE POLICY "admin_groupe_own_group" ON users
FOR ALL
TO authenticated
USING (
  school_group_id IN (
    SELECT school_group_id FROM users
    WHERE id = auth.uid()
    AND role = 'admin_groupe'
  )
);

-- Policy pour Admin École (son école uniquement)
CREATE POLICY "admin_ecole_own_school" ON users
FOR ALL
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'admin_ecole'
  )
);
```

---

## 🎨 **AFFICHAGE CONDITIONNEL**

### **1. Boutons selon les Permissions**

```typescript
// Afficher "Créer Groupe" uniquement pour Super Admin
{user?.role === 'super_admin' && (
  <Button onClick={handleCreateGroup}>
    Créer un Groupe Scolaire
  </Button>
)}

// Afficher "Créer École" uniquement pour Admin Groupe
{user?.role === 'admin_groupe' && (
  <Button onClick={handleCreateSchool}>
    Créer une École
  </Button>
)}
```

---

### **2. Colonnes selon les Permissions**

```typescript
// Afficher "Groupe Scolaire" uniquement pour Super Admin
const columns = [
  { key: 'name', label: 'Nom' },
  { key: 'email', label: 'Email' },
  ...(user?.role === 'super_admin' 
    ? [{ key: 'schoolGroup', label: 'Groupe Scolaire' }]
    : []
  ),
];
```

---

## 🧪 **TESTS DE VALIDATION**

### **Test 1 : Super Admin**
```
1. Se connecter avec admin@epilot.cg
2. Vérifier le menu :
   ✅ Groupes Scolaires visible
   ✅ Écoles NON visible
3. Page Utilisateurs :
   ✅ Voir tous les Admin Groupes
   ✅ Bouton "Créer Admin Groupe" visible
```

### **Test 2 : Admin Groupe**
```
1. Se connecter avec un Admin Groupe
2. Vérifier le menu :
   ✅ Écoles visible
   ✅ Groupes Scolaires NON visible
3. Page Utilisateurs :
   ✅ Voir uniquement les utilisateurs de son groupe
   ✅ Bouton "Créer Utilisateur" visible
```

### **Test 3 : Admin École**
```
1. Se connecter avec un Admin École
2. Vérifier le menu :
   ✅ Mon École visible
   ✅ Écoles NON visible
3. Page Utilisateurs :
   ✅ Voir uniquement les utilisateurs de son école
```

---

## 🎯 **RÉSUMÉ DES COLONNES USERS**

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | UUID | Non | Identifiant unique |
| `email` | VARCHAR | Non | Email unique |
| `first_name` | VARCHAR | Non | Prénom |
| `last_name` | VARCHAR | Non | Nom |
| `phone` | VARCHAR | Oui | Téléphone |
| `role` | VARCHAR | Non | Rôle (super_admin, admin_groupe, etc.) |
| `school_group_id` | UUID | Oui | Groupe scolaire (NULL pour Super Admin) |
| `school_id` | UUID | Oui | École (NULL pour Super Admin et Admin Groupe) |
| `status` | VARCHAR | Non | Statut (active, inactive, suspended) |
| `avatar` | TEXT | Oui | URL avatar |
| `last_login` | TIMESTAMP | Oui | Dernière connexion |
| `created_at` | TIMESTAMP | Non | Date de création |
| `updated_at` | TIMESTAMP | Non | Date de modification |
| `gender` | VARCHAR(1) | Oui | Genre (M ou F) ✅ |
| `date_of_birth` | DATE | Oui | Date de naissance ✅ |

---

## ✅ **STATUT FINAL**

| Composant | Statut |
|-----------|--------|
| Table `users` | ✅ Complète avec gender et date_of_birth |
| Formulaire | ✅ Envoie gender et date_of_birth |
| Hook `useUsers` | ✅ Sauvegarde gender et date_of_birth |
| Filtrage par rôle | ✅ Opérationnel |
| Menu dynamique | ✅ Opérationnel |
| Protection routes | ✅ Opérationnelle |
| Policies RLS | ✅ Configurées |

---

**🎉 SYSTÈME 100% OPÉRATIONNEL !**

---

**Auteur :** Cascade AI  
**Date :** 3 novembre 2025  
**Version :** 1.0.0
