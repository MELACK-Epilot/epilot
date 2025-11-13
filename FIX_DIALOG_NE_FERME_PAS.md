# 🔧 Fix : Dialog ne se ferme pas après création

**Date** : 4 novembre 2025  
**Problème** : Les données s'enregistrent en base ✅ mais le dialog reste ouvert ❌ et pas de toast ❌

---

## 🎯 Diagnostic

### Symptômes

1. ✅ L'utilisateur est créé en base de données
2. ❌ Le dialog ne se ferme pas
3. ❌ Pas de toast "Utilisateur créé avec succès"
4. ❌ La liste ne se rafraîchit pas

### Cause probable

Une **erreur silencieuse** se produit après `createUser.mutateAsync()` qui empêche l'exécution du code suivant (toast + fermeture).

---

## 🧪 Test avec les nouveaux logs

### Étape 1 : Recharger la page

```bash
Ctrl + R  (ou Cmd + R sur Mac)
```

### Étape 2 : Ouvrir la console (F12)

Effacer les logs existants (icône 🚫)

### Étape 3 : Créer un utilisateur

1. Cliquer sur "Nouvel utilisateur"
2. Remplir le formulaire
3. Cliquer sur "➕ Créer" ou "🧪 Test"

### Étape 4 : Observer les logs

**Logs attendus si tout fonctionne** :

```javascript
🔘 Bouton Créer cliqué
✅ Aucune erreur de validation
🚀 onSubmit appelé avec les valeurs: {...}
📤 Données à soumettre (création): {...}
⏳ Appel de createUser.mutateAsync...
✅ createUser.mutateAsync terminé, résultat: {...}
📢 Affichage du toast de succès...
✅ Toast affiché
🚪 Fermeture du dialog...
✅ Dialog fermé
🔄 Réinitialisation du formulaire...
✅ Formulaire réinitialisé
```

**Logs si erreur après création** :

```javascript
🔘 Bouton Créer cliqué
✅ Aucune erreur de validation
🚀 onSubmit appelé avec les valeurs: {...}
📤 Données à soumettre (création): {...}
⏳ Appel de createUser.mutateAsync...
✅ createUser.mutateAsync terminé, résultat: {...}
📢 Affichage du toast de succès...
❌ UserFormDialog error: [ERREUR ICI]  ← Le problème
```

**Si les logs s'arrêtent à "createUser.mutateAsync terminé"** :
- Le problème est dans l'affichage du toast
- Vérifier que `toast` est bien importé

**Si les logs s'arrêtent à "Toast affiché"** :
- Le problème est dans `onOpenChange(false)`
- Vérifier que la fonction est bien passée en props

---

## 🔧 Solutions selon les logs

### Solution 1 : Toast non importé

**Erreur** :
```
ReferenceError: toast is not defined
```

**Vérifier l'import** :
```typescript
import { toast } from 'sonner';
```

**Déjà présent** ✅ (ligne 43)

---

### Solution 2 : onOpenChange non défini

**Erreur** :
```
TypeError: onOpenChange is not a function
```

**Vérifier les props** :
```typescript
interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;  // ✅ Doit être défini
  user?: User | null;
  mode: 'create' | 'edit';
}
```

**Vérifier l'appel** dans `Users.tsx` :
```typescript
<UserFormDialog
  open={isCreateDialogOpen}
  onOpenChange={setIsCreateDialogOpen}  // ✅ Doit être passé
  mode="create"
/>
```

---

### Solution 3 : Erreur dans le hook useCreateUser

**Si l'erreur vient du hook**, vérifier `useUsers.ts` :

```typescript
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      // ... création ...
      return data;  // ✅ Doit retourner les données
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error) => {
      console.error('❌ useCreateUser error:', error);
      // ⚠️ Ne pas throw ici, laisser le composant gérer
    },
  });
};
```

---

### Solution 4 : React Query cache le problème

**Si `mutateAsync` ne throw pas l'erreur**, forcer avec `throwOnError` :

```typescript
const createUser = useCreateUser();

// Dans onSubmit :
await createUser.mutateAsync(dataToSubmit, {
  throwOnError: true,  // ✅ Force le throw en cas d'erreur
});
```

---

## 🎯 Fix rapide : Forcer la fermeture

**Si les logs montrent que tout fonctionne mais le dialog ne se ferme pas**, ajouter un délai :

```typescript
// Fermer le dialog et réinitialiser
console.log('🚪 Fermeture du dialog...');
onOpenChange(false);

// Attendre que le dialog se ferme avant de reset
setTimeout(() => {
  console.log('🔄 Réinitialisation du formulaire...');
  form.reset();
  setAvatarFile(null);
  setAvatarPreview(null);
  setAvatarRemoved(false);
  console.log('✅ Formulaire réinitialisé');
}, 100);
```

---

## 📋 Checklist de vérification

### Imports

- [ ] `import { toast } from 'sonner';` présent
- [ ] `import { useCreateUser } from '../hooks/useUsers';` présent
- [ ] Pas d'erreur d'import dans la console

### Props

- [ ] `onOpenChange` passé au composant
- [ ] `onOpenChange` est une fonction
- [ ] `open` contrôle bien l'état du dialog

### Hook

- [ ] `useCreateUser` retourne bien les données
- [ ] `onSuccess` est appelé
- [ ] Pas d'erreur dans `mutationFn`

### Console

- [ ] Tous les logs apparaissent dans l'ordre
- [ ] Pas d'erreur rouge
- [ ] Le toast apparaît visuellement

---

## 🧪 Test manuel du toast

**Dans la console, taper** :

```javascript
// Tester le toast manuellement
import('sonner').then(({ toast }) => {
  toast.success('✅ Test toast', {
    description: 'Si tu vois ce message, le toast fonctionne',
    duration: 5000,
  });
});
```

**Si le toast apparaît** : Le problème n'est pas le toast  
**Si le toast n'apparaît pas** : Vérifier que `<Toaster />` est dans `App.tsx`

---

## 🔍 Vérifier le Toaster

**Dans `App.tsx`**, vérifier que le Toaster est présent :

```typescript
import { Toaster } from '@/components/ui/toaster';
// OU
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      {/* Routes */}
      <Toaster />  {/* ✅ Doit être présent */}
    </>
  );
}
```

---

## 🎯 Prochaine étape

**Teste maintenant et partage-moi** :

1. **Tous les logs** de la console après avoir cliqué sur "➕ Créer"
2. **Capture d'écran** du dialog qui reste ouvert
3. **Erreurs** éventuelles (en rouge)

Je pourrai alors identifier le problème exact et le corriger ! 🚀

---

## 💡 Solution alternative : Utiliser mutation au lieu de mutateAsync

**Si `mutateAsync` pose problème**, utiliser `mutation` avec callbacks :

```typescript
const createUser = useCreateUser();

// Dans onSubmit :
createUser.mutate(dataToSubmit, {
  onSuccess: (data) => {
    console.log('✅ Utilisateur créé:', data);
    toast.success('✅ Utilisateur créé avec succès');
    onOpenChange(false);
    form.reset();
  },
  onError: (error) => {
    console.error('❌ Erreur:', error);
    toast.error('❌ Erreur', {
      description: error.message,
    });
  },
});
```

**Avantage** : Les callbacks sont garantis d'être appelés  
**Inconvénient** : Code plus verbeux

---

## 📁 Fichiers modifiés

1. ✅ `src/features/dashboard/components/UserFormDialog.tsx`
   - Logs détaillés ajoutés (lignes 312-356)

2. ✅ `FIX_DIALOG_NE_FERME_PAS.md`
   - Guide de diagnostic complet

---

**Teste et partage-moi les logs !** 🔍
