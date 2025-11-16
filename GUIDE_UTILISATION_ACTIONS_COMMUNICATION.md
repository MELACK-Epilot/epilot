# 📖 Guide d'Utilisation - Actions et Communication

## 🚀 Démarrage Rapide

### 1. Ajouter les routes dans votre application

Dans votre fichier de routes (ex: `App.tsx` ou `routes.tsx`), ajoutez :

```tsx
import {
  StaffManagementPage,
  SchoolReportsPage,
  AdvancedStatsPage,
  ClassesManagementPage,
} from '@/features/user-space/pages';

// Dans vos routes
<Route path="/user-space/staff-management" element={<StaffManagementPage />} />
<Route path="/user-space/reports" element={<SchoolReportsPage />} />
<Route path="/user-space/advanced-stats" element={<AdvancedStatsPage />} />
<Route path="/user-space/classes-management" element={<ClassesManagementPage />} />
```

### 2. Utiliser les modals individuellement

Si vous voulez utiliser les modals dans d'autres composants :

```tsx
import { MessageModal } from '@/features/user-space/components/modals';

function MonComposant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Envoyer un message
      </Button>

      <MessageModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        schoolName="École Exemple"
        schoolId="123"
      />
    </>
  );
}
```

---

## 📋 Liste des Modals

### MessageModal
```tsx
<MessageModal
  isOpen={boolean}
  onClose={() => void}
  schoolName={string}
  schoolId={string}
/>
```

### ShareFilesModal
```tsx
<ShareFilesModal
  isOpen={boolean}
  onClose={() => void}
  schoolName={string}
  schoolId={string}
/>
```

### DownloadDocsModal
```tsx
<DownloadDocsModal
  isOpen={boolean}
  onClose={() => void}
  schoolName={string}
  schoolId={string}
/>
```

### UploadFilesModal
```tsx
<UploadFilesModal
  isOpen={boolean}
  onClose={() => void}
  schoolName={string}
  schoolId={string}
/>
```

### SchoolSettingsModal
```tsx
<SchoolSettingsModal
  isOpen={boolean}
  onClose={() => void}
  schoolName={string}
  schoolId={string}
/>
```

---

## 🔌 Connexion au Backend

### Exemple avec React Query

#### 1. Installation
```bash
npm install @tanstack/react-query
```

#### 2. Configuration du QueryClient
```tsx
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
```

#### 3. Exemple d'utilisation dans StaffManagementPage
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

export const StaffManagementPage = () => {
  // Récupérer les données
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      return response.json();
    },
  });

  // Mutation pour supprimer
  const deleteMutation = useMutation({
    mutationFn: async (staffId: string) => {
      await fetch(`/api/staff/${staffId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Membre supprimé avec succès' });
    },
  });

  // ... reste du code
};
```

---

## 🎨 Personnalisation des Couleurs

Pour changer les couleurs de la plateforme, modifiez les valeurs dans les composants :

```tsx
// Remplacer
className="bg-[#2A9D8F]"

// Par votre couleur
className="bg-[#VOTRE_COULEUR]"
```

Ou mieux, définissez vos couleurs dans `tailwind.config.js` :

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#2A9D8F',
        secondary: '#238b7e',
        // Ajoutez vos couleurs
      },
    },
  },
};
```

Puis utilisez :
```tsx
className="bg-primary hover:bg-secondary"
```

---

## 📊 Ajouter des Graphiques (AdvancedStatsPage)

### Option 1 : Recharts (Recommandé)

```bash
npm install recharts
```

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { month: 'Jan', moyenne: 13.5 },
  { month: 'Fév', moyenne: 14.2 },
  // ...
];

<LineChart width={600} height={300} data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="moyenne" stroke="#2A9D8F" />
</LineChart>
```

### Option 2 : Chart.js

```bash
npm install react-chartjs-2 chart.js
```

```tsx
import { Line } from 'react-chartjs-2';

const data = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
  datasets: [{
    label: 'Moyenne',
    data: [13.5, 14.2, 13.8, 14.5, 14.1, 14.8],
    borderColor: '#2A9D8F',
    backgroundColor: 'rgba(42, 157, 143, 0.1)',
  }],
};

<Line data={data} />
```

---

## 🔐 Gestion des Permissions

Exemple d'implémentation de permissions :

```tsx
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    canViewStaff: user?.role === 'admin' || user?.role === 'proviseur',
    canEditStaff: user?.role === 'admin',
    canDeleteStaff: user?.role === 'admin',
    canViewReports: true, // Tous les utilisateurs
    canCreateReports: user?.role === 'admin' || user?.role === 'proviseur',
  };
};

// Utilisation dans un composant
const { canEditStaff } = usePermissions();

{canEditStaff && (
  <Button onClick={handleEdit}>
    Modifier
  </Button>
)}
```

---

## 🔄 Optimisations Recommandées

### 1. Lazy Loading des Pages

```tsx
import { lazy, Suspense } from 'react';

const StaffManagementPage = lazy(() => 
  import('@/features/user-space/pages/StaffManagementPage')
);

// Dans vos routes
<Route 
  path="/user-space/staff-management" 
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <StaffManagementPage />
    </Suspense>
  } 
/>
```

### 2. Pagination

```tsx
const [page, setPage] = useState(1);
const itemsPerPage = 10;

const paginatedStaff = staff.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);

// Composant de pagination
<Pagination
  currentPage={page}
  totalPages={Math.ceil(staff.length / itemsPerPage)}
  onPageChange={setPage}
/>
```

### 3. Debounce pour la Recherche

```tsx
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebouncedValue(searchQuery, 300);

// Utiliser debouncedSearch pour filtrer
```

---

## 🐛 Debugging

### Activer les logs de développement

```tsx
// Dans vos composants
useEffect(() => {
  console.log('Staff data:', staff);
  console.log('Filters:', { selectedRole, selectedStatus });
}, [staff, selectedRole, selectedStatus]);
```

### React DevTools

Installez l'extension React DevTools pour inspecter les composants et leur état.

---

## 📱 Responsive Design

Tous les composants sont déjà responsive, mais vous pouvez ajuster :

```tsx
// Breakpoints Tailwind
sm: '640px'   // Mobile large
md: '768px'   // Tablette
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop

// Exemple d'utilisation
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Contenu */}
</div>
```

---

## 🎯 Bonnes Pratiques

1. **Toujours gérer les états de chargement**
```tsx
{isLoading ? <Skeleton /> : <Content />}
```

2. **Gérer les erreurs**
```tsx
{error && <ErrorMessage error={error} />}
```

3. **Feedback utilisateur**
```tsx
toast({
  title: "Action réussie",
  description: "Les modifications ont été enregistrées",
});
```

4. **Validation des formulaires**
```tsx
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  email: z.string().email("Email invalide"),
});
```

---

## 🆘 Support

Pour toute question ou problème :

1. Vérifiez la documentation des composants
2. Consultez les exemples dans `ACTIONS_COMMUNICATION_COMPLETE.md`
3. Vérifiez les logs de la console
4. Testez avec des données mockées d'abord

---

## 📚 Ressources Utiles

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Lucide Icons](https://lucide.dev/)

---

**Bon développement ! 🚀**
