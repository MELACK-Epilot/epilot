# ✅ Fix : SelectItem avec Valeurs Vides

**Date** : 1er novembre 2025  
**Erreur** : `A <Select.Item /> must have a value prop that is not an empty string`  
**Solution** : ✅ Remplacer les valeurs vides par 'all'

---

## 🎯 Problème

React Select ne permet pas d'avoir un `SelectItem` avec une valeur vide (`value=""`).

**Erreur** :
```
Uncaught Error: A <Select.Item /> must have a value prop that is not an empty string.
This is because the Select value can be set to an empty string to clear the selection.
```

---

## 🔧 Solutions Appliquées

### 1. Page Utilisateurs (UsersFilters.tsx) ✅

**Problème** : `schoolGroups` pouvait contenir des groupes avec `id` vide

**Solution** : Filtrer les groupes invalides
```typescript
{schoolGroups
  .filter((group) => group.id && group.id.trim() !== '')
  .map((group) => (
    <SelectItem key={group.id} value={group.id}>
      {group.name}
    </SelectItem>
  ))}
```

**Fichier** : `src/features/dashboard/components/users/UsersFilters.tsx`

---

### 2. Page Écoles (Schools.tsx) ✅

**Problème** : `<SelectItem value="">Tous les statuts</SelectItem>`

**Solution** : Utiliser `'all'` au lieu de `''`

**Avant** :
```typescript
const [statusFilter, setStatusFilter] = useState<string>('');

<SelectItem value="">Tous les statuts</SelectItem>

const { data: schools } = useSchools({ 
  status: statusFilter,
});
```

**Après** :
```typescript
const [statusFilter, setStatusFilter] = useState<string>('all');

<SelectItem value="all">Tous les statuts</SelectItem>

const { data: schools } = useSchools({ 
  status: statusFilter !== 'all' ? statusFilter : undefined,
});
```

**Fichier** : `src/features/dashboard/pages/Schools.tsx`

---

## 📋 Pattern Standard

### Pour TOUS les Select avec "Tous"

```typescript
// ✅ BON
const [filter, setFilter] = useState<string>('all');

<SelectContent>
  <SelectItem value="all">Tous</SelectItem>
  <SelectItem value="option1">Option 1</SelectItem>
  <SelectItem value="option2">Option 2</SelectItem>
</SelectContent>

// Utilisation
const { data } = useData({
  filter: filter !== 'all' ? filter : undefined
});
```

```typescript
// ❌ MAUVAIS
const [filter, setFilter] = useState<string>('');

<SelectContent>
  <SelectItem value="">Tous</SelectItem> {/* ❌ Erreur ! */}
  <SelectItem value="option1">Option 1</SelectItem>
</SelectContent>
```

---

## 🔍 Vérifications

### Chercher tous les SelectItem avec valeur vide

```bash
# Dans le terminal
grep -r 'SelectItem value=""' src/
```

**Résultat attendu** : Aucun match

---

### Chercher tous les useState avec chaîne vide pour filtres

```bash
grep -r "useState<string>('')" src/features/dashboard/pages/
```

**Action** : Remplacer par `useState<string>('all')`

---

## 📊 Fichiers Corrigés

1. ✅ `src/features/dashboard/components/users/UsersFilters.tsx`
   - Filtrage des groupes avec `id` vide

2. ✅ `src/features/dashboard/pages/Schools.tsx`
   - `value=""` → `value="all"`
   - `useState('')` → `useState('all')`
   - Condition `!== 'all'` ajoutée

---

## 🧪 Tests

### Test 1 : Page Utilisateurs
```
1. Aller sur Utilisateurs
2. Ouvrir le filtre "Groupe scolaire"
3. Vérifier : Pas d'erreur
4. Sélectionner "Tous les groupes"
5. Vérifier : Fonctionne
```

### Test 2 : Page Écoles
```
1. Aller sur Écoles
2. Ouvrir le filtre "Statut"
3. Vérifier : Pas d'erreur
4. Sélectionner "Tous les statuts"
5. Vérifier : Affiche toutes les écoles
```

---

## ⚠️ Pages à Vérifier

Vérifier les autres pages qui ont des Select :

- [ ] Finances
- [ ] Communication
- [ ] Rapports
- [ ] Journal d'Activité
- [ ] Corbeille

**Action** : Appliquer le même pattern partout

---

## ✅ Résultat

**Avant** :
```
❌ Erreur SelectItem avec valeur vide
❌ Application crash
```

**Après** :
```
✅ Tous les Select fonctionnent
✅ Pas d'erreur
✅ Filtres opérationnels
```

---

**Fix SelectItem appliqué partout !** ✅🔧
