# 🔧 Implémentation API - Espace Admin Groupe

**Date**: 1er novembre 2025  
**Version**: 1.0  
**Statut**: 📋 **GUIDE D'IMPLÉMENTATION**

---

## 🎯 Architecture API

### Base URL
```
Production: https://api.e-pilot.com/v1
Development: http://localhost:3000/api
```

### Authentification
```typescript
// Toutes les requêtes nécessitent un JWT token
Headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}

// Token payload
{
  user_id: string,
  groupe_id: string,
  role: 'admin_groupe',
  plan_id: string,
  exp: number
}
```

---

## 📊 1. Dashboard API

### GET /api/groupe/dashboard

**Implémentation Supabase** :
```typescript
// src/features/groupe/hooks/useGroupDashboard.ts
export const useGroupDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-dashboard', user.schoolGroupId],
    queryFn: async () => {
      // 1. Stats écoles
      const { count: schoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .eq('school_group_id', user.schoolGroupId)
        .is('deleted_at', null);

      // 2. Stats utilisateurs
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('school_group_id', user.schoolGroupId)
        .eq('status', 'active');

      // 3. Stats élèves
      const { data: schools } = await supabase
        .from('schools')
        .select('id')
        .eq('school_group_id', user.schoolGroupId);

      const schoolIds = schools.map(s => s.id);

      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('school_id', schoolIds);

      // 4. Récupérer le plan
      const { data: group } = await supabase
        .from('school_groups')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('id', user.schoolGroupId)
        .single();

      // 5. Activité récente
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('school_group_id', user.schoolGroupId)
        .order('created_at', { ascending: false })
        .limit(10);

      // 6. Calculer alertes
      const quotas = {
        ecoles: {
          utilise: schoolsCount,
          max: group.subscription_plans.max_schools,
          pourcentage: (schoolsCount / group.subscription_plans.max_schools) * 100
        },
        utilisateurs: {
          utilise: usersCount,
          max: group.subscription_plans.max_users,
          pourcentage: (usersCount / group.subscription_plans.max_users) * 100
        },
        eleves: {
          utilise: studentsCount,
          max: group.subscription_plans.max_students,
          pourcentage: (studentsCount / group.subscription_plans.max_students) * 100
        }
      };

      const alertes = generateAlerts(quotas);

      return {
        statistiques: quotas,
        groupe: group,
        plan: group.subscription_plans,
        activite_recente: activities,
        alertes: alertes
      };
    },
    staleTime: 60000, // 1 minute
  });
};

// Fonction génération alertes
const generateAlerts = (quotas) => {
  const alerts = [];

  Object.entries(quotas).forEach(([key, quota]) => {
    if (quota.pourcentage >= 100) {
      alerts.push({
        type: 'error',
        niveau: 'rouge',
        ressource: key,
        message: `Limite atteinte : Vous ne pouvez plus créer de ${key}`,
        action: 'Passez à un plan supérieur pour continuer'
      });
    } else if (quota.pourcentage >= 90) {
      alerts.push({
        type: 'warning',
        niveau: 'orange',
        ressource: key,
        message: `Vous approchez de la limite de ${key} (${Math.round(quota.pourcentage)}% utilisé)`,
        action: 'Envisagez de passer à un plan supérieur'
      });
    } else if (quota.pourcentage >= 80) {
      alerts.push({
        type: 'info',
        niveau: 'jaune',
        ressource: key,
        message: `Attention : ${Math.round(quota.pourcentage)}% de votre quota ${key} utilisé`,
        action: 'Surveillez votre utilisation'
      });
    }
  });

  return alerts;
};
```

---

## 🏫 2. Gestion des Écoles

### Hook useGroupSchools
```typescript
// src/features/groupe/hooks/useGroupSchools.ts
export const useGroupSchools = (filters?: SchoolFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-schools', user.schoolGroupId, filters],
    queryFn: async () => {
      let query = supabase
        .from('schools')
        .select(`
          *,
          users!schools_admin_id_fkey(first_name, last_name, email)
        `)
        .eq('school_group_id', user.schoolGroupId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Filtres
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }

      if (filters?.statut) {
        query = query.eq('status', filters.statut);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Récupérer le quota
      const { data: plan } = await supabase
        .from('school_groups')
        .select('subscription_plans(max_schools)')
        .eq('id', user.schoolGroupId)
        .single();

      return {
        data: data,
        quota: {
          utilise: data.length,
          max: plan.subscription_plans.max_schools,
          restant: plan.subscription_plans.max_schools - data.length
        }
      };
    },
  });
};
```

### Hook useCreateGroupSchool
```typescript
export const useCreateGroupSchool = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (schoolData: CreateSchoolInput) => {
      // 1. Vérifier le quota
      const { canCreate, limit, current } = await checkQuota('schools', user.schoolGroupId);

      if (!canCreate) {
        throw new Error(`Limite atteinte : ${current}/${limit} écoles maximum pour votre plan`);
      }

      // 2. Créer l'école
      const { data, error } = await supabase
        .from('schools')
        .insert({
          ...schoolData,
          school_group_id: user.schoolGroupId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Logger l'activité
      await logActivity({
        type: 'creation_ecole',
        description: `École ${data.name} créée`,
        school_group_id: user.schoolGroupId,
        user_id: user.id
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-schools'] });
      queryClient.invalidateQueries({ queryKey: ['group-dashboard'] });
      toast.success('École créée avec succès');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message
      });
    }
  });
};

// Fonction vérification quota
const checkQuota = async (resource: string, groupId: string) => {
  // Récupérer le plan
  const { data: group } = await supabase
    .from('school_groups')
    .select('subscription_plans(*)')
    .eq('id', groupId)
    .single();

  // Compter les ressources actuelles
  let current = 0;
  let limit = 0;

  switch (resource) {
    case 'schools':
      const { count } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .eq('school_group_id', groupId)
        .is('deleted_at', null);
      current = count || 0;
      limit = group.subscription_plans.max_schools;
      break;

    case 'users':
      // Similar logic
      break;

    case 'students':
      // Similar logic
      break;
  }

  return {
    canCreate: current < limit,
    current,
    limit,
    remaining: limit - current
  };
};
```

---

## 👥 3. Gestion des Utilisateurs

### Hook useCreateGroupUser
```typescript
export const useCreateGroupUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userData: CreateUserInput) => {
      // 1. Vérifier le quota
      const { canCreate, limit, current } = await checkQuota('users', user.schoolGroupId);

      if (!canCreate) {
        throw new Error(`Limite atteinte : ${current}/${limit} utilisateurs maximum`);
      }

      // 2. Vérifier que l'école appartient au groupe
      const { data: school } = await supabase
        .from('schools')
        .select('school_group_id')
        .eq('id', userData.school_id)
        .single();

      if (school.school_group_id !== user.schoolGroupId) {
        throw new Error('Cette école n\'appartient pas à votre groupe');
      }

      // 3. Générer mot de passe temporaire
      const tempPassword = generateSecurePassword();

      // 4. Créer dans Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: tempPassword,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            force_password_change: true
          }
        }
      });

      if (authError) throw authError;

      // 5. Créer dans table users
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          school_id: userData.school_id,
          school_group_id: user.schoolGroupId,
          status: 'active',
          force_password_change: true
        })
        .select()
        .single();

      if (error) throw error;

      // 6. Envoyer email (via Edge Function)
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          to: userData.email,
          name: `${userData.first_name} ${userData.last_name}`,
          tempPassword: tempPassword,
          loginUrl: window.location.origin + '/login'
        }
      });

      return {
        user: newUser,
        credentials: {
          email: userData.email,
          temp_password: tempPassword
        }
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-users'] });
      queryClient.invalidateQueries({ queryKey: ['group-dashboard'] });
    }
  });
};

// Fonction génération mot de passe sécurisé
const generateSecurePassword = (): string => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Compléter avec des caractères aléatoires
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Mélanger
  return password.split('').sort(() => Math.random() - 0.5).join('');
};
```

---

## 👨‍🎓 4. Gestion des Élèves

### Hook useImportStudents
```typescript
export const useImportStudents = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ file, schoolId }: { file: File; schoolId: string }) => {
      // 1. Parser le fichier
      const students = await parseCSVFile(file);

      // 2. Vérifier le quota global
      const { data: schools } = await supabase
        .from('schools')
        .select('id')
        .eq('school_group_id', user.schoolGroupId);

      const schoolIds = schools.map(s => s.id);

      const { count: currentStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('school_id', schoolIds);

      const { data: plan } = await supabase
        .from('school_groups')
        .select('subscription_plans(max_students)')
        .eq('id', user.schoolGroupId)
        .single();

      const maxStudents = plan.subscription_plans.max_students;
      const totalToImport = students.length;

      if (currentStudents + totalToImport > maxStudents) {
        throw new Error(
          `Import impossible : ${totalToImport} élèves à importer, ` +
          `mais seulement ${maxStudents - currentStudents} places disponibles`
        );
      }

      // 3. Valider les données
      const validationErrors = validateStudents(students);
      if (validationErrors.length > 0) {
        throw new ValidationError('Erreurs de validation', validationErrors);
      }

      // 4. Générer les matricules
      const studentsWithMatricules = await Promise.all(
        students.map(async (student, index) => ({
          ...student,
          matricule: await generateMatricule(schoolId, student.niveau, index),
          school_id: schoolId,
          status: 'inscrit'
        }))
      );

      // 5. Insérer en batch
      const { data: importedStudents, error } = await supabase
        .from('students')
        .insert(studentsWithMatricules)
        .select();

      if (error) throw error;

      return {
        imported: importedStudents.length,
        students: importedStudents
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['group-students'] });
      queryClient.invalidateQueries({ queryKey: ['group-dashboard'] });
      toast.success(`${data.imported} élèves importés avec succès`);
    }
  });
};

// Parser CSV
const parseCSVFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const students = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const student: any = {};
          
          headers.forEach((header, index) => {
            student[header] = values[index];
          });
          
          return student;
        });
      
      resolve(students);
    };
    
    reader.onerror = () => reject(new Error('Erreur lecture fichier'));
    reader.readAsText(file);
  });
};

// Générer matricule unique
const generateMatricule = async (schoolId: string, niveau: string, index: number): Promise<string> => {
  const { data: school } = await supabase
    .from('schools')
    .select('code')
    .eq('id', schoolId)
    .single();

  const year = new Date().getFullYear();
  const niveauCode = niveau.substring(0, 3).toUpperCase();
  const sequence = String(index + 1).padStart(3, '0');

  return `${school.code}-${year}-${niveauCode}-${sequence}`;
};
```

---

## 📦 5. Plan et Quotas

### Hook useGroupPlan
```typescript
export const useGroupPlan = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-plan', user.schoolGroupId],
    queryFn: async () => {
      // 1. Récupérer le groupe avec son plan
      const { data: group } = await supabase
        .from('school_groups')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('id', user.schoolGroupId)
        .single();

      // 2. Calculer les quotas
      const quotas = await calculateQuotas(user.schoolGroupId, group.subscription_plans);

      // 3. Récupérer tous les plans disponibles
      const { data: allPlans } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      // 4. Récupérer l'historique des paiements
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('school_group_id', user.schoolGroupId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        plan_actuel: group.subscription_plans,
        quotas: quotas,
        plans_disponibles: allPlans.map(plan => ({
          ...plan,
          actuel: plan.id === group.plan_id,
          recommande: shouldRecommendPlan(plan, quotas)
        })),
        historique_paiements: payments
      };
    },
    staleTime: 300000, // 5 minutes
  });
};

// Calculer tous les quotas
const calculateQuotas = async (groupId: string, plan: any) => {
  // Écoles
  const { count: schoolsCount } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('school_group_id', groupId)
    .is('deleted_at', null);

  // Utilisateurs
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('school_group_id', groupId)
    .eq('status', 'active');

  // Élèves
  const { data: schools } = await supabase
    .from('schools')
    .select('id')
    .eq('school_group_id', groupId);

  const { count: studentsCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .in('school_id', schools.map(s => s.id));

  return {
    ecoles: {
      utilise: schoolsCount,
      max: plan.max_schools,
      pourcentage: (schoolsCount / plan.max_schools) * 100,
      restant: plan.max_schools - schoolsCount
    },
    utilisateurs: {
      utilise: usersCount,
      max: plan.max_users,
      pourcentage: (usersCount / plan.max_users) * 100,
      restant: plan.max_users - usersCount
    },
    eleves: {
      utilise: studentsCount,
      max: plan.max_students,
      pourcentage: (studentsCount / plan.max_students) * 100,
      restant: plan.max_students - studentsCount
    }
  };
};

// Recommander un plan
const shouldRecommendPlan = (plan: any, quotas: any): boolean => {
  // Recommander si au moins un quota > 80%
  return Object.values(quotas).some((quota: any) => quota.pourcentage > 80);
};
```

---

**L'implémentation API Admin Groupe est maintenant complètement documentée !** 🔧✅
