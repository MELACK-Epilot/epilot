# ✅ AJOUT CHAMPS FORMULAIRE UTILISATEUR

**Date**: 29 Octobre 2025 à 14h45  
**Statut**: ⏳ **EN COURS - Erreurs TypeScript à résoudre**

---

## 🎯 Objectif

Ajouter les champs manquants au formulaire de création d'utilisateur :
1. **Genre** (Masculin/Féminin)
2. **Date de naissance**
3. **Rôle** (Super Admin E-Pilot / Administrateur de Groupe Scolaire)

---

## ✅ Modifications Effectuées

### 1. Base de Données (SUPABASE_SQL_SCHEMA.sql)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F')),  -- ✅ AJOUTÉ
  date_of_birth DATE,                         -- ✅ AJOUTÉ
  phone TEXT,
  role user_role NOT NULL DEFAULT 'enseignant',
  school_group_id UUID,
  school_id UUID,
  status status NOT NULL DEFAULT 'active',
  avatar TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Nouveaux champs** :
- `gender` : TEXT avec contrainte ('M', 'F')
- `date_of_birth` : DATE

---

### 2. Types TypeScript (dashboard.types.ts)

```typescript
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  gender?: 'M' | 'F';           // ✅ AJOUTÉ
  dateOfBirth?: string;         // ✅ AJOUTÉ (Format ISO)
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  schoolGroupId?: string;
  schoolGroupName?: string;
  schoolId?: string;
  schoolName?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 3. Schéma Zod (UserFormDialog.tsx)

```typescript
const baseUserSchema = z.object({
  firstName: z.string().min(2).max(50).regex(/^[a-zA-ZÀ-ÿ\s-]+$/),
  lastName: z.string().min(2).max(50).regex(/^[a-zA-ZÀ-ÿ\s-]+$/),
  gender: z.enum(['M', 'F'], {                    // ✅ AJOUTÉ
    errorMap: () => ({ message: 'Veuillez sélectionner un genre' }),
  }).optional(),
  dateOfBirth: z.string().optional(),             // ✅ AJOUTÉ
  email: z.string().email().toLowerCase().refine(...),
  phone: z.string().regex(/^(\+242|0)[0-9]{9}$/),
  role: z.enum(['super_admin', 'admin_groupe'], { // ✅ AJOUTÉ
    errorMap: () => ({ message: 'Veuillez sélectionner un rôle' }),
  }),
  schoolGroupId: z.string().uuid().min(1).optional(), // ✅ MODIFIÉ (optional)
  avatar: z.string().optional(),
});
```

---

### 4. Champs Formulaire (UserFormDialog.tsx)

#### Champ Genre
```tsx
<FormField
  control={form.control}
  name="gender"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Genre</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le genre" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="M">👨 Masculin</SelectItem>
          <SelectItem value="F">👩 Féminin</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Champ Date de Naissance
```tsx
<FormField
  control={form.control}
  name="dateOfBirth"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Date de naissance</FormLabel>
      <FormControl>
        <Input type="date" {...field} disabled={isLoading} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Champ Rôle
```tsx
<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Rôle *</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un rôle" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="super_admin">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#1D3557]" />
              <span>Super Admin E-Pilot</span>
            </div>
          </SelectItem>
          <SelectItem value="admin_groupe">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-[#2A9D8F]" />
              <span>Administrateur de Groupe Scolaire</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <FormDescription className="text-xs">
        Le rôle détermine les permissions de l'utilisateur
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Champ Groupe Scolaire (Conditionnel)
```tsx
<FormField
  control={form.control}
  name="schoolGroupId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        Groupe Scolaire {form.watch('role') === 'admin_groupe' && '*'}
      </FormLabel>
      <Select 
        onValueChange={field.onChange} 
        defaultValue={field.value}
        disabled={isLoadingGroups || isLoading || form.watch('role') === 'super_admin'}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={
              form.watch('role') === 'super_admin'
                ? "Non applicable pour Super Admin"
                : isLoadingGroups 
                ? "Chargement..." 
                : "Sélectionnez un groupe scolaire"
            } />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {/* ... options ... */}
        </SelectContent>
      </Select>
      <FormDescription className="text-xs">
        {form.watch('role') === 'super_admin' 
          ? "Les Super Admins gèrent tous les groupes"
          : "Le groupe scolaire que cet administrateur gérera"}
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 📋 Logique Métier

### Rôle Super Admin
- **Groupe Scolaire** : Non obligatoire (désactivé dans le formulaire)
- **Permissions** : Gère tous les groupes scolaires
- **Scope** : Niveau plateforme

### Rôle Administrateur de Groupe
- **Groupe Scolaire** : Obligatoire (*)
- **Permissions** : Gère uniquement son groupe
- **Scope** : Multi-écoles de son groupe

---

## ⚠️ Problèmes Identifiés

### Erreurs TypeScript
Il y a des incompatibilités de types entre :
1. Le schéma Zod (`role: 'super_admin' | 'admin_groupe'`)
2. Le type `UserRole` (`'super_admin' | 'admin_groupe' | 'admin_ecole' | ...`)
3. Les hooks `useCreateUser` et `useUpdateUser`

### À Corriger
1. **Hooks** : Mettre à jour les types dans `useUsers.ts`
2. **Validation** : Gérer `schoolGroupId` conditionnel selon le rôle
3. **Types** : Aligner tous les types TypeScript

---

## 🎯 Résultat Visuel

Le formulaire affiche maintenant :

### Section "Informations personnelles" (Bleu)
- Prénom *
- Nom *
- Email *
- Téléphone *
- **Genre** (👨 Masculin / 👩 Féminin) ✅ NOUVEAU
- **Date de naissance** ✅ NOUVEAU

### Section "Association & Sécurité" (Vert)
- **Rôle** * (🛡️ Super Admin / 👤 Admin Groupe) ✅ NOUVEAU
- Groupe Scolaire (conditionnel selon rôle)
- Mot de passe * (création uniquement)
- Email de bienvenue (création uniquement)
- Statut (édition uniquement)

---

## 📝 Migration SQL Requise

Pour ajouter les champs à la base de données existante :

```sql
-- Ajouter les nouveaux champs
ALTER TABLE users 
ADD COLUMN gender TEXT CHECK (gender IN ('M', 'F')),
ADD COLUMN date_of_birth DATE;

-- Créer des index si nécessaire
CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_users_date_of_birth ON users(date_of_birth);
```

---

## ✅ Prochaines Étapes

1. ⏳ **Corriger les erreurs TypeScript** dans les hooks
2. ⏳ **Tester le formulaire** en mode création
3. ⏳ **Tester le formulaire** en mode édition
4. ⏳ **Exécuter la migration SQL** sur Supabase
5. ⏳ **Vérifier l'affichage** dans le tableau Users
6. ⏳ **Mettre à jour l'export CSV** pour inclure genre et date de naissance

---

## 📊 Mapping Complet BDD ↔ UI

| Champ BDD | Type BDD | Champ UI | Type UI | Obligatoire | Statut |
|-----------|----------|----------|---------|-------------|--------|
| `first_name` | TEXT | Prénom | string | ✅ | ✅ |
| `last_name` | TEXT | Nom | string | ✅ | ✅ |
| `gender` | TEXT | Genre | 'M'\|'F' | ❌ | ✅ NOUVEAU |
| `date_of_birth` | DATE | Date de naissance | string | ❌ | ✅ NOUVEAU |
| `email` | TEXT | Email | string | ✅ | ✅ |
| `phone` | TEXT | Téléphone | string | ✅ | ✅ |
| `role` | user_role | Rôle | enum | ✅ | ✅ NOUVEAU |
| `school_group_id` | UUID | Groupe Scolaire | string | Conditionnel | ✅ |
| `avatar` | TEXT | Avatar | string | ❌ | ✅ |

---

**Créé par** : Cascade AI  
**Date** : 29 Octobre 2025 à 14h45  
**Statut** : ⏳ **EN COURS**
