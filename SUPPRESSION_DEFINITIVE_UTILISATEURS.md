# ✅ SUPPRESSION DÉFINITIVE UTILISATEURS

**Date** : 1er novembre 2025  
**Statut** : ✅ IMPLÉMENTÉ  

---

## 🎯 Changement Demandé

Passer de la **désactivation** (soft delete) à la **suppression définitive** (hard delete) des utilisateurs.

---

## 📊 Comparaison Soft Delete vs Hard Delete

| Aspect | Soft Delete (Avant) | Hard Delete (Après) |
|--------|---------------------|---------------------|
| **Action BDD** | UPDATE is_active = false | DELETE FROM profiles |
| **Données** | ✅ Conservées | ❌ Supprimées |
| **Réversible** | ✅ Oui (réactivation) | ❌ Non (irréversible) |
| **Historique** | ✅ Préservé | ❌ Perdu |
| **Relations** | ✅ Maintenues | ⚠️ Dépend des contraintes FK |
| **Espace BDD** | Utilisé | Libéré |

---

## ✅ Modifications Appliquées

### 1. Hook `useDeleteUser` - Table profiles

**Fichier** : `src/features/dashboard/hooks/useUsers.ts`

#### Avant (Soft Delete)
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({ 
    is_active: false,
    updated_at: new Date().toISOString(),
  })
  .eq('id', id)
  .select()
  .single();
```

#### Après (Hard Delete)
```typescript
const { error } = await supabase
  .from('profiles')
  .delete()
  .eq('id', id);
```

### 2. Optimistic Update

#### Avant (Marquer comme inactif)
```typescript
users: old.users.map((user: User) =>
  user.id === id ? { ...user, status: 'inactive' } : user
)
```

#### Après (Retirer de la liste)
```typescript
users: old.users.filter((user: User) => user.id !== id),
total: (old.total || 0) - 1,
```

### 3. Dialog de Confirmation

#### Titre
- **Avant** : "Confirmer la désactivation"
- **Après** : "Confirmer la suppression"

#### Description
- **Avant** : "Cette action va désactiver l'utilisateur..."
- **Après** : "Cette action va supprimer définitivement l'utilisateur. Cette action est irréversible."

#### Message d'avertissement
```
Avant (Jaune) :
⚠️ L'utilisateur sera désactivé mais ses données seront conservées.
Vous pourrez le réactiver ultérieurement.

Après (Rouge) :
⚠️ ATTENTION : Cette action est irréversible !
L'utilisateur et toutes ses données seront définitivement supprimés.
```

#### Bouton
- **Avant** : "Désactiver l'utilisateur"
- **Après** : "Supprimer définitivement"

### 4. Menu Dropdown
- **Avant** : "Désactiver"
- **Après** : "Supprimer"

### 5. Toast de Succès
- **Avant** : "X a été désactivé(e) avec succès"
- **Après** : "X a été supprimé(e) définitivement"

---

## 🎨 Design du Dialog (Mis à Jour)

```
┌─────────────────────────────────────────┐
│  🔴 Confirmer la suppression            │
│  Cette action est IRRÉVERSIBLE          │
├─────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  [Avatar]  Jean Dupont             │ │
│  │            jean@email.com          │ │
│  │            [Badge: Admin Groupe]   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ⚠️ ATTENTION : Irréversible !      │ │
│  │ Toutes les données seront          │ │
│  │ définitivement supprimées          │ │
│  └────────────────────────────────────┘ │
│                                          │
│      [Annuler]  [Supprimer] 🗑️          │
└─────────────────────────────────────────┘
```

---

## ⚠️ AVERTISSEMENTS IMPORTANTS

### 1. Contraintes de Clés Étrangères
Si la table `profiles` a des relations avec d'autres tables, la suppression peut échouer.

**Solutions** :
- **CASCADE** : Supprimer automatiquement les données liées
- **SET NULL** : Mettre à NULL les références
- **RESTRICT** : Empêcher la suppression si des données liées existent

### 2. Vérifier les Relations
```sql
-- Vérifier les contraintes FK sur profiles
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'profiles'
  AND tc.constraint_type = 'FOREIGN KEY';
```

### 3. Politiques RLS
Assurez-vous que les politiques permettent DELETE :
```sql
-- Vérifier les politiques DELETE
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'DELETE';
```

Si aucune politique DELETE n'existe, créez-en une :
```sql
CREATE POLICY "Allow authenticated delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (true);
```

---

## 🧪 Test Complet

### Test 1 : Suppression Basique
1. Aller sur la page **Utilisateurs**
2. Cliquer sur **Supprimer** (menu ⋮)
3. ✅ Dialog s'ouvre avec message rouge "IRRÉVERSIBLE"
4. Cliquer **Supprimer définitivement**
5. ✅ Toast : "X a été supprimé(e) définitivement"
6. ✅ Utilisateur disparaît de la liste
7. ✅ Compteur total décrémenté

### Test 2 : Vérification BDD
```sql
-- Avant suppression
SELECT id, name, email FROM profiles WHERE id = 'user-id';
-- Résultat : 1 ligne

-- Après suppression
SELECT id, name, email FROM profiles WHERE id = 'user-id';
-- Résultat : 0 ligne (supprimé)
```

### Test 3 : Temps Réel
1. Ouvrir 2 onglets
2. Onglet 1 : Supprimer un utilisateur
3. Onglet 2 : ✅ Utilisateur disparaît automatiquement

### Test 4 : Annulation
1. Cliquer **Supprimer**
2. Dialog s'ouvre
3. Cliquer **Annuler**
4. ✅ Dialog se ferme
5. ✅ Utilisateur toujours présent

### Test 5 : Erreur (si FK existe)
1. Supprimer un utilisateur avec des données liées
2. ❌ Erreur : "violates foreign key constraint"
3. ✅ Toast d'erreur affiché
4. ✅ Rollback automatique (optimistic update annulé)

---

## 🔧 Configuration BDD Recommandée

### Option 1 : CASCADE (Suppression en cascade)
```sql
-- Exemple : Supprimer aussi les données liées
ALTER TABLE schools
DROP CONSTRAINT IF EXISTS schools_created_by_fkey,
ADD CONSTRAINT schools_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE CASCADE;
```

### Option 2 : SET NULL (Mettre à NULL)
```sql
-- Exemple : Garder les écoles mais mettre created_by à NULL
ALTER TABLE schools
DROP CONSTRAINT IF EXISTS schools_created_by_fkey,
ADD CONSTRAINT schools_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;
```

### Option 3 : RESTRICT (Empêcher)
```sql
-- Exemple : Empêcher la suppression si des écoles existent
ALTER TABLE schools
DROP CONSTRAINT IF EXISTS schools_created_by_fkey,
ADD CONSTRAINT schools_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE RESTRICT;
```

---

## 📋 Checklist de Sécurité

Avant de mettre en production :

- [ ] **Politique RLS DELETE** créée et testée
- [ ] **Contraintes FK** vérifiées et configurées
- [ ] **Backup BDD** effectué
- [ ] **Test en staging** réussi
- [ ] **Permissions** : Seuls les admins peuvent supprimer
- [ ] **Audit log** : Enregistrer qui supprime quoi (optionnel)
- [ ] **Confirmation double** : Dialog + message clair
- [ ] **Rollback plan** : Procédure de restauration

---

## 💡 Recommandations

### 1. Audit Log (Optionnel)
Enregistrer les suppressions dans une table d'audit :
```sql
CREATE TABLE audit_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deleted_user_id UUID,
  deleted_user_name TEXT,
  deleted_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMP DEFAULT NOW(),
  reason TEXT
);
```

### 2. Soft Delete Hybride
Garder le soft delete mais ajouter une vraie suppression pour les Super Admins :
```typescript
// Soft delete pour Admin Groupe
const softDelete = async (id: string) => {
  await supabase.from('profiles').update({ is_active: false }).eq('id', id);
};

// Hard delete pour Super Admin uniquement
const hardDelete = async (id: string) => {
  if (currentUser.role !== 'super_admin') {
    throw new Error('Permission refusée');
  }
  await supabase.from('profiles').delete().eq('id', id);
};
```

### 3. Délai de Grâce
Ajouter un délai avant suppression définitive :
```typescript
// Marquer pour suppression
await supabase.from('profiles').update({ 
  marked_for_deletion: true,
  deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
});

// Cron job pour supprimer après 30 jours
```

---

## ✅ Résultat Final

### Avant (Soft Delete)
- ✅ Données conservées
- ✅ Réversible
- ❌ Espace BDD utilisé
- ❌ Peut causer confusion (utilisateurs "fantômes")

### Après (Hard Delete)
- ✅ **Suppression définitive**
- ✅ **Espace BDD libéré**
- ✅ **Pas d'utilisateurs fantômes**
- ✅ **Message clair : IRRÉVERSIBLE**
- ⚠️ **Attention aux FK** (à configurer)
- ⚠️ **Pas de rollback** (backup important)

**La suppression définitive est maintenant active !** 🗑️

**⚠️ IMPORTANT** : Assurez-vous que les politiques RLS et les contraintes FK sont correctement configurées avant utilisation en production.
