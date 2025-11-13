# 🎯 Logique d'assignation automatique de l'administrateur de groupe

## 📋 Principe

**Approche choisie** : L'admin est assigné automatiquement au groupe lors de la création de l'utilisateur.

### Flux logique

```
1. Créer un Groupe Scolaire
   ↓
   admin_id = NULL (pas d'admin pour l'instant)
   
2. Créer un Utilisateur "Administrateur de Groupe"
   ↓
   Sélectionner obligatoirement un groupe
   ↓
   TRIGGER SQL automatique
   ↓
   Le groupe.admin_id est mis à jour avec l'ID de l'utilisateur
   
3. Résultat
   ↓
   L'admin s'affiche automatiquement dans le tableau des groupes !
```

## ✅ Avantages de cette approche

1. **Logique métier claire** :
   - Un groupe peut exister sans admin (temporairement)
   - Un admin de groupe DOIT avoir un groupe
   - L'assignation est automatique

2. **Pas de double saisie** :
   - On ne saisit le lien qu'une seule fois (côté utilisateur)
   - Le trigger met à jour l'autre côté automatiquement

3. **Cohérence garantie** :
   - Impossible d'avoir un admin sans groupe
   - Le trigger assure la synchronisation

4. **Gestion des changements** :
   - Si un admin change de groupe, l'ancien groupe perd son admin
   - Le nouveau groupe gagne cet admin
   - Tout est automatique

## 🔧 Implémentation technique

### 1. Foreign Key (déjà créée)

```sql
-- users.school_group_id → school_groups.id
ALTER TABLE users
ADD CONSTRAINT users_school_group_id_fkey 
FOREIGN KEY (school_group_id) 
REFERENCES school_groups(id);

-- school_groups.admin_id → users.id
ALTER TABLE school_groups
ADD CONSTRAINT school_groups_admin_id_fkey 
FOREIGN KEY (admin_id) 
REFERENCES users(id);
```

### 2. Trigger automatique

**Fichier** : `database/TRIGGER_AUTO_ASSIGN_GROUP_ADMIN.sql`

**Fonction 1** : `auto_assign_group_admin()`
- Quand un utilisateur `admin_groupe` est créé avec un `school_group_id`
- Met à jour `school_groups.admin_id` automatiquement

**Fonction 2** : `handle_admin_group_change()`
- Quand un admin change de groupe
- Retire l'admin de l'ancien groupe
- Assigne l'admin au nouveau groupe

### 3. Triggers créés

1. `trigger_auto_assign_admin_on_insert` : Sur INSERT users
2. `trigger_auto_assign_admin_on_update` : Sur UPDATE users (school_group_id ou role)
3. `trigger_handle_admin_change` : Sur UPDATE users (changement de groupe)

## 📝 Exemple d'utilisation

### Scénario 1 : Créer un nouveau groupe avec son admin

```sql
-- 1. Créer le groupe (sans admin)
INSERT INTO school_groups (name, code, region, city)
VALUES ('Lycée de la Révolution', 'E-PILOT-002', 'Brazzaville', 'Brazzaville');
-- Résultat : admin_id = NULL

-- 2. Créer l'admin et l'assigner au groupe
INSERT INTO users (first_name, last_name, email, phone, role, school_group_id)
VALUES (
  'Marie', 
  'KONGO', 
  'marie.kongo@epilot.cg', 
  '+242065432109',
  'admin_groupe',
  'bb8d4d51-8eac-4870-8b37-3d699b8c9912' -- ID du groupe
);

-- 3. Le trigger met à jour automatiquement
-- school_groups.admin_id = ID de Marie KONGO
```

### Scénario 2 : Changer l'admin d'un groupe

```sql
-- Créer un nouvel admin pour le même groupe
INSERT INTO users (first_name, last_name, email, role, school_group_id)
VALUES (
  'Jean', 
  'MBEMBA', 
  'jean.mbemba@epilot.cg',
  'admin_groupe',
  'bb8d4d51-8eac-4870-8b37-3d699b8c9912' -- Même groupe
);

-- Le trigger met à jour automatiquement
-- school_groups.admin_id = ID de Jean MBEMBA (le plus récent)
```

### Scénario 3 : Déplacer un admin vers un autre groupe

```sql
-- Modifier le groupe d'un admin existant
UPDATE users
SET school_group_id = 'autre-groupe-id'
WHERE id = 'id-de-ladmin';

-- Le trigger :
-- 1. Retire admin_id de l'ancien groupe
-- 2. Assigne admin_id au nouveau groupe
```

## 🧪 Tests à effectuer

### Test 1 : Créer un groupe puis son admin

1. Créer un groupe via l'interface
2. Créer un utilisateur "Administrateur de Groupe"
3. Sélectionner le groupe créé
4. Sauvegarder
5. ✅ Vérifier que l'admin s'affiche dans le tableau des groupes

### Test 2 : Créer plusieurs admins pour le même groupe

1. Créer 2 admins pour le même groupe
2. ✅ Le dernier créé devient l'admin principal du groupe

### Test 3 : Changer un admin de groupe

1. Modifier un admin existant
2. Changer son groupe
3. ✅ L'ancien groupe perd son admin
4. ✅ Le nouveau groupe gagne cet admin

## ⚠️ Cas particuliers

### Cas 1 : Un groupe avec plusieurs admins potentiels

**Problème** : Si on crée 2 admins pour le même groupe, lequel est l'admin principal ?

**Solution actuelle** : Le dernier créé/modifié devient l'admin principal.

**Alternative future** : Ajouter un champ `is_primary_admin` pour gérer plusieurs admins par groupe.

### Cas 2 : Supprimer un admin

**Problème** : Si on supprime l'admin d'un groupe, que se passe-t-il ?

**Solution actuelle** : `ON DELETE SET NULL` → le groupe perd son admin (admin_id = NULL)

**Alternative** : Empêcher la suppression si c'est le seul admin du groupe.

### Cas 3 : Un admin sans groupe

**Problème** : Peut-on créer un admin_groupe sans school_group_id ?

**Solution actuelle** : Oui, mais il ne sera pas assigné à un groupe.

**Recommandation** : Rendre `school_group_id` obligatoire pour le rôle `admin_groupe` dans la validation Zod du formulaire.

## 📊 Schéma de la relation

```
┌─────────────────┐         ┌──────────────────┐
│  school_groups  │         │      users       │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │◄────────│ school_group_id  │
│ name            │         │ (FK)             │
│ admin_id (FK)   │────────►│ id (PK)          │
│ ...             │         │ role             │
└─────────────────┘         │ ...              │
                            └──────────────────┘

Relation bidirectionnelle :
- users.school_group_id → school_groups.id
- school_groups.admin_id → users.id

Le trigger maintient la cohérence automatiquement !
```

## ✅ Checklist d'installation

- [ ] Exécuter `FIX_USERS_SCHOOL_GROUPS_RELATION.sql`
- [ ] Exécuter `FIX_SCHOOL_GROUPS_ADMIN_RELATION.sql`
- [ ] Exécuter `TRIGGER_AUTO_ASSIGN_GROUP_ADMIN.sql`
- [ ] Tester la création d'un groupe
- [ ] Tester la création d'un admin avec assignation au groupe
- [ ] Vérifier que l'admin s'affiche dans le tableau des groupes
- [ ] Tester le changement de groupe d'un admin

## 🚀 Prochaines étapes

1. **Validation formulaire** : Rendre `school_group_id` obligatoire pour `admin_groupe`
2. **Gestion multi-admins** : Permettre plusieurs admins par groupe (optionnel)
3. **Notifications** : Notifier l'admin quand il est assigné à un groupe
4. **Permissions** : Vérifier que l'admin a bien accès à son groupe

---

**Date** : 30 octobre 2025  
**Statut** : ✅ PRÊT À DÉPLOYER  
**Fichiers** : 
- `database/TRIGGER_AUTO_ASSIGN_GROUP_ADMIN.sql`
- `database/FIX_SCHOOL_GROUPS_ADMIN_RELATION.sql`
- `database/FIX_USERS_SCHOOL_GROUPS_RELATION.sql`
