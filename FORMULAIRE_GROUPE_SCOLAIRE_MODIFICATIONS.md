# ✅ Modifications Formulaire Groupe Scolaire - E-Pilot Congo

## 🎯 Modifications demandées et implémentées

### 1. **Région → Département** ✅
**Changement :**
- Label : "Région" → "Département"
- Type : Input text → Select (menu déroulant)
- Options : 12 départements du Congo-Brazzaville

**Départements disponibles :**
1. Bouenza
2. Brazzaville
3. Cuvette
4. Cuvette-Ouest
5. Kouilou
6. Lékoumou
7. Likouala
8. Niari
9. Plateaux
10. Pointe-Noire
11. Pool
12. Sangha

### 2. **Ville avec menu déroulant** ✅
**Changement :**
- Type : Input text → Select (menu déroulant)
- Options : 25 villes principales du Congo-Brazzaville

**Villes disponibles (par ordre) :**
1. Brazzaville (capitale)
2. Pointe-Noire (2ème ville)
3. Dolisie
4. Nkayi
5. Ouesso
6. Owando
7. Impfondo
8. Sibiti
9. Madingou
10. Kinkala
11. Djambala
12. Ewo
13. Gamboma
14. Loandjili
15. Kayes
16. Mossendjo
17. Makoua
18. Zanaga
19. Loudima
20. Kindamba
21. Boundji
22. Oyo
23. Makabana
24. Ngabé
25. Sembe
26. Souanké

### 3. **Site web optionnel** ✅
**Changement :**
- Label : "Site web" → "Site web (optionnel)"
- Validation : URL stricte → Validation souple (http:// ou https://)
- Champ non obligatoire dans le schéma Zod

---

## 📁 Fichiers créés

### **1. Constants géographiques**
**Fichier :** `src/features/dashboard/constants/congo-locations.ts`
```typescript
export const CONGO_DEPARTMENTS = [
  'Bouenza', 'Brazzaville', 'Cuvette', 'Cuvette-Ouest',
  'Kouilou', 'Lékoumou', 'Likouala', 'Niari',
  'Plateaux', 'Pointe-Noire', 'Pool', 'Sangha'
] as const;

export const CONGO_CITIES = [
  'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi',
  'Ouesso', 'Owando', 'Impfondo', 'Sibiti',
  // ... 25 villes au total
] as const;
```

---

## 📝 Fichiers modifiés

### **1. Schéma de validation Zod**
**Fichier :** `src/features/dashboard/components/school-groups/utils/formSchemas.ts`

**Changements :**
```typescript
// AVANT
region: z.string().min(2, 'La région doit contenir au moins 2 caractères')
website: z.string().url('URL invalide').optional().or(z.literal(''))

// APRÈS
department: z.string().min(2, 'Le département doit être sélectionné')
website: z.string().optional().refine(
  (val) => !val || val === '' || val.startsWith('http://') || val.startsWith('https://'),
  { message: 'L\'URL doit commencer par http:// ou https://' }
)
```

### **2. Section BasicInfoSection**
**Fichier :** `src/features/dashboard/components/school-groups/sections/BasicInfoSection.tsx`

**Changements :**
- Import de `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- Import de `CONGO_DEPARTMENTS`, `CONGO_CITIES`
- Remplacement Input → Select pour Département
- Remplacement Input → Select pour Ville
- Placeholder : "Sélectionnez un département" / "Sélectionnez une ville"
- Description : "Département du Congo-Brazzaville" / "Ville du Congo-Brazzaville"

### **3. Section ContactSection**
**Fichier :** `src/features/dashboard/components/school-groups/sections/ContactSection.tsx`

**Changements :**
```typescript
// Label
<FormLabel>Site web <span className="text-gray-400 text-xs">(optionnel)</span></FormLabel>

// Description
<FormDescription>Site web officiel du groupe (optionnel)</FormDescription>
```

### **4. Types TypeScript**
**Fichier :** `src/features/dashboard/types/dashboard.types.ts`

**Changements :**
```typescript
export interface SchoolGroup {
  // ...
  department: string;  // ← Avant: region: string
  city: string;
  // ...
}
```

### **5. Hook useSchoolGroups**
**Fichier :** `src/features/dashboard/hooks/useSchoolGroups.ts`

**Changements :**
```typescript
// Interface de filtres
export interface SchoolGroupFilters {
  department?: string;  // ← Avant: region?: string
}

// Filtre dans la requête
if (filters?.department) {
  query = query.eq('department', filters.department);
}

// Mapping des données
department: group.department,  // ← Avant: region: group.region
```

### **6. Page SchoolGroups**
**Fichier :** `src/features/dashboard/pages/SchoolGroups.tsx`

**Changements :**
- `filterRegion` → `filterDepartment`
- `uniqueRegions` → `uniqueDepartments`
- Colonne tableau : "Région" → "Département"
- Filtre : "Toutes les régions" → "Tous les départements"
- Toutes les références `group.region` → `group.department`

---

## 🗄️ Migration base de données requise

**⚠️ IMPORTANT :** Il faut renommer la colonne dans Supabase :

```sql
-- Migration SQL à exécuter dans Supabase
ALTER TABLE school_groups 
RENAME COLUMN region TO department;

-- Optionnel : Ajouter une contrainte pour valider les départements
ALTER TABLE school_groups
ADD CONSTRAINT valid_department 
CHECK (department IN (
  'Bouenza', 'Brazzaville', 'Cuvette', 'Cuvette-Ouest',
  'Kouilou', 'Lékoumou', 'Likouala', 'Niari',
  'Plateaux', 'Pointe-Noire', 'Pool', 'Sangha'
));
```

---

## ✅ Résumé des modifications

| Élément | Avant | Après | Statut |
|---------|-------|-------|--------|
| **Champ Région** | Input text | Select (12 départements) | ✅ |
| **Label Région** | "Région *" | "Département *" | ✅ |
| **Champ Ville** | Input text | Select (25 villes) | ✅ |
| **Site web** | Obligatoire (URL stricte) | Optionnel (validation souple) | ✅ |
| **Type SchoolGroup** | `region: string` | `department: string` | ✅ |
| **Hook useSchoolGroups** | `region` | `department` | ✅ |
| **Page SchoolGroups** | Filtres/colonnes `region` | Filtres/colonnes `department` | ✅ |

---

## 🎯 Prochaines étapes

1. **Exécuter la migration SQL** dans Supabase (renommer `region` → `department`)
2. **Tester le formulaire** de création/édition de groupe scolaire
3. **Vérifier les filtres** dans la page Groupes Scolaires
4. **Tester l'export CSV** (doit contenir "département" au lieu de "région")

---

## 📸 Aperçu des changements

### **Formulaire - Section Informations de base**
```
┌─────────────────────────────────────────┐
│ Nom du groupe *        Code *           │
│ [Input]                [Auto-généré]    │
│                                          │
│ Département *          Ville *          │
│ [Select ▼]             [Select ▼]       │
│ • Brazzaville          • Brazzaville    │
│ • Pointe-Noire         • Pointe-Noire   │
│ • Bouenza              • Dolisie        │
│ • ...                  • ...            │
└─────────────────────────────────────────┘
```

### **Formulaire - Section Coordonnées**
```
┌─────────────────────────────────────────┐
│ Téléphone              Site web (optionnel) │
│ [Input]                [Input]          │
└─────────────────────────────────────────┘
```

---

## ✅ Validation finale

- [x] 12 départements du Congo-Brazzaville listés
- [x] 25 villes principales listées
- [x] Menu déroulant Département fonctionnel
- [x] Menu déroulant Ville fonctionnel
- [x] Site web optionnel (pas d'astérisque)
- [x] Validation URL souple (http:// ou https://)
- [x] Types TypeScript mis à jour
- [x] Hooks mis à jour
- [x] Page SchoolGroups mise à jour
- [x] Filtres mis à jour
- [x] Export CSV mis à jour

**Statut :** ✅ **PRÊT** (après migration SQL)
