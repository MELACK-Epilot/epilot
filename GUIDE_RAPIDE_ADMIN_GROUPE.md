# 🚀 Guide Rapide - Créer un Admin Groupe

**Temps estimé** : 5 minutes  
**Difficulté** : ⭐ Facile

---

## 📋 Prérequis

- ✅ Accès au Dashboard Supabase
- ✅ Accès au SQL Editor Supabase
- ✅ Application E-Pilot lancée (`npm run dev`)

---

## 🎯 Étapes Rapides

### 1️⃣ Créer l'Utilisateur dans Supabase Auth (2 min)

```
1. Ouvrir Supabase Dashboard
   → https://supabase.com/dashboard

2. Sélectionner votre projet E-Pilot

3. Menu latéral → Authentication → Users

4. Cliquer sur le bouton vert "Add user"

5. Remplir le formulaire :
   ┌─────────────────────────────────┐
   │ Email: int@epilot.com           │
   │ Password: int1@epilot.COM       │
   │ ☑ Auto Confirm User             │ ← IMPORTANT !
   └─────────────────────────────────┘

6. Cliquer "Create user"

7. ⚠️ COPIER L'UUID affiché
   Exemple: 550e8400-e29b-41d4-a716-446655440000
```

---

### 2️⃣ Exécuter le Script SQL (2 min)

```
1. Dans Supabase Dashboard → SQL Editor

2. Cliquer "New query"

3. Copier le contenu de CREATE_ADMIN_GROUPE_SIMPLE.sql

4. ⚠️ REMPLACER 'VOTRE_UUID_ICI' par l'UUID copié
   (Il y a 2 occurrences à remplacer)

5. Cliquer "Run" (ou Ctrl+Enter)

6. ✅ Vérifier qu'il n'y a pas d'erreurs
```

---

### 3️⃣ Vérifier la Création (30 sec)

```sql
-- Exécuter cette requête dans SQL Editor
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  sg.name as groupe
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.email = 'int@epilot.com';
```

**Résultat attendu** :
```
email            | first_name | last_name | role          | groupe
-----------------|------------|-----------|---------------|--------------------------------
int@epilot.com   | Admin      | Groupe    | admin_groupe  | Groupe Scolaire International
```

---

### 4️⃣ Se Connecter (30 sec)

```
1. Ouvrir http://localhost:5173/login

2. Saisir les identifiants :
   Email: int@epilot.com
   Password: int1@epilot.COM

3. Cliquer "Se connecter"

4. ✅ Vous devriez être redirigé vers /dashboard
```

---

## ✅ Vérifications Post-Connexion

### Sidebar Visible
```
✅ Tableau de bord
✅ Écoles
✅ Utilisateurs
✅ Finances
✅ Communication
✅ Rapports
✅ Journal d'Activité
✅ Corbeille
```

### Sidebar Cachée
```
❌ Groupes Scolaires
❌ Catégories Métiers
❌ Modules Pédagogiques
```

### Quotas Affichés
```
Plan Premium:
├── Écoles: 0/10
├── Utilisateurs: 0/100
└── Élèves: 0/1000
```

---

## 🐛 Dépannage

### Erreur : "Email ou mot de passe incorrect"
```
Cause: L'utilisateur n'existe pas dans auth.users
Solution:
1. Vérifier dans Authentication > Users
2. Vérifier que "Auto Confirm User" était coché
3. Réessayer de créer l'utilisateur
```

### Erreur : "column email does not exist"
```
Cause: Mauvais script SQL utilisé
Solution:
1. Utiliser CREATE_ADMIN_GROUPE_SIMPLE.sql
2. Ne PAS utiliser l'ancien CREATE_ADMIN_GROUPE.sql
```

### Erreur : "Erreur lors de la récupération des données"
```
Cause: L'UUID n'a pas été remplacé dans le script
Solution:
1. Vérifier que 'VOTRE_UUID_ICI' a été remplacé (2 fois)
2. Réexécuter le script avec le bon UUID
```

### La sidebar affiche "Groupes Scolaires"
```
Cause: Le rôle est incorrect
Solution:
UPDATE users
SET role = 'admin_groupe'
WHERE email = 'int@epilot.com';
```

---

## 📊 Prochaines Étapes

### 1. Créer une École
```
1. Aller dans "Écoles"
2. Cliquer "Créer une école"
3. Remplir le formulaire
4. ✅ École créée (1/10)
```

### 2. Créer un Utilisateur
```
1. Aller dans "Utilisateurs"
2. Cliquer "Créer un utilisateur"
3. Remplir le formulaire
4. ⚠️ Noter les identifiants temporaires affichés
5. ✅ Utilisateur créé
```

### 3. Inscrire des Élèves
```
1. Aller dans "Élèves"
2. Cliquer "Créer un élève"
3. Ou "Importer CSV"
4. ✅ Élèves inscrits
```

---

## 🎯 Récapitulatif

| Étape | Action | Temps | Statut |
|-------|--------|-------|--------|
| 1 | Créer utilisateur Supabase Auth | 2 min | ⬜ |
| 2 | Exécuter script SQL | 2 min | ⬜ |
| 3 | Vérifier création | 30 sec | ⬜ |
| 4 | Se connecter | 30 sec | ⬜ |

**Total** : ~5 minutes

---

## 📚 Documentation Complète

- **Architecture** : `ARCHITECTURE_HIERARCHIQUE.md`
- **Permissions** : `PERMISSIONS_ADMIN_GROUPE.md`
- **API** : `API_ADMIN_GROUPE_IMPLEMENTATION.md`
- **Corrections SQL** : `CORRECTIONS_SQL_ADMIN_GROUPE.md`

---

**Vous êtes maintenant prêt à utiliser l'espace Admin Groupe !** 🎉

**En cas de problème, consultez** : `CORRECTIONS_SQL_ADMIN_GROUPE.md`
