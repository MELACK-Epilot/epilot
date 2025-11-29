# ProfileFormDialog - Architecture Modulaire

## Vue d'ensemble

Le `ProfileFormDialog` a été refactorisé pour suivre les meilleures pratiques React 19 et notre stack technique.

## Structure des Fichiers

```
src/features/dashboard/
├── components/permissions/
│   ├── ProfileFormDialog.tsx          # Composant principal (~150 lignes)
│   └── profile-form/
│       ├── index.ts                   # Barrel export
│       ├── ProfileIdentitySection.tsx # Avatar upload
│       ├── ProfileInfoSection.tsx     # Nom, code, description
│       ├── ProfileModulesSection.tsx  # Configuration modules
│       ├── ModuleCategoryCard.tsx     # Carte catégorie
│       └── README.md                  # Cette documentation
├── hooks/
│   └── useProfileForm.ts              # Hook principal (~260 lignes)
├── services/
│   └── profile.service.ts             # CRUD + Upload avatar
├── utils/
│   └── permissions.utils.ts           # Utilitaires permissions
└── constants/
    └── roles.constants.ts             # Emojis et icônes
```

## Principes Appliqués

### 1. Séparation des Responsabilités

| Couche | Responsabilité |
|--------|----------------|
| **Component** | UI pure, aucune logique |
| **Hook** | State, effects, data fetching |
| **Service** | Appels Supabase (CRUD, upload) |
| **Utils** | Fonctions pures réutilisables |
| **Constants** | Valeurs statiques |

### 2. React Query (Server State)

- `useAccessProfile`: Récupère le profil frais
- `useCurrentUserGroup`: Groupe de l'utilisateur
- `useGroupAvailableModules`: Modules filtrés par plan
- `useAllSystemModules`: Tous les modules (Super Admin)

### 3. Zustand (Client State)

Non utilisé ici - le state est local au dialog.

### 4. Patterns Modernes

```typescript
// ❌ Avant
const [data, setData] = useState();
useEffect(() => {
  fetchData().then(setData);
}, []);

// ✅ Après
const { data } = useQuery({ queryKey: [...], queryFn: fetchData });
```

## Utilisation

```tsx
import { ProfileFormDialog } from './ProfileFormDialog';

<ProfileFormDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  profileToEdit={selectedProfile} // null pour création
/>
```

## Composants UI

### ProfileIdentitySection
- Upload d'avatar
- Preview de l'image

### ProfileInfoSection
- Sélection de rôle standard ou personnalisé
- Nom, code technique, description
- Validation Zod

### ProfileModulesSection
- Liste des catégories et modules
- Toggle par module ou par catégorie
- Compteur de modules actifs

## Services

### profile.service.ts

```typescript
// Upload avatar
uploadProfileAvatar(file: File): Promise<string>

// CRUD
createProfile(data: CreateProfileData): Promise<void>
updateProfile(id: string, data: ProfileData): Promise<void>
deleteProfile(id: string): Promise<void>

// Validation
checkProfileCodeExists(code: string): Promise<boolean>
```

## Performance

- `useMemo` pour les permissions extraites
- `useCallback` pour les handlers stables
- Lazy loading des icônes Lucide
- Invalidation ciblée du cache React Query
