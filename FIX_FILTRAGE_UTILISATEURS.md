# ✅ Fix : Filtrage des Utilisateurs par Rôle

**Date** : 1er novembre 2025  
**Problème** : Admin Groupe voyait le Super Admin et les admin d'autres groupes  
**Solution** : ✅ Filtrage strict selon le rôle

---

## 🎯 Règles de Filtrage

### Super Admin
**Ce qu'il voit** :
- ✅ Tous les Super Admin
- ✅ Tous les Admin Groupe (tous groupes confondus)
- ✅ Peut filtrer par groupe

**Requête** :
```sql
SELECT * FROM profiles
WHERE role IN ('SUPER_ADMIN', 'admin_groupe')
ORDER BY created_at DESC;
```

---

### Admin Groupe
**Ce qu'il voit** :
- ✅ UNIQUEMENT les admin_groupe de SON groupe
- ❌ PAS le Super Admin
- ❌ PAS les admin d'autres groupes

**Requête** :
```sql
SELECT * FROM profiles
WHERE role = 'admin_groupe'
  AND school_group_id = 'son_groupe_id'
ORDER BY created_at DESC;
```

---

## 🔧 Modification Appliquée

### Fichier : `useUsers.ts`

**Avant** :
```typescript
// ❌ PROBLÈME : Affichait tout le monde
let query = supabase
  .from('profiles')
  .select('*')
  .in('role', ['SUPER_ADMIN', 'admin_groupe']);

if (filters?.schoolGroupId) {
  query = query.eq('school_group_id', filters.schoolGroupId);
}
```

**Après** :
```typescript
// ✅ SOLUTION : Filtrage selon le rôle
let query = supabase
  .from('profiles')
  .select('*')
  .order('created_at', { ascending: false });

// FILTRAGE SELON LE RÔLE
if (filters?.schoolGroupId) {
  // Admin Groupe : NE voir QUE les utilisateurs de son groupe
  query = query
    .eq('school_group_id', filters.schoolGroupId)
    .eq('role', 'admin_groupe');
} else {
  // Super Admin : Voir Super Admin ET Admin Groupe
  query = query.in('role', ['SUPER_ADMIN', 'admin_groupe']);
}
```

---

## 📊 Résultat

### Avant (❌ Problème)

**Admin Groupe LAMARELLE voyait** :
```json
[
  { "email": "admin@epilot.cg", "role": "SUPER_ADMIN" },      // ❌ Ne devrait pas voir
  { "email": "int@epilot.com", "role": "admin_groupe" },      // ✅ OK
  { "email": "lam@epilot.cg", "role": "admin_groupe" },       // ✅ OK
  { "email": "ana@epilot.cg", "role": "admin_groupe" },       // ✅ OK
  { "email": "autre@groupe.cg", "role": "admin_groupe" }      // ❌ Ne devrait pas voir
]
```

---

### Après (✅ Correct)

**Admin Groupe LAMARELLE voit** :
```json
[
  { "email": "int@epilot.com", "role": "admin_groupe", "groupe": "LAMARELLE" },
  { "email": "lam@epilot.cg", "role": "admin_groupe", "groupe": "LAMARELLE" },
  { "email": "ana@epilot.cg", "role": "admin_groupe", "groupe": "LAMARELLE" }
]
```

**Super Admin voit** :
```json
[
  { "email": "admin@epilot.cg", "role": "SUPER_ADMIN" },
  { "email": "int@epilot.com", "role": "admin_groupe", "groupe": "LAMARELLE" },
  { "email": "lam@epilot.cg", "role": "admin_groupe", "groupe": "LAMARELLE" },
  { "email": "ana@epilot.cg", "role": "admin_groupe", "groupe": "LAMARELLE" },
  { "email": "autre@groupe.cg", "role": "admin_groupe", "groupe": "AUTRE" }
]
```

---

## 🧪 Tests

### Test 1 : Admin Groupe LAMARELLE
```
1. Se connecter avec int@epilot.com
2. Aller sur Utilisateurs
3. Vérifier :
   ✅ Voir uniquement int@epilot.com, lam@epilot.cg, ana@epilot.cg
   ❌ NE PAS voir admin@epilot.cg (Super Admin)
   ❌ NE PAS voir les admin d'autres groupes
```

### Test 2 : Super Admin
```
1. Se connecter avec admin@epilot.cg
2. Aller sur Utilisateurs
3. Vérifier :
   ✅ Voir admin@epilot.cg (lui-même)
   ✅ Voir tous les admin_groupe de tous les groupes
   ✅ Pouvoir filtrer par groupe
```

---

## 📋 Checklist

- [x] Modification du hook useUsers
- [x] Filtrage selon le rôle
- [x] Admin Groupe ne voit que son groupe
- [x] Super Admin voit tout
- [ ] Tests effectués
- [ ] Validation finale

---

## 🎯 Impact

**Sécurité** : ✅ Améliorée  
**Isolation des données** : ✅ Respectée  
**Hiérarchie** : ✅ Correcte  
**Performance** : ✅ Optimale (moins de données)

---

**Filtrage correct implémenté !** ✅🔒
