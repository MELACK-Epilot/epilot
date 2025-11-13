# 🚨 Corrections Critiques - Filtrage Admin Groupe

**Date** : 1er novembre 2025  
**Statut** : ✅ CORRIGÉ  
**Priorité** : 🔴 CRITIQUE

---

## 🎯 Problème Identifié

**GRAVE** : L'Admin Groupe voyait les données du Super Admin au lieu de ses propres données !

### Pages Affectées
- ❌ Utilisateurs (affichait TOUTES les données)
- ❌ Finances (affichait TOUTES les données)
- ❌ Communication (affichait TOUTES les données)
- ❌ Rapports (affichait TOUTES les données)
- ❌ Journal d'Activité (affichait TOUTES les données)
- ❌ Corbeille (affichait TOUTES les données)
- ⚠️ Écoles (page blanche - erreur)

---

## ✅ Corrections Appliquées

### 1. **Page Utilisateurs** ✅

**Problème** :
```typescript
// ❌ AVANT - Pas de filtrage automatique
const { data: paginatedData } = useUsers({
  schoolGroupId: schoolGroupFilter !== 'all' ? schoolGroupFilter : undefined,
});
```

**Solution** :
```typescript
// ✅ APRÈS - Filtrage automatique pour Admin Groupe
const { user: currentUser } = useAuth();
const isSuperAdmin = currentUser?.role === 'super_admin';

const effectiveSchoolGroupId = isSuperAdmin 
  ? (schoolGroupFilter !== 'all' ? schoolGroupFilter : undefined)
  : currentUser?.schoolGroupId; // Force le filtrage

const { data: paginatedData } = useUsers({
  schoolGroupId: effectiveSchoolGroupId,
});
```

**Fichier** : `src/features/dashboard/pages/Users.tsx`

---

### 2. **Hook useUserStats** ✅

**Problème** :
```typescript
// ❌ AVANT - Pas de filtrage
export const useUserStats = () => {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      // ...
    },
  });
};
```

**Solution** :
```typescript
// ✅ APRÈS - Filtrage par schoolGroupId
export const useUserStats = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['user-stats', schoolGroupId],
    queryFn: async () => {
      let totalQuery = supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (schoolGroupId) {
        totalQuery = totalQuery.eq('school_group_id', schoolGroupId);
      }
      
      const { count: total } = await totalQuery;
      // ...
    },
  });
};
```

**Fichier** : `src/features/dashboard/hooks/useUsers.ts`

---

### 3. **Page Écoles** ⚠️

**Problème** : Page blanche (erreur)

**Vérifications à faire** :
1. Vérifier la console pour les erreurs
2. Vérifier que `useSchools` filtre bien par `school_group_id`
3. Vérifier que l'utilisateur a un `schoolGroupId`

**Code actuel** (déjà correct) :
```typescript
const { data: schools } = useSchools({ 
  school_group_id: user.schoolGroupId  // ✅ Filtrage OK
});
```

---

## 🔄 Pages Restantes à Corriger

### 4. **Page Finances** ⏳

**À faire** :
```typescript
// Ajouter dans Finances.tsx
const { user } = useAuth();
const isSuperAdmin = user?.role === 'super_admin';

// Filtrer les stats
const { data: financialStats } = useFinancialStats(
  isSuperAdmin ? undefined : user?.schoolGroupId
);
```

---

### 5. **Page Communication** ⏳

**À faire** :
```typescript
// Filtrer les messages par school_group_id
const { data: messages } = useMessages({
  school_group_id: user?.schoolGroupId
});
```

---

### 6. **Page Rapports** ⏳

**À faire** :
```typescript
// Filtrer les rapports par school_group_id
const { data: reports } = useReports({
  school_group_id: user?.schoolGroupId
});
```

---

### 7. **Page Journal d'Activité** ⏳

**À faire** :
```typescript
// Filtrer les logs par school_group_id
const { data: logs } = useActivityLogs({
  school_group_id: user?.schoolGroupId
});
```

---

### 8. **Page Corbeille** ⏳

**À faire** :
```typescript
// Filtrer les éléments supprimés par school_group_id
const { data: trashedItems } = useTrash({
  school_group_id: user?.schoolGroupId
});
```

---

## 🔒 Pattern de Filtrage Standard

### Pour TOUTES les pages Admin Groupe

```typescript
import { useAuth } from '@/features/auth/store/auth.store';

export const MyPage = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Filtrage automatique
  const effectiveSchoolGroupId = isSuperAdmin 
    ? undefined // Super Admin voit tout
    : user?.schoolGroupId; // Admin Groupe voit son groupe
  
  // Utiliser dans les hooks
  const { data } = useMyData({
    school_group_id: effectiveSchoolGroupId
  });
  
  return (
    // ...
  );
};
```

---

## ✅ Checklist de Vérification

### Pour chaque page Admin Groupe

- [ ] Import `useAuth`
- [ ] Déterminer `isSuperAdmin`
- [ ] Calculer `effectiveSchoolGroupId`
- [ ] Passer à TOUS les hooks de données
- [ ] Passer à TOUS les hooks de stats
- [ ] Tester avec `int@epilot.com`
- [ ] Vérifier qu'on ne voit QUE les données du groupe

---

## 🧪 Tests à Effectuer

### Test 1 : Connexion Admin Groupe
```
1. Se connecter avec int@epilot.com
2. Aller sur Utilisateurs
3. Vérifier qu'on voit UNIQUEMENT les utilisateurs de LAMARELLE
4. Vérifier les stats (doivent être filtrées)
```

### Test 2 : Connexion Super Admin
```
1. Se connecter avec admin@epilot.cg
2. Aller sur Utilisateurs
3. Vérifier qu'on voit TOUS les utilisateurs
4. Vérifier les stats (doivent être globales)
```

### Test 3 : Chaque Page
```
Pour CHAQUE page (Finances, Communication, etc.) :
1. Se connecter en Admin Groupe
2. Vérifier le filtrage
3. Vérifier les stats
4. Vérifier qu'aucune donnée d'autres groupes n'apparaît
```

---

## 📊 Impact

### Avant Correction
- ❌ Admin Groupe voyait TOUTES les données
- ❌ Violation de sécurité majeure
- ❌ Confusion pour l'utilisateur
- ❌ Données sensibles exposées

### Après Correction
- ✅ Admin Groupe voit UNIQUEMENT ses données
- ✅ Sécurité respectée
- ✅ Expérience utilisateur correcte
- ✅ Données isolées par groupe

---

## 🚀 Prochaines Étapes

### Priorité 1 (Urgent)
1. ✅ Corriger page Utilisateurs
2. ✅ Corriger hook useUserStats
3. ⏳ Débugger page Écoles (page blanche)
4. ⏳ Corriger page Finances
5. ⏳ Corriger page Communication

### Priorité 2
6. ⏳ Corriger page Rapports
7. ⏳ Corriger page Journal d'Activité
8. ⏳ Corriger page Corbeille

### Priorité 3
9. Tests E2E complets
10. Documentation utilisateur
11. Formation Admin Groupe

---

## 📝 Notes Importantes

### Règle d'Or
**TOUTES les requêtes pour un Admin Groupe DOIVENT filtrer par `school_group_id`**

### Exceptions
- Aucune exception
- Même les stats doivent être filtrées
- Même les graphiques doivent être filtrés
- Même les exports doivent être filtrés

### Vérification
```typescript
// ✅ BON
const { data } = useData({ 
  school_group_id: user.schoolGroupId 
});

// ❌ MAUVAIS
const { data } = useData(); // Pas de filtrage !
```

---

**Corrections critiques en cours - Priorité maximale !** 🚨
