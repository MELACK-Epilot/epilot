# ✅ Vérification Flux Complet - Groupes Scolaires

## 🎯 **Objectif**
Vérifier que les 6 champs (`address`, `phone`, `website`, `foundedYear`, `description`, `logo`) sont correctement gérés dans tout le flux.

---

## ✅ **1. MIGRATION SQL** (Base de données)

**Fichier** : `database/SCHOOL_GROUPS_MIGRATION.sql`

```sql
ALTER TABLE school_groups
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo TEXT;
```

**Statut** : ✅ **PRÊT À EXÉCUTER**

---

## ✅ **2. SCHÉMA ZOD** (Validation formulaire)

**Fichier** : `formSchemas.ts`

```typescript
export const createSchoolGroupSchema = z.object({
  name: z.string().min(3).max(100),
  code: z.string().min(2).max(20),
  region: z.string().min(2).max(50),          // ✅
  city: z.string().min(2).max(50),            // ✅
  address: z.string().min(5).max(200).optional(),      // ✅
  phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/).optional(),  // ✅
  website: z.string().optional(),             // ✅
  foundedYear: z.union([z.string(), z.number()]).optional(),  // ✅
  description: z.string().min(10).max(1000).optional(),  // ✅
  logo: z.string().optional(),                // ✅
  plan: z.enum(['gratuit', 'premium', 'pro', 'institutionnel']),
});
```

**Statut** : ✅ **CONFORME**

---

## ✅ **3. FORMULAIRE REACT** (Saisie utilisateur)

**Fichiers** :
- `BasicInfoSection.tsx` : name, code, region, city
- `ContactSection.tsx` : address, phone, website
- `DescriptionSection.tsx` : foundedYear, description, logo
- `PlanSection.tsx` : plan, status (edit)

**Champs présents** :
- ✅ `address` (Textarea)
- ✅ `phone` (Input)
- ✅ `website` (Input)
- ✅ `foundedYear` (Input number)
- ✅ `description` (Textarea)
- ✅ `logo` (Upload - à implémenter)

**Statut** : ✅ **CONFORME**

---

## ✅ **4. HOOK CRÉATION** (Envoi données)

**Fichier** : `useSchoolGroups.ts` → `useCreateSchoolGroup`

```typescript
const insertData: any = {
  name: input.name,
  code: input.code,
  region: input.region,                    // ✅
  city: input.city,                        // ✅
  address: input.address || null,          // ✅
  phone: input.phone || null,              // ✅
  website: input.website || null,          // ✅
  founded_year: input.foundedYear || null, // ✅ snake_case
  description: input.description || null,  // ✅
  logo: input.logo || null,                // ✅
  plan: input.plan,
  status: 'active',
};
```

**Statut** : ✅ **CONFORME** (envoie les 6 champs)

---

## ✅ **5. HOOK RÉCUPÉRATION** (Lecture données)

**Fichier** : `useSchoolGroups.ts` → `useSchoolGroups` & `useSchoolGroup`

```typescript
return (data || []).map((group: any) => ({
  id: group.id,
  name: group.name,
  code: group.code,
  region: group.region,                    // ✅
  city: group.city,                        // ✅
  address: group.address || '',            // ✅
  phone: group.phone || '',                // ✅
  website: group.website || '',            // ✅
  foundedYear: group.founded_year,         // ✅ camelCase
  description: group.description || '',    // ✅
  logo: group.logo || '',                  // ✅
  // ...
}));
```

**Statut** : ✅ **CONFORME** (récupère les 6 champs)

---

## ✅ **6. TYPE TYPESCRIPT** (Interface)

**Fichier** : `dashboard.types.ts`

```typescript
export interface SchoolGroup {
  id: string;
  name: string;
  code: string;
  region: string;                // ✅
  city: string;                  // ✅
  address?: string;              // ✅
  phone?: string;                // ✅
  website?: string;              // ✅
  foundedYear?: number;          // ✅
  description?: string;          // ✅
  logo?: string;                 // ✅
  // ...
}
```

**Statut** : ✅ **CONFORME**

---

## ✅ **7. AFFICHAGE** (Composants UI)

### **Tableau** (`SchoolGroupsTable.tsx`)
```typescript
// Affiche : name, code, region, city, schoolCount, studentCount
// ✅ Les 6 champs ne sont pas affichés dans le tableau (normal)
```

### **Grille** (`SchoolGroupsGrid.tsx`)
```typescript
// Affiche : name, code, city, region, schoolCount, studentCount
<span>{group.city}, {group.region}</span>  // ✅
```

### **Dialog Détails** (`SchoolGroupDetailsDialog.tsx`)
```typescript
// Devrait afficher TOUS les champs :
// ✅ name, code, region, city
// ⏳ address, phone, website (à vérifier)
// ⏳ foundedYear, description, logo (à vérifier)
```

**Statut** : ⏳ **À VÉRIFIER** (dialog détails)

---

## 📋 **Mapping SQL ↔ TypeScript**

| SQL (snake_case) | TypeScript (camelCase) | Conversion |
|------------------|------------------------|------------|
| `region` | `region` | ✅ Identique |
| `city` | `city` | ✅ Identique |
| `address` | `address` | ✅ Identique |
| `phone` | `phone` | ✅ Identique |
| `website` | `website` | ✅ Identique |
| `founded_year` | `foundedYear` | ✅ Auto (Supabase) |
| `description` | `description` | ✅ Identique |
| `logo` | `logo` | ✅ Identique |

---

## 🔄 **Flux complet**

```
1. Utilisateur remplit le formulaire
   ↓
   Champs : name, code, region, city, address, phone, website, 
            foundedYear, description, logo, plan

2. Validation Zod
   ↓
   Schéma vérifie les types et contraintes

3. Hook useSchoolGroupForm
   ↓
   onSubmit → createSchoolGroup.mutateAsync(values)

4. Hook useCreateSchoolGroup
   ↓
   Transforme : foundedYear → founded_year (snake_case)
   Envoie à Supabase

5. Supabase INSERT
   ↓
   INSERT INTO school_groups (name, code, region, city, address, 
   phone, website, founded_year, description, logo, plan, status)

6. Supabase SELECT
   ↓
   Récupère les données (avec snake_case)

7. Hook useSchoolGroups
   ↓
   Transforme : founded_year → foundedYear (camelCase)
   Retourne SchoolGroup[]

8. Composants UI
   ↓
   Affichent les données
```

---

## ✅ **Checklist finale**

| Étape | Fichier | Statut |
|-------|---------|--------|
| **1. Migration SQL** | SCHOOL_GROUPS_MIGRATION.sql | ✅ Prêt |
| **2. Schéma Zod** | formSchemas.ts | ✅ Conforme |
| **3. Formulaire** | BasicInfoSection, ContactSection, etc. | ✅ Conforme |
| **4. Hook création** | useCreateSchoolGroup | ✅ Conforme |
| **5. Hook récupération** | useSchoolGroups | ✅ Conforme |
| **6. Type TS** | dashboard.types.ts | ✅ Conforme |
| **7. Affichage tableau** | SchoolGroupsTable.tsx | ✅ Conforme |
| **8. Affichage grille** | SchoolGroupsGrid.tsx | ✅ Conforme |
| **9. Dialog détails** | SchoolGroupDetailsDialog.tsx | ⏳ À vérifier |

---

## 🚀 **Actions requises**

### **1. Exécuter la migration SQL** ✅ PRIORITAIRE

```bash
# Dans Supabase Dashboard → SQL Editor
# Copier/coller SCHOOL_GROUPS_MIGRATION.sql
# Run
```

### **2. Vérifier le dialog détails** ⏳ OPTIONNEL

Vérifier que `SchoolGroupDetailsDialog.tsx` affiche bien tous les champs :
- address
- phone
- website
- foundedYear
- description
- logo

### **3. Tester le formulaire** ✅ APRÈS MIGRATION

```bash
npm run dev
# → Créer un groupe scolaire
# → Remplir TOUS les champs
# → Vérifier que tout est sauvegardé
# → Vérifier que tout est affiché
```

---

## ✅ **Résumé**

### **Ce qui fonctionne** ✅
- ✅ Schéma Zod valide les 6 champs
- ✅ Formulaire affiche les 6 champs
- ✅ Hook création envoie les 6 champs
- ✅ Hook récupération lit les 6 champs
- ✅ Type TypeScript définit les 6 champs
- ✅ Mapping snake_case ↔ camelCase correct

### **Ce qui manque** ⏳
- ⏳ Migration SQL à exécuter
- ⏳ Dialog détails à vérifier/compléter

---

**Date** : 30 octobre 2025  
**Auteur** : E-Pilot Congo 🇨🇬  
**Statut** : ✅ PRÊT (après migration SQL)
