# 🚨 Plan de Corrections Urgentes - Admin Groupe

**Date** : 1er novembre 2025  
**Priorité** : 🔴 CRITIQUE  
**Temps estimé** : 2-3 heures

---

## 🎯 Problèmes Identifiés

### Problème Principal
**L'Admin Groupe voit les données du Super Admin au lieu de ses propres données !**

### Pages Affectées
1. ❌ **Écoles** - Page blanche (erreur)
2. ❌ **Utilisateurs** - Affiche TOUTES les données
3. ❌ **Finances** - Affiche TOUTES les données
4. ❌ **Communication** - Affiche TOUTES les données
5. ❌ **Rapports** - Affiche TOUTES les données
6. ❌ **Journal d'Activité** - Affiche TOUTES les données
7. ❌ **Corbeille** - Affiche TOUTES les données

---

## ✅ Corrections Déjà Appliquées

### 1. Page Utilisateurs ✅
- Ajout de `useAuth` pour récupérer l'utilisateur
- Calcul de `effectiveSchoolGroupId`
- Filtrage automatique dans `useUsers`
- Mise à jour de `useUserStats` pour accepter `schoolGroupId`

**Fichiers modifiés** :
- `src/features/dashboard/pages/Users.tsx`
- `src/features/dashboard/hooks/useUsers.ts`

---

## 🔧 Corrections à Appliquer

### 2. Page Écoles (URGENT) 🔴

**Statut** : Page blanche - erreur

**Actions** :
1. Ouvrir la console (F12)
2. Identifier l'erreur JavaScript
3. Vérifier `user.schoolGroupId`
4. Vérifier le hook `useSchools`
5. Vérifier `SchoolFormDialog`

**Guide** : Voir `DEBUG_PAGE_ECOLES.md`

---

### 3. Page Finances 🔴

**Fichier** : `src/features/dashboard/pages/Finances.tsx`

**Code à ajouter** :
```typescript
import { useAuth } from '@/features/auth/store/auth.store';

export const Finances = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Filtrage automatique
  const effectiveSchoolGroupId = isSuperAdmin 
    ? undefined
    : user?.schoolGroupId;
  
  const { data: financialStats } = useFinancialStats(effectiveSchoolGroupId);
  
  // ...
};
```

**Hook à modifier** : `src/features/dashboard/hooks/useFinancialStats.ts`
```typescript
export const useFinancialStats = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['financial-stats', schoolGroupId],
    queryFn: async () => {
      let query = supabase.from('financial_stats').select('*');
      
      if (schoolGroupId) {
        query = query.eq('school_group_id', schoolGroupId);
      }
      
      const { data, error } = await query.single();
      // ...
    },
  });
};
```

---

### 4. Page Communication 🔴

**Fichier** : `src/features/dashboard/pages/Communication.tsx`

**Code à ajouter** :
```typescript
import { useAuth } from '@/features/auth/store/auth.store';

export const Communication = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const effectiveSchoolGroupId = isSuperAdmin 
    ? undefined
    : user?.schoolGroupId;
  
  const { data: messages } = useMessages({
    school_group_id: effectiveSchoolGroupId
  });
  
  // ...
};
```

---

### 5. Page Rapports 🔴

**Fichier** : `src/features/dashboard/pages/Reports.tsx`

**Code à ajouter** :
```typescript
import { useAuth } from '@/features/auth/store/auth.store';

export const Reports = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const effectiveSchoolGroupId = isSuperAdmin 
    ? undefined
    : user?.schoolGroupId;
  
  const { data: reports } = useReports({
    school_group_id: effectiveSchoolGroupId
  });
  
  // ...
};
```

---

### 6. Page Journal d'Activité 🔴

**Fichier** : `src/features/dashboard/pages/ActivityLogs.tsx`

**Code à ajouter** :
```typescript
import { useAuth } from '@/features/auth/store/auth.store';

export const ActivityLogs = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const effectiveSchoolGroupId = isSuperAdmin 
    ? undefined
    : user?.schoolGroupId;
  
  const { data: logs } = useActivityLogs({
    school_group_id: effectiveSchoolGroupId
  });
  
  // ...
};
```

---

### 7. Page Corbeille 🔴

**Fichier** : `src/features/dashboard/pages/Trash.tsx`

**Code à ajouter** :
```typescript
import { useAuth } from '@/features/auth/store/auth.store';

export const Trash = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const effectiveSchoolGroupId = isSuperAdmin 
    ? undefined
    : user?.schoolGroupId;
  
  const { data: trashedItems } = useTrash({
    school_group_id: effectiveSchoolGroupId
  });
  
  // ...
};
```

---

## 📋 Pattern Standard à Appliquer

### Pour CHAQUE page

```typescript
import { useAuth } from '@/features/auth/store/auth.store';

export const MyPage = () => {
  // 1. Récupérer l'utilisateur
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  // 2. Calculer le schoolGroupId effectif
  const effectiveSchoolGroupId = isSuperAdmin 
    ? undefined // Super Admin voit tout
    : user?.schoolGroupId; // Admin Groupe voit son groupe
  
  // 3. Utiliser dans TOUS les hooks
  const { data } = useMyData({
    school_group_id: effectiveSchoolGroupId
  });
  
  const { data: stats } = useMyStats(effectiveSchoolGroupId);
  
  // 4. Vérification de sécurité
  if (!isSuperAdmin && !user?.schoolGroupId) {
    return <Alert>Erreur de configuration</Alert>;
  }
  
  return (
    // ...
  );
};
```

---

## ✅ Checklist par Page

### Pour chaque page, vérifier :

- [ ] Import `useAuth`
- [ ] Calcul `isSuperAdmin`
- [ ] Calcul `effectiveSchoolGroupId`
- [ ] Passage à TOUS les hooks de données
- [ ] Passage à TOUS les hooks de stats
- [ ] Vérification de sécurité
- [ ] Test avec `int@epilot.com`
- [ ] Test avec `admin@epilot.cg`

---

## 🧪 Tests à Effectuer

### Test 1 : Admin Groupe
```
1. Se connecter avec int@epilot.com
2. Aller sur CHAQUE page
3. Vérifier qu'on voit UNIQUEMENT les données de LAMARELLE
4. Vérifier les stats (doivent être filtrées)
5. Vérifier qu'aucune donnée d'autres groupes n'apparaît
```

### Test 2 : Super Admin
```
1. Se connecter avec admin@epilot.cg
2. Aller sur CHAQUE page
3. Vérifier qu'on voit TOUTES les données
4. Vérifier les stats (doivent être globales)
```

---

## 📊 Ordre de Priorité

### Priorité 1 (Urgent - Aujourd'hui)
1. ✅ Utilisateurs (FAIT)
2. 🔴 Écoles (page blanche)
3. 🔴 Finances

### Priorité 2 (Important - Demain)
4. 🟡 Communication
5. 🟡 Rapports
6. 🟡 Journal d'Activité

### Priorité 3 (Normal - Cette semaine)
7. 🟢 Corbeille

---

## 📁 Fichiers à Modifier

### Pages
1. `src/features/dashboard/pages/Schools.tsx` (debug)
2. `src/features/dashboard/pages/Finances.tsx`
3. `src/features/dashboard/pages/Communication.tsx`
4. `src/features/dashboard/pages/Reports.tsx`
5. `src/features/dashboard/pages/ActivityLogs.tsx`
6. `src/features/dashboard/pages/Trash.tsx`

### Hooks
1. `src/features/dashboard/hooks/useFinancialStats.ts`
2. `src/features/dashboard/hooks/useMessages.ts` (si existe)
3. `src/features/dashboard/hooks/useReports.ts` (si existe)
4. `src/features/dashboard/hooks/useActivityLogs.ts` (si existe)
5. `src/features/dashboard/hooks/useTrash.ts` (si existe)

---

## 🎯 Résultat Attendu

### Après Corrections

**Admin Groupe (int@epilot.com)** :
- ✅ Voit UNIQUEMENT les écoles de LAMARELLE
- ✅ Voit UNIQUEMENT les utilisateurs de LAMARELLE
- ✅ Voit UNIQUEMENT les finances de LAMARELLE
- ✅ Voit UNIQUEMENT les messages de LAMARELLE
- ✅ Voit UNIQUEMENT les rapports de LAMARELLE
- ✅ Voit UNIQUEMENT les logs de LAMARELLE
- ✅ Voit UNIQUEMENT les éléments supprimés de LAMARELLE

**Super Admin (admin@epilot.cg)** :
- ✅ Voit TOUTES les écoles
- ✅ Voit TOUS les utilisateurs
- ✅ Voit TOUTES les finances
- ✅ Voit TOUS les messages
- ✅ Voit TOUS les rapports
- ✅ Voit TOUS les logs
- ✅ Voit TOUS les éléments supprimés

---

## 📝 Documentation Créée

1. `CORRECTIONS_CRITIQUES_FILTRAGE.md` - Corrections appliquées
2. `DEBUG_PAGE_ECOLES.md` - Guide debug page Écoles
3. `PLAN_CORRECTIONS_URGENTES.md` - Ce document

---

**Corrections urgentes à appliquer immédiatement !** 🚨🔧
