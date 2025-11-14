# 🚀 GUIDE D'INTÉGRATION - APP CONTEXT PROVIDER

## 🎯 **OBJECTIF**

Intégrer le **AppContextProvider** dans toute l'application pour garantir que **TOUS les modules** s'adaptent automatiquement au contexte utilisateur.

---

## 📋 **ÉTAPES D'INTÉGRATION**

### **ÉTAPE 1 : Wrapper l'Application**

```typescript
// src/App.tsx

import { AppContextProvider } from '@/providers/AppContextProvider';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PermissionsProvider>
          {/* ⭐ WRAPPER TOUTE L'APPLICATION */}
          <AppContextProvider>
            <BrowserRouter>
              <RoleBasedRedirect>
                <Routes>
                  {/* Toutes les routes */}
                </Routes>
              </RoleBasedRedirect>
            </BrowserRouter>
          </AppContextProvider>
        </PermissionsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

**Résultat** :
- ✅ Contexte initialisé au démarrage
- ✅ Disponible dans TOUTE l'application
- ✅ Un seul point d'initialisation

---

### **ÉTAPE 2 : Remplacer les Hooks Existants**

#### **Avant (❌ Ancien Code)**

```typescript
// Composant qui récupère le contexte manuellement
function MonComposant() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolGroupId, setSchoolGroupId] = useState<string | null>(null);

  useEffect(() => {
    // Récupération manuelle
    const fetchContext = async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('school_id, school_group_id')
        .eq('id', user.id)
        .single();
      
      setSchoolId(userData.school_id);
      setSchoolGroupId(userData.school_group_id);
    };
    
    fetchContext();
  }, []);

  // Utilisation
  const { data } = useQuery({
    queryKey: ['data', schoolId],
    queryFn: () => fetchData(schoolId),
    enabled: !!schoolId,
  });
}
```

#### **Après (✅ Nouveau Code)**

```typescript
// Composant qui utilise les hooks sécurisés
import { useSchoolId, useSchoolGroupId } from '@/providers/AppContextProvider';

function MonComposant() {
  // ⭐ Hooks sécurisés avec validation automatique
  const schoolId = useSchoolId();
  const schoolGroupId = useSchoolGroupId();

  // ⭐ Utilisation directe (pas de useEffect, pas de loading)
  const { data } = useQuery({
    queryKey: ['data', schoolId],
    queryFn: () => fetchData(schoolId),
  });
}
```

**Avantages** :
- ✅ Moins de code
- ✅ Pas de useEffect
- ✅ Validation automatique
- ✅ Type-safe

---

### **ÉTAPE 3 : Adapter les Hooks Existants**

#### **Exemple : useInscriptions**

**Avant** :
```typescript
// src/features/modules/inscriptions/hooks/queries/useInscriptions.ts

export function useInscriptions() {
  return useQuery({
    queryKey: ['inscriptions'],
    queryFn: async () => {
      // ❌ Pas de filtrage par contexte
      const { data } = await supabase
        .from('inscriptions')
        .select('*');
      
      return data;
    },
  });
}
```

**Après** :
```typescript
// src/features/modules/inscriptions/hooks/queries/useInscriptions.ts

import { useSchoolId, useSchoolGroupId } from '@/providers/AppContextProvider';

export function useInscriptions() {
  // ⭐ Récupération automatique du contexte
  const schoolId = useSchoolId();
  const schoolGroupId = useSchoolGroupId();

  return useQuery({
    queryKey: ['inscriptions', schoolId, schoolGroupId],
    queryFn: async () => {
      // ⭐ RLS filtre automatiquement, mais on ajoute le contexte dans la queryKey
      const { data } = await supabase
        .from('inscriptions')
        .select('*');
      
      console.log('✅ [useInscriptions] Chargé pour:', { schoolId, schoolGroupId });
      return data;
    },
  });
}
```

---

### **ÉTAPE 4 : Adapter les Mutations**

**Avant** :
```typescript
export function useCreateInscription() {
  return useMutation({
    mutationFn: async (data: InscriptionData) => {
      // ❌ Pas de contexte automatique
      const { data: result } = await supabase
        .from('inscriptions')
        .insert(data);
      
      return result;
    },
  });
}
```

**Après** :
```typescript
import { useSchoolId, useSchoolGroupId, useUserId } from '@/providers/AppContextProvider';

export function useCreateInscription() {
  // ⭐ Contexte automatique
  const schoolId = useSchoolId();
  const schoolGroupId = useSchoolGroupId();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (data: InscriptionData) => {
      // ⭐ Contexte ajouté automatiquement
      const inscriptionData = {
        ...data,
        school_id: schoolId,           // ⭐ Contexte automatique
        school_group_id: schoolGroupId, // ⭐ Contexte automatique
        created_by: userId,             // ⭐ Contexte automatique
      };

      const { data: result } = await supabase
        .from('inscriptions')
        .insert(inscriptionData);
      
      console.log('✅ [createInscription] Créé pour:', { schoolId, schoolGroupId });
      return result;
    },
  });
}
```

---

## 🔄 **MIGRATION PROGRESSIVE**

### **Phase 1 : Intégration du Provider**

```typescript
// 1. Wrapper l'application
<AppContextProvider>
  <App />
</AppContextProvider>

// 2. Tester que le contexte s'initialise
console.log('Context initialized:', context);
```

### **Phase 2 : Migration des Hooks**

```typescript
// Remplacer progressivement les hooks existants
// Commencer par les modules les plus utilisés

// Module Inscriptions ✅
// Module Classes ⏳
// Module Notes ⏳
// etc.
```

### **Phase 3 : Validation**

```typescript
// Vérifier que chaque utilisateur voit ses données
// Tester l'isolation entre groupes/écoles
// Vérifier les performances
```

---

## 📊 **CHECKLIST D'INTÉGRATION**

### **Fichiers à Modifier**

- [x] ✅ `src/stores/app-context.store.ts` - CRÉÉ
- [x] ✅ `src/providers/AppContextProvider.tsx` - CRÉÉ
- [ ] ⏳ `src/App.tsx` - Wrapper avec AppContextProvider
- [ ] ⏳ `src/features/modules/inscriptions/hooks/queries/useInscriptions.ts` - Adapter
- [ ] ⏳ `src/features/modules/inscriptions/hooks/mutations/useCreateInscription.ts` - Adapter
- [ ] ⏳ Autres hooks de modules - Adapter progressivement

### **Tests à Effectuer**

- [ ] ⏳ Connexion utilisateur → Contexte initialisé
- [ ] ⏳ Navigation vers module → Contexte disponible
- [ ] ⏳ Chargement données → Filtrées par contexte
- [ ] ⏳ Création donnée → Contexte ajouté automatiquement
- [ ] ⏳ Isolation → Utilisateur A ne voit pas données de B

---

## 🎯 **EXEMPLE COMPLET**

### **Module Gestion des Classes**

```typescript
// src/features/modules/components/GestionClassesModule.tsx

import { useSchoolId, useSchoolGroupId } from '@/providers/AppContextProvider';
import { useQuery, useMutation } from '@tanstack/react-query';

export function GestionClassesModule() {
  // ⭐ Hooks sécurisés
  const schoolId = useSchoolId();
  const schoolGroupId = useSchoolGroupId();

  // ⭐ Chargement des classes (filtré automatiquement)
  const { data: classes } = useQuery({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('classes')
        .select('*');
      
      return data; // RLS filtre automatiquement
    },
  });

  // ⭐ Création d'une classe (contexte automatique)
  const createClass = useMutation({
    mutationFn: async (classData: any) => {
      const { data } = await supabase
        .from('classes')
        .insert({
          ...classData,
          school_id: schoolId,           // ⭐ Contexte auto
          school_group_id: schoolGroupId, // ⭐ Contexte auto
        });
      
      return data;
    },
  });

  return (
    <div>
      <h1>Gestion des Classes</h1>
      <p>École: {schoolId}</p>
      
      {/* Liste des classes */}
      {classes?.map((classe) => (
        <div key={classe.id}>{classe.name}</div>
      ))}
      
      {/* Formulaire création */}
      <button onClick={() => createClass.mutate({ name: 'Classe 6ème A' })}>
        Créer une classe
      </button>
    </div>
  );
}
```

---

## 🎉 **RÉSULTAT FINAL**

### **Avant l'Intégration**

```typescript
❌ Contexte récupéré manuellement dans chaque composant
❌ Code dupliqué partout
❌ Risque d'oublier le filtrage
❌ Difficile à maintenir
❌ Pas de validation automatique
```

### **Après l'Intégration**

```typescript
✅ Contexte global disponible partout
✅ Hooks sécurisés avec validation
✅ Code simple et maintenable
✅ Impossible d'oublier le filtrage
✅ Adaptation automatique au contexte
✅ Performance optimale
```

---

## 🚀 **PROCHAINES ÉTAPES**

1. ✅ **Wrapper App.tsx** avec AppContextProvider
2. ⏳ **Adapter useInscriptions** et autres hooks
3. ⏳ **Tester l'isolation** entre utilisateurs
4. ⏳ **Migrer progressivement** tous les modules
5. ⏳ **Valider les performances**

**L'ARCHITECTURE EST PRÊTE ! IL FAUT JUSTE L'INTÉGRER ! 🏆🚀✨**
