# 🐛 DEBUG - Données du Dialogue

**Date:** 20 novembre 2025  
**Problème:** KPIs montrent 2 utilisateurs et 1 école, mais le dialogue affiche 0  
**Status:** 🔍 LOGS AJOUTÉS POUR DIAGNOSTIC

---

## 🔍 PROBLÈME IDENTIFIÉ

### Ce que tu vois:
```
✅ KPI Écoles: 1
✅ KPI Utilisateurs: 2
❌ Section Écoles: "Aucune école trouvée"
❌ Section Utilisateurs: "0 utilisateurs récents"
```

### Hypothèses:
1. ❓ Colonne `full_name` n'existe pas → Utiliser `first_name` + `last_name`
2. ❓ Requête échoue silencieusement
3. ❓ `school_group_id` incorrect ou différent

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. **Correction des noms d'utilisateurs**
```typescript
// AVANT (erreur si full_name n'existe pas)
.select(`
  id,
  full_name,  // ❌ Colonne n'existe pas
  email,
  role,
  created_at
`)

// APRÈS (utilise first_name + last_name)
.select(`
  id,
  first_name,  // ✅
  last_name,   // ✅
  email,
  role,
  created_at
`)

// Puis formatage
const users = (usersData || []).map((user: any) => ({
  id: user.id,
  full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
  email: user.email,
  role: user.role,
  created_at: user.created_at,
}));
```

### 2. **Ajout de logs de diagnostic**
```typescript
// Log du groupe interrogé
console.log('🔍 Récupération détails pour groupe:', schoolGroupId);

// Log des écoles
console.log('🏫 Écoles récupérées:', schools?.length || 0, schools);

// Log des utilisateurs
console.log('👥 Utilisateurs récupérés:', users.length, users);

// Log des erreurs
console.error('❌ Erreur récupération écoles:', schoolsError);
console.error('❌ Erreur récupération utilisateurs:', usersError);
```

---

## 🧪 ÉTAPES DE DIAGNOSTIC

### 1. **Rafraîchir la page**
```bash
Ctrl + F5
```

### 2. **Ouvrir la console**
```bash
F12 → Console
```

### 3. **Ouvrir le dialogue**
- Cliquer sur la carte "L'INTELIGENCE CELESTE"

### 4. **Vérifier les logs**

Tu devrais voir dans la console:

#### ✅ Si tout fonctionne:
```javascript
🔍 Récupération détails pour groupe: "xxx-xxx-xxx"
🏫 Écoles récupérées: 1 [{id: "...", name: "..."}]
👥 Utilisateurs récupérés: 2 [{full_name: "...", email: "..."}]
```

#### ❌ Si erreur de colonne:
```javascript
❌ Erreur récupération utilisateurs: {
  code: "42703",
  message: "column \"full_name\" does not exist"
}
```

#### ❌ Si school_group_id incorrect:
```javascript
🔍 Récupération détails pour groupe: "xxx-xxx-xxx"
🏫 Écoles récupérées: 0 []
👥 Utilisateurs récupérés: 0 []
```

---

## 🔧 SOLUTIONS SELON LE LOG

### Cas 1: Colonne `full_name` n'existe pas
**Log:**
```
❌ Erreur: column "full_name" does not exist
```

**Solution:** ✅ Déjà corrigé! Utilise maintenant `first_name` + `last_name`

---

### Cas 2: school_group_id différent
**Log:**
```
🔍 Récupération détails pour groupe: "abc-123"
🏫 Écoles récupérées: 0 []
```

**Vérification:**
```sql
-- Dans Supabase, vérifier:
SELECT id, name FROM school_groups WHERE name = 'L''INTELIGENCE CELESTE';

-- Puis vérifier les écoles:
SELECT * FROM schools WHERE school_group_id = 'le-vrai-id';
```

**Problème possible:** Le `school_group_id` dans la table `subscriptions` est différent de celui dans `schools` et `users`.

---

### Cas 3: Données existent mais ne s'affichent pas
**Log:**
```
🏫 Écoles récupérées: 1 [{...}]
👥 Utilisateurs récupérés: 2 [{...}]
```

**Mais dialogue affiche 0**

**Solution:** Problème dans le composant UI, pas dans le hook.

---

## 📊 VÉRIFICATION BASE DE DONNÉES

### Requête 1: Trouver le groupe
```sql
SELECT id, name 
FROM school_groups 
WHERE name LIKE '%INTELIGENCE%';
```

### Requête 2: Vérifier les écoles
```sql
SELECT id, name, school_group_id
FROM schools
WHERE school_group_id = 'ton-group-id';
```

### Requête 3: Vérifier les utilisateurs
```sql
SELECT id, first_name, last_name, email, role, school_group_id
FROM users
WHERE school_group_id = 'ton-group-id';
```

### Requête 4: Vérifier la subscription
```sql
SELECT id, school_group_id, plan_id, status
FROM subscriptions
WHERE school_group_id = 'ton-group-id';
```

---

## 🎯 RÉSULTAT ATTENDU

Après ces corrections, tu devrais voir dans la console:

```javascript
🔍 Récupération détails pour groupe: "abc-123-def-456"
🏫 Écoles récupérées: 1 [
  {
    id: "...",
    name: "École XYZ",
    address: "...",
    phone: "...",
    email: "...",
    students_count: 0,
    teachers_count: 0
  }
]
👥 Utilisateurs récupérés: 2 [
  {
    id: "...",
    full_name: "Jean Dupont",
    email: "jean@example.com",
    role: "admin_groupe",
    created_at: "2025-11-20..."
  },
  {
    id: "...",
    full_name: "Marie Martin",
    email: "marie@example.com",
    role: "enseignant",
    created_at: "2025-11-19..."
  }
]
```

---

## 📝 CHECKLIST DE VÉRIFICATION

- [ ] Console ouverte (F12)
- [ ] Page rafraîchie (Ctrl+F5)
- [ ] Dialogue ouvert
- [ ] Logs visibles dans la console
- [ ] Copier les logs et me les envoyer

---

## 🚨 SI ÇA NE FONCTIONNE TOUJOURS PAS

### Envoie-moi:
1. **Les logs de la console** (copier-coller)
2. **Le `school_group_id`** affiché dans le log
3. **Résultat de cette requête SQL:**
```sql
SELECT 
  sg.id as group_id,
  sg.name as group_name,
  COUNT(DISTINCT s.id) as schools_count,
  COUNT(DISTINCT u.id) as users_count
FROM school_groups sg
LEFT JOIN schools s ON s.school_group_id = sg.id
LEFT JOIN users u ON u.school_group_id = sg.id
WHERE sg.name LIKE '%INTELIGENCE%'
GROUP BY sg.id, sg.name;
```

---

**Teste maintenant et envoie-moi les logs de la console!** 🔍🐛
