# ✅ PROCÉDURE D'ACTIVATION DES UTILISATEURS

## 🎯 Objectif
Activer les utilisateurs école (Proviseur, Enseignant, CPE, etc.) pour qu'ils puissent accéder à leur espace utilisateur avec leurs rôles et modules.

---

## 📋 Pré-requis

- ✅ Utilisateurs créés dans **Supabase Auth** (via formulaire admin)
- ✅ Groupe scolaire existant
- ✅ École(s) créée(s) et assignée(s) au groupe

---

## 🚀 Étape 1 : Synchroniser auth.users → public.users

### 1.1 Ouvrir Supabase SQL Editor
- Dashboard Supabase > SQL Editor

### 1.2 Exécuter le script de synchronisation
```bash
Fichier : database/SYNC_AUTH_PUBLIC_USERS.sql
```

**Ce script va :**
- ✅ Insérer tous les utilisateurs Auth dans `public.users`
- ✅ Créer un trigger pour les futurs utilisateurs
- ✅ Synchroniser automatiquement les suppressions

**Résultat attendu :**
```
INSERT 0 3  (3 utilisateurs insérés)
CREATE FUNCTION
CREATE TRIGGER
CREATE FUNCTION
CREATE TRIGGER
COMMIT
```

### 1.3 Vérifier la synchronisation
```sql
SELECT id, email, first_name, role, status
FROM public.users
ORDER BY created_at DESC;
```

**Tu dois voir :**
- `int01@epilot.cg` : first_name = 'int01', role = 'autre', status = 'inactive'
- `int2@epilot.cg` : first_name = 'int2', role = 'autre', status = 'inactive'
- `int@epilot.cg` : first_name = 'int', role = 'autre', status = 'inactive'

✅ **OK** : Les utilisateurs existent maintenant dans `public.users`

---

## 🎨 Étape 2 : Compléter les Profils Utilisateurs

### 2.1 Récupérer l'ID du groupe scolaire
```sql
SELECT id, name, status 
FROM school_groups 
ORDER BY created_at DESC;
```

**Copie l'UUID** (ex: `123e4567-e89b-12d3-a456-426614174000`)

### 2.2 Mettre à jour le Proviseur
```sql
-- Remplace 'ID_DU_GROUPE' par l'UUID copié
UPDATE public.users
SET 
  first_name = 'Ramsès',
  last_name = 'MELACK',
  role = 'proviseur'::user_role,
  school_group_id = 'ID_DU_GROUPE',  -- ⚠️ À remplacer
  status = 'active'::user_status,
  updated_at = NOW()
WHERE email = 'int01@epilot.cg';
```

### 2.3 Mettre à jour les autres utilisateurs
```bash
Fichier : database/UPDATE_USERS_PROFILES.sql
```

**Adapte les informations** :
- Prénom, Nom
- Rôle (proviseur, enseignant, cpe, etc.)
- school_group_id
- school_id (optionnel)

### 2.4 Vérifier les mises à jour
```sql
SELECT 
  email,
  first_name,
  last_name,
  role,
  school_group_id,
  status
FROM public.users
WHERE email IN ('int01@epilot.cg', 'int2@epilot.cg', 'int@epilot.cg')
ORDER BY email;
```

**Résultat attendu :**
```
int01@epilot.cg | Ramsès | MELACK | proviseur | xxx-xxx-xxx | active
int2@epilot.cg  | Jean   | Dupont | enseignant| xxx-xxx-xxx | active
int@epilot.cg   | Marie  | Martin | cpe       | xxx-xxx-xxx | active
```

✅ **OK** : Les profils sont complets

---

## 🎉 Étape 3 : Tester l'Espace Utilisateur

### 3.1 Se connecter
- Email : `int01@epilot.cg`
- Mot de passe : (celui défini à la création)

### 3.2 Aller sur l'espace utilisateur
```
/user
```

### 3.3 Ouvrir la Console (F12)
Tu dois voir :
```javascript
=== USER DASHBOARD DEBUG ===
User: {
  id: "xxx-xxx-xxx",
  email: "int01@epilot.cg",
  firstName: "Ramsès",
  lastName: "MELACK",
  role: "proviseur",
  schoolGroupId: "xxx-xxx-xxx",
  status: "active"
}
Loading: false
Error: null
Role: proviseur
School Group ID: xxx-xxx-xxx
===========================
```

### 3.4 Vérifier l'affichage
Tu dois voir :
- ✅ Header : "Bonjour, Ramsès ! 👋"
- ✅ Badge : "Proviseur"
- ✅ 6 Widgets : Écoles, Personnel, Emploi, Notifs, Élèves, Budget
- ✅ Actions rapides : Gérer personnel, Rapports, Statistiques
- ✅ Sidebar complète avec navigation

---

## 📊 Résultat Final

### Dashboard Proviseur
```
┌─────────────────────────────────────────┐
│ Bonjour, Ramsès ! 👋                    │
│ [Proviseur] Espace de gestion • E-Pilot│
│                                    [👤] │
└─────────────────────────────────────────┘

Widgets (6) :
[Écoles: 1] [Personnel: 5] [Emploi] [Notifs] [Élèves: 0] [Budget: 0K]

Actions Rapides (3) :
[👥 Gérer personnel] [✅ Rapports] [📊 Stats]

Activité Récente :
- Activité 1
- Activité 2
- Activité 3
```

---

## 🐛 Dépannage

### Problème 1 : "Utilisateur existe ❌ NON"
**Cause** : Script de synchronisation pas exécuté
**Solution** : Exécuter `database/SYNC_AUTH_PUBLIC_USERS.sql`

### Problème 2 : Dashboard vide, pas de rôle
**Cause** : Profil pas complété
**Solution** : Exécuter les UPDATE dans `database/UPDATE_USERS_PROFILES.sql`

### Problème 3 : "school_group_id NULL"
**Cause** : Groupe pas assigné
**Solution** : 
```sql
UPDATE public.users
SET school_group_id = 'ID_DU_GROUPE'
WHERE email = 'ton_email@epilot.cg';
```

### Problème 4 : Widgets affichent "0"
**Cause** : Données pas encore créées (normal)
**Solution** : Créer des écoles, élèves, etc. Les stats se mettront à jour automatiquement

---

## 📝 Checklist Complète

### Synchronisation
- [ ] Script `SYNC_AUTH_PUBLIC_USERS.sql` exécuté
- [ ] Trigger `on_auth_user_created` créé
- [ ] Utilisateurs présents dans `public.users`

### Profils
- [ ] `first_name` renseigné
- [ ] `last_name` renseigné
- [ ] `role` = 'proviseur' (ou autre)
- [ ] `school_group_id` renseigné
- [ ] `status` = 'active'

### Dashboard
- [ ] Console affiche les logs de debug
- [ ] `user` est défini
- [ ] `user.role` correct
- [ ] Badge rôle affiché
- [ ] Widgets personnalisés visibles
- [ ] Actions rapides affichées
- [ ] Sidebar complète

---

## 🎯 Prochaines Étapes

### Court terme
- ✅ Synchronisation automatique opérationnelle
- ✅ Dashboard personnalisé par rôle
- ✅ Widgets connectés (10%)

### Moyen terme
- [ ] Créer tables : students, classes, grades
- [ ] Connecter les autres widgets (90%)
- [ ] Implémenter les actions rapides

### Long terme
- [ ] Dashboard 100% fonctionnel
- [ ] Toutes les fonctionnalités par rôle
- [ ] Rapports et statistiques avancés

---

## 🎉 Conclusion

Une fois ces étapes complétées :
- ✅ Tous les utilisateurs Auth seront synchronisés
- ✅ Les profils seront complets et actifs
- ✅ L'espace utilisateur affichera le bon rôle
- ✅ Les widgets et actions seront personnalisés
- ✅ La navigation sera complète

**Le système est maintenant opérationnel !** 🚀🇨🇬

---

**Date** : 4 Novembre 2025  
**Version** : 1.0.0  
**Statut** : ✅ PROCÉDURE VALIDÉE
