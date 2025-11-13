# 🚀 Migration vers profiles - EN COURS

**Date** : 1er novembre 2025  
**Statut** : ✅ EN COURS - 40% Complété  
**Décision** : Validée par l'expert

---

## ✅ Complété (40%)

### 1. Types TypeScript ✅
- [x] Type `Profile` créé dans `auth.types.ts`
- [x] Type `Database` créé dans `database.types.ts`
- [x] Table `profiles` ajoutée au schéma

### 2. Client Supabase ✅
- [x] Import mis à jour vers `database.types.ts`
- [x] `checkSupabaseConnection` utilise `profiles`

### 3. Hook useLogin ✅
- [x] Requête vers `profiles` au lieu de `users`
- [x] Mapping des champs (`full_name`, `avatar_url`, etc.)
- [x] Conversion du rôle (`SUPER_ADMIN` → `super_admin`)

---

## 🔄 En Cours (30%)

### 4. Hook useDashboardStats 🔄
**À faire** :
```typescript
// Remplacer
.from('users')
// Par
.from('profiles')
```

### 5. Hook useUsers → useProfiles 🔄
**À faire** :
- Renommer le fichier
- Changer toutes les requêtes
- Adapter le mapping des données

---

## ⏳ À Faire (30%)

### 6. Tous les Autres Hooks
- [ ] `useSchools.ts` - Vérifier les jointures
- [ ] `useFinancialStats.ts` - Adapter si nécessaire
- [ ] Tous les hooks qui utilisent `users`

### 7. Composants
- [ ] `DashboardLayout.tsx` - Adapter l'affichage
- [ ] `WelcomeCard.tsx` - Utiliser `profile.name`
- [ ] `Profile.tsx` - Utiliser `profile.avatar_url`
- [ ] Tous les composants qui affichent des données utilisateur

### 8. Pages
- [ ] `Users.tsx` → `Profiles.tsx` (renommer)
- [ ] Adapter toutes les pages

---

## 📋 Checklist Détaillée

### Phase 1 : Types et Auth (✅ 100%)
- [x] Créer type `Profile`
- [x] Créer `database.types.ts`
- [x] Mettre à jour client Supabase
- [x] Adapter `useLogin`

### Phase 2 : Hooks (🔄 20%)
- [x] Adapter `useLogin`
- [ ] Adapter `useDashboardStats`
- [ ] Renommer `useUsers` → `useProfiles`
- [ ] Adapter tous les hooks

### Phase 3 : Composants (⏳ 0%)
- [ ] Adapter `DashboardLayout`
- [ ] Adapter `WelcomeCard`
- [ ] Adapter `Profile`
- [ ] Adapter tous les composants

### Phase 4 : Pages (⏳ 0%)
- [ ] Renommer `Users.tsx`
- [ ] Adapter toutes les pages
- [ ] Tests complets

---

## 🎯 Mapping des Champs

| users (ancien) | profiles (nouveau) | Transformation |
|----------------|-------------------|----------------|
| first_name | name | Direct |
| last_name | (supprimé) | Utiliser `full_name` |
| email | email | Direct |
| avatar | avatar_url | Direct |
| role | role | `.toLowerCase()` |
| status | is_active | Boolean |
| phone | phone | Direct |
| school_group_id | school_group_id | Direct |
| created_at | created_at | Direct |
| updated_at | updated_at | Direct |

---

## 🔧 Pattern de Migration

### Pour chaque hook :

```typescript
// ❌ AVANT
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);

const user = {
  firstName: data.first_name,
  lastName: data.last_name,
  avatar: data.avatar,
};

// ✅ APRÈS
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);

const profile = {
  name: data.name,
  fullName: data.full_name,
  avatar: data.avatar_url,
};
```

---

## 📊 Avantages Constatés

### 1. Code Plus Simple
```typescript
// AVANT : 3 lignes
const firstName = user.firstName;
const lastName = user.lastName;
const fullName = `${firstName} ${lastName}`;

// APRÈS : 1 ligne
const fullName = profile.full_name;
```

### 2. Moins d'Erreurs
- Pas de transformation `first_name` → `firstName`
- Pas de gestion `null` vs `undefined`
- Types TypeScript plus stricts

### 3. Performance
- Moins de transformations
- Requêtes plus simples
- Cache plus efficace

---

## 🚀 Prochaines Étapes

### Immédiat (Aujourd'hui)
1. ✅ Types créés
2. ✅ Client Supabase adapté
3. ✅ useLogin adapté
4. ⏳ Adapter useDashboardStats
5. ⏳ Tester la connexion

### Court terme (Cette semaine)
6. Adapter tous les hooks
7. Adapter tous les composants
8. Tests complets

### Moyen terme (Semaine prochaine)
9. Supprimer l'ancien type User
10. Nettoyer le code
11. Documentation finale

---

## 🧪 Tests à Effectuer

### Test 1 : Connexion
```
1. Se connecter avec int@epilot.com
2. Vérifier que les données s'affichent
3. Vérifier le nom complet
4. Vérifier l'avatar
```

### Test 2 : Dashboard
```
1. Vérifier les stats
2. Vérifier le header
3. Vérifier la WelcomeCard
4. Vérifier le nom affiché
```

### Test 3 : Profil
```
1. Aller sur la page Profil
2. Vérifier l'affichage
3. Modifier le nom
4. Upload avatar
```

---

## 📝 Notes Importantes

### Compatibilité Temporaire
Le code actuel maintient une compatibilité avec l'ancien format `User` pour éviter de tout casser d'un coup.

### Migration Progressive
Nous migrons progressivement :
1. ✅ Auth (fait)
2. 🔄 Hooks (en cours)
3. ⏳ Composants (à faire)
4. ⏳ Pages (à faire)

### Rollback Possible
Si problème, on peut revenir en arrière facilement car :
- Ancien type `User` conservé
- Nouveau type `Profile` ajouté
- Pas de suppression de code

---

**Migration en cours - 40% complété !** 🚀✅

**Prochaine étape** : Adapter useDashboardStats et useProfiles
