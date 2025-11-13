# 🔍 ANALYSE COMPLÈTE : FORMULAIRES & RÔLES

## 📊 STRUCTURE BDD (Vérifiée)

### Table `users`
```sql
- id UUID
- email TEXT
- first_name TEXT
- last_name TEXT
- gender TEXT
- date_of_birth DATE
- phone TEXT
- role user_role (ENUM)
- school_group_id UUID  ← Lien vers groupe scolaire
- school_id UUID        ← Lien vers école
- status status
- avatar TEXT
```

### Hiérarchie des Relations
```
school_groups (Groupe Scolaire)
    ↓
schools (Écoles du groupe)
    ↓
users (Utilisateurs de l'école)
```

---

## 🎯 HIÉRARCHIE DES RÔLES (3 Niveaux)

### Niveau 1 : Super Admin
- **Rôle** : `super_admin`
- **Champs BDD** :
  - `school_group_id` : NULL
  - `school_id` : NULL
- **Peut créer** : Groupes scolaires, Admins de groupe

### Niveau 2 : Admin de Groupe
- **Rôle** : `admin_groupe`
- **Champs BDD** :
  - `school_group_id` : ID du groupe
  - `school_id` : NULL
- **Peut créer** : Écoles, Utilisateurs (15 rôles)

### Niveau 3 : Utilisateurs (15 rôles)
- **Rôles** : `proviseur`, `directeur`, `enseignant`, `cpe`, `comptable`, etc.
- **Champs BDD** :
  - `school_group_id` : ID du groupe
  - `school_id` : ID de l'école
- **Peut créer** : Rien (utilisateurs finaux)

---

## ❌ PROBLÈME ACTUEL

### 2 Formulaires Différents

#### 1. UserFormDialog.tsx
```typescript
// Rôles autorisés
role: z.enum(['super_admin', 'admin_groupe'])

// Champs
- firstName, lastName
- email, phone
- role (super_admin OU admin_groupe)
- schoolGroupId (pour admin_groupe)
- password
```

#### 2. GroupUserFormDialog.tsx
```typescript
// Rôles autorisés
role: z.enum([
  'proviseur', 'directeur', 'enseignant',
  'cpe', 'comptable', 'secretaire',
  'surveillant', 'bibliothecaire',
  'eleve', 'parent', 'autre'
])

// Champs
- firstName, lastName
- email, phone
- role (15 rôles utilisateurs)
- schoolId (obligatoire)
- password
```

### Incohérences Identifiées

1. **Formulaires séparés** → Confusion
2. **Champs différents** :
   - UserFormDialog : `schoolGroupId`
   - GroupUserFormDialog : `schoolId`
3. **Logique dupliquée** :
   - Validation téléphone (2x)
   - Validation email (2x)
   - Upload avatar (2x)
4. **Pas de vérification du rôle connecté**
5. **Pas de filtrage intelligent des rôles**

---

## ✅ SOLUTION PROPOSÉE

### Approche : Formulaire Unifié Intelligent

#### Principe
**UN SEUL formulaire** qui s'adapte selon :
1. Le rôle de l'utilisateur connecté
2. Le mode (création/édition)
3. Les données disponibles

### Logique de Filtrage

```typescript
// Si connecté en tant que super_admin
→ Peut créer : super_admin, admin_groupe
→ Champs : schoolGroupId (si admin_groupe)

// Si connecté en tant que admin_groupe
→ Peut créer : 15 rôles utilisateurs
→ Champs : schoolId (obligatoire)

// Si connecté en tant que utilisateur
→ Ne peut rien créer
```

### Structure du Formulaire Unifié

```typescript
interface UnifiedUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  mode: 'create' | 'edit';
  // Pas besoin de passer le rôle, on le récupère du store
}

// Logique interne
const { user: currentUser } = useAuth();
const isSuperAdmin = currentUser?.role === 'super_admin';
const isAdminGroupe = currentUser?.role === 'admin_groupe';

// Rôles disponibles selon qui est connecté
const availableRoles = useMemo(() => {
  if (isSuperAdmin) {
    return [
      { value: 'super_admin', label: '👑 Super Admin' },
      { value: 'admin_groupe', label: '🏫 Admin de Groupe' },
    ];
  }
  
  if (isAdminGroupe) {
    return [
      { value: 'proviseur', label: '🎓 Proviseur' },
      { value: 'directeur', label: '👔 Directeur' },
      // ... 15 rôles
    ];
  }
  
  return [];
}, [isSuperAdmin, isAdminGroupe]);

// Champs conditionnels
const showSchoolGroupField = selectedRole === 'admin_groupe';
const showSchoolField = isAdminGroupe; // Toujours pour admin_groupe
```

### Validation Adaptative

```typescript
const userSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().transform(/* +242 */),
  role: z.enum(availableRoles.map(r => r.value)),
  
  // Conditionnel selon le rôle
  schoolGroupId: z.string().optional(),
  schoolId: z.string().optional(),
  
  password: z.string().min(8), // Si création
  avatar: z.string().optional(),
}).refine((data) => {
  // Si super_admin crée admin_groupe → schoolGroupId requis
  if (isSuperAdmin && data.role === 'admin_groupe') {
    return !!data.schoolGroupId;
  }
  
  // Si admin_groupe crée utilisateur → schoolId requis
  if (isAdminGroupe) {
    return !!data.schoolId;
  }
  
  return true;
}, {
  message: 'Champ obligatoire selon le rôle',
  path: ['schoolGroupId', 'schoolId'],
});
```

---

## 🎯 AVANTAGES DE LA SOLUTION

### 1. Un Seul Formulaire
- ✅ Moins de code
- ✅ Maintenance simplifiée
- ✅ Cohérence garantie

### 2. Logique Centralisée
- ✅ Validation unique
- ✅ Transformation téléphone unique
- ✅ Upload avatar unique

### 3. Intelligent
- ✅ S'adapte au rôle connecté
- ✅ Affiche uniquement les champs pertinents
- ✅ Validation contextuelle

### 4. Sécurisé
- ✅ Impossible de créer un rôle non autorisé
- ✅ Vérification côté client ET serveur
- ✅ RLS Supabase en backup

---

## 📋 PLAN D'IMPLÉMENTATION

### Étape 1 : Créer UnifiedUserFormDialog.tsx
- Fusionner les 2 formulaires existants
- Ajouter logique conditionnelle
- Tests unitaires

### Étape 2 : Mettre à Jour Users.tsx
- Remplacer GroupUserFormDialog par UnifiedUserFormDialog
- Supprimer UserFormDialog (ancien)
- Tester création/édition

### Étape 3 : Nettoyer
- Supprimer GroupUserFormDialog.tsx
- Supprimer UserFormDialog.tsx
- Mettre à jour imports

### Étape 4 : Documenter
- Ajouter JSDoc
- Créer guide utilisateur
- Mettre à jour README

---

## 🚨 POINTS D'ATTENTION

### Ne PAS Casser
1. ✅ Validation téléphone (+242)
2. ✅ Validation email (.cg ou .com)
3. ✅ Upload avatar
4. ✅ Génération mot de passe
5. ✅ Email de bienvenue
6. ✅ Filtrage par groupe (admin_groupe)

### Tester
1. Super Admin crée Admin Groupe
2. Super Admin crée Super Admin
3. Admin Groupe crée Enseignant
4. Admin Groupe crée Proviseur
5. Édition utilisateur existant
6. Upload avatar
7. Validation erreurs

---

## 🎉 RÉSULTAT ATTENDU

### Avant
```
2 formulaires différents
Logique dupliquée
Confusion des rôles
Maintenance difficile
```

### Après
```
1 formulaire intelligent
Logique centralisée
Rôles clairs
Maintenance facile
```

---

**Date** : 4 Novembre 2025  
**Statut** : 📋 ANALYSE TERMINÉE  
**Prochaine Étape** : Implémentation UnifiedUserFormDialog
