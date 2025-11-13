# 📋 LOGIQUE DES FORMULAIRES - GUIDE COMPLET

## 🎯 Vue d'ensemble

E-Pilot utilise **2 formulaires principaux** pour la gestion des entités :
1. **SchoolGroupFormDialog** - Gestion des Groupes Scolaires
2. **UserFormDialog** - Gestion des Utilisateurs

---

## 1️⃣ SchoolGroupFormDialog

### **Localisation** :
`src/features/dashboard/components/school-groups/SchoolGroupFormDialog.tsx`

### **Modes d'utilisation** :
```tsx
// Mode création
<SchoolGroupFormDialog
  open={isCreateModalOpen}
  onOpenChange={setIsCreateModalOpen}
  mode="create"
/>

// Mode édition
<SchoolGroupFormDialog
  open={isEditModalOpen}
  onOpenChange={setIsEditModalOpen}
  schoolGroup={selectedGroup}
  mode="edit"
/>
```

### **Champs du formulaire** :

| Champ | Type | Requis | Validation | Mode |
|-------|------|--------|------------|------|
| **Nom du groupe** | Input | ✅ Oui | Min 3 caractères | Création + Édition |
| **Code** | Input | ✅ Oui | Unique, format CODE-XXX | Création + Édition |
| **Adresse** | Input | ✅ Oui | Min 10 caractères | Création + Édition |
| **Département** | Select | ✅ Oui | Liste prédéfinie | Création + Édition |
| **Ville** | Input | ✅ Oui | Min 3 caractères | Création + Édition |
| **Téléphone** | Input | ❌ Non | +242 ou 0 + 9 chiffres | Création + Édition |
| **Email** | Input | ❌ Non | Format .cg ou .com | Création + Édition |
| **Logo** | Upload | ❌ Non | Image, max 5MB | Création + Édition |
| **Plan** | Select | ✅ Oui | gratuit/premium/pro/institutionnel | Création + Édition |
| **Statut** | Select | ✅ Oui | active/inactive/suspended | Édition uniquement |

### **Schéma de validation (Zod)** :
```typescript
const schoolGroupSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  code: z.string().min(3, 'Le code doit contenir au moins 3 caractères'),
  address: z.string().min(10, 'L\'adresse doit contenir au moins 10 caractères'),
  department: z.string().min(1, 'Le département est requis'),
  city: z.string().min(3, 'La ville doit contenir au moins 3 caractères'),
  phone: z.string().regex(/^(\+242|0)[0-9]{9}$/, 'Format invalide').optional(),
  email: z.string().email('Email invalide').regex(/\.(cg|com)$/, 'Domaine .cg ou .com requis').optional(),
  logo: z.string().optional(),
  plan: z.enum(['gratuit', 'premium', 'pro', 'institutionnel']),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});
```

### **Logique de soumission** :
```typescript
const onSubmit = async (data: SchoolGroupFormData) => {
  try {
    if (mode === 'create') {
      await createSchoolGroup.mutateAsync(data);
      toast.success('✅ Groupe créé avec succès');
    } else {
      await updateSchoolGroup.mutateAsync({ id: schoolGroup.id, ...data });
      toast.success('✅ Groupe modifié avec succès');
    }
    onOpenChange(false);
    form.reset();
  } catch (error: any) {
    toast.error('❌ Erreur', {
      description: error.message || 'Une erreur est survenue',
    });
  }
};
```

### **Upload du logo** :
```typescript
// Compression automatique en WebP
const handleLogoUpload = async (file: File) => {
  // 1. Vérifier la taille (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Le fichier est trop volumineux (max 5MB)');
    return;
  }

  // 2. Compresser en WebP (qualité 85%, max 400x400px)
  const compressedImage = await compressImage(file, {
    quality: 0.85,
    maxWidth: 400,
    maxHeight: 400,
    format: 'webp',
  });

  // 3. Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from('logos')
    .upload(`school-groups/${Date.now()}.webp`, compressedImage);

  if (error) {
    toast.error('Erreur lors de l\'upload');
    return;
  }

  // 4. Récupérer l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl(data.path);

  // 5. Mettre à jour le formulaire
  form.setValue('logo', publicUrl);
};
```

### **Départements disponibles** :
```typescript
const departments = [
  'Brazzaville',
  'Pointe-Noire',
  'Kouilou',
  'Niari',
  'Lékoumou',
  'Bouenza',
  'Pool',
  'Plateaux',
  'Cuvette',
  'Cuvette-Ouest',
  'Sangha',
  'Likouala',
];
```

---

## 2️⃣ UserFormDialog

### **Localisation** :
`src/features/dashboard/components/UserFormDialog.tsx`

### **Modes d'utilisation** :
```tsx
// Mode création
<UserFormDialog
  open={isCreateDialogOpen}
  onOpenChange={setIsCreateDialogOpen}
  mode="create"
/>

// Mode édition
<UserFormDialog
  open={isEditDialogOpen}
  onOpenChange={setIsEditDialogOpen}
  user={selectedUser}
  mode="edit"
/>
```

### **Champs du formulaire** :

| Champ | Type | Requis | Validation | Mode |
|-------|------|--------|------------|------|
| **Prénom** | Input | ✅ Oui | Min 2 caractères | Création + Édition |
| **Nom** | Input | ✅ Oui | Min 2 caractères | Création + Édition |
| **Email** | Input | ✅ Oui | Unique, format .cg ou .com | Création (disabled en édition) |
| **Téléphone** | Input | ❌ Non | +242 ou 0 + 9 chiffres | Création + Édition |
| **Rôle** | Select | ✅ Oui | super_admin ou admin_groupe | Création + Édition |
| **Groupe scolaire** | Select | ⚠️ Conditionnel | Requis si admin_groupe | Création + Édition |
| **Mot de passe** | Input | ✅ Oui | Min 8 caractères | Création uniquement |
| **Avatar** | Upload | ❌ Non | Image, max 5MB | Création + Édition |
| **Statut** | Select | ✅ Oui | active/inactive/suspended | Édition uniquement |

### **Schéma de validation (Zod)** :
```typescript
// Mode création
const userCreateSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide').regex(/\.(cg|com)$/, 'Domaine .cg ou .com requis'),
  phone: z.string().regex(/^(\+242|0)[0-9]{9}$/, 'Format invalide').optional(),
  role: z.enum(['super_admin', 'admin_groupe']),
  schoolGroupId: z.string().optional(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  avatar: z.string().optional(),
}).refine((data) => {
  // Si admin_groupe, schoolGroupId est requis
  if (data.role === 'admin_groupe' && !data.schoolGroupId) {
    return false;
  }
  return true;
}, {
  message: 'Le groupe scolaire est requis pour un Administrateur de Groupe',
  path: ['schoolGroupId'],
});

// Mode édition
const userEditSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().regex(/^(\+242|0)[0-9]{9}$/, 'Format invalide').optional(),
  role: z.enum(['super_admin', 'admin_groupe']),
  schoolGroupId: z.string().optional(),
  avatar: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
}).refine((data) => {
  if (data.role === 'admin_groupe' && !data.schoolGroupId) {
    return false;
  }
  return true;
}, {
  message: 'Le groupe scolaire est requis pour un Administrateur de Groupe',
  path: ['schoolGroupId'],
});
```

### **Logique de soumission** :
```typescript
const onSubmit = async (data: UserFormData) => {
  try {
    if (mode === 'create') {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (authError) throw authError;

      // 2. Créer l'utilisateur dans la table users
      const { error: dbError } = await supabase.from('users').insert({
        id: authData.user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        school_group_id: data.schoolGroupId,
        avatar: data.avatar,
        status: 'active',
      });

      if (dbError) throw dbError;

      toast.success('✅ Utilisateur créé avec succès');
    } else {
      // Mode édition
      await updateUser.mutateAsync({ id: user.id, ...data });
      toast.success('✅ Utilisateur modifié avec succès');
    }
    onOpenChange(false);
    form.reset();
  } catch (error: any) {
    toast.error('❌ Erreur', {
      description: error.message || 'Une erreur est survenue',
    });
  }
};
```

### **Logique conditionnelle du champ Groupe** :
```typescript
// Afficher le champ Groupe scolaire uniquement si role === 'admin_groupe'
const selectedRole = form.watch('role');

{selectedRole === 'admin_groupe' && (
  <FormField
    control={form.control}
    name="schoolGroupId"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Groupe Scolaire *</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un groupe" />
          </SelectTrigger>
          <SelectContent>
            {schoolGroups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
)}
```

### **Upload de l'avatar** :
```typescript
// Compression automatique en WebP
const handleAvatarUpload = async (file: File) => {
  // 1. Vérifier la taille (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Le fichier est trop volumineux (max 5MB)');
    return;
  }

  // 2. Compresser en WebP (qualité 85%, max 400x400px)
  const compressedImage = await compressImage(file, {
    quality: 0.85,
    maxWidth: 400,
    maxHeight: 400,
    format: 'webp',
  });

  // 3. Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`users/${Date.now()}.webp`, compressedImage);

  if (error) {
    toast.error('Erreur lors de l\'upload');
    return;
  }

  // 4. Récupérer l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  // 5. Mettre à jour le formulaire
  form.setValue('avatar', publicUrl);
};
```

### **Réinitialisation du mot de passe** :
```typescript
// Bouton séparé pour réinitialiser le mot de passe (mode édition uniquement)
const handleResetPassword = async (user: User) => {
  if (confirm(`Envoyer un email de réinitialisation à ${user.email} ?`)) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('✅ Email de réinitialisation envoyé');
    } catch (error: any) {
      toast.error('❌ Erreur', {
        description: error.message || 'Erreur lors de l\'envoi',
      });
    }
  }
};
```

---

## 🔐 Hiérarchie des rôles

### **Super Admin E-Pilot** :
- **Scope** : Plateforme entière
- **Peut créer** : Administrateurs de Groupe
- **Groupe scolaire** : Non requis (N/A)
- **Badge** : Violet avec icône Shield

### **Administrateur de Groupe** :
- **Scope** : Son groupe scolaire + toutes ses écoles
- **Peut créer** : Administrateurs d'École + Utilisateurs
- **Groupe scolaire** : Requis
- **Badge** : Bleu avec icône Building2

---

## ✅ Validation des données

### **Format téléphone** :
```regex
^(\+242|0)[0-9]{9}$
```
**Exemples valides** :
- +242064123456
- 0064123456

### **Format email** :
```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(cg|com)$
```
**Exemples valides** :
- admin@epilot.cg
- contact@school.com

### **Format code groupe** :
```regex
^[A-Z0-9-]+$
```
**Exemples valides** :
- GRP-001
- SCHOOL-BZV-01

---

## 🎨 UI/UX des formulaires

### **Layout** :
- **Largeur** : max-w-2xl (672px) pour SchoolGroups, max-w-6xl (1152px) pour Users
- **Sections** : Visuellement séparées avec gradients colorés
- **Responsive** : Mobile-first, grilles adaptatives

### **Sections colorées** :
```tsx
// SchoolGroups
1. Informations générales : Gradient blue-50 → blue-100/50
2. Localisation : Gradient green-50 → green-100/50
3. Contact : Gradient purple-50 → purple-100/50
4. Configuration : Gradient orange-50 → orange-100/50

// Users
1. Avatar : Gradient gray-50 → gray-100
2. Informations personnelles : Gradient blue-50 → blue-100/50
3. Association & Sécurité : Gradient green-50 → green-100/50
```

### **Feedback visuel** :
- ✅ Skeleton loader pendant chargement
- ✅ Messages de succès (toast vert)
- ✅ Messages d'erreur (toast rouge)
- ✅ Validation en temps réel
- ✅ Indicateurs de champs requis (*)

---

## 🚀 Bonnes pratiques

### **1. Validation côté client ET serveur** :
```typescript
// Client (Zod)
const schema = z.object({...});

// Serveur (Supabase RLS)
CREATE POLICY "Users can only update their own data"
ON users FOR UPDATE
USING (auth.uid() = id);
```

### **2. Gestion des erreurs** :
```typescript
try {
  await mutation.mutateAsync(data);
  toast.success('✅ Succès');
} catch (error: any) {
  // Afficher un message d'erreur clair
  toast.error('❌ Erreur', {
    description: error.message || 'Une erreur est survenue',
  });
}
```

### **3. Reset du formulaire** :
```typescript
// Après succès
onOpenChange(false);
form.reset();

// Après fermeture
useEffect(() => {
  if (!open) {
    form.reset();
  }
}, [open]);
```

### **4. Optimistic updates** :
```typescript
// Mettre à jour l'UI immédiatement
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newData) => {
    // Annuler les requêtes en cours
    await queryClient.cancelQueries({ queryKey: ['users'] });
    
    // Sauvegarder les données actuelles
    const previousData = queryClient.getQueryData(['users']);
    
    // Mettre à jour optimistiquement
    queryClient.setQueryData(['users'], (old) => ({
      ...old,
      ...newData,
    }));
    
    return { previousData };
  },
  onError: (err, newData, context) => {
    // Rollback en cas d'erreur
    queryClient.setQueryData(['users'], context.previousData);
  },
  onSettled: () => {
    // Refetch pour synchroniser
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

---

## 📋 Checklist de vérification

### **Avant de soumettre** :
- [ ] Tous les champs requis sont remplis
- [ ] Les formats sont valides (email, téléphone)
- [ ] Le groupe est sélectionné (si admin_groupe)
- [ ] Le mot de passe est suffisamment fort (création)
- [ ] L'email est unique (création)
- [ ] Le code est unique (SchoolGroups)

### **Après soumission** :
- [ ] Message de succès affiché
- [ ] Formulaire fermé
- [ ] Formulaire réinitialisé
- [ ] Liste mise à jour (React Query)
- [ ] Pas d'erreur console

---

## 🎉 Conclusion

**Les formulaires E-Pilot sont** :
- ✅ **Validés** - Zod + Supabase RLS
- ✅ **Sécurisés** - Authentification + Autorisation
- ✅ **Performants** - Optimistic updates + Cache
- ✅ **Accessibles** - WCAG 2.2 AA
- ✅ **Responsive** - Mobile + Desktop
- ✅ **Intuitifs** - UX optimale

**Prêts pour la production !** 🚀🇨🇬
