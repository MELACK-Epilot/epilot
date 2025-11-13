# 🔧 Fix : Erreur de relation users ↔ school_groups

## 🐛 Erreur

```
Could not find a relationship between 'users' and 'school_groups' in the schema cache
GET .../users?select=*%2Cschool_groups!school_group_id... 400 (Bad Request)
```

## 🔍 Cause

La **foreign key** entre `users.school_group_id` et `school_groups.id` n'existe pas ou n'est pas correctement configurée dans Supabase.

## ✅ Solution en 3 étapes

### Étape 1 : Ouvrir le SQL Editor de Supabase

1. Allez sur : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap
2. Cliquez sur **SQL Editor** dans le menu de gauche
3. Cliquez sur **New query**

### Étape 2 : Exécuter le script SQL

Copiez et exécutez ce script :

```sql
-- Créer la foreign key
ALTER TABLE users
ADD CONSTRAINT users_school_group_id_fkey 
FOREIGN KEY (school_group_id) 
REFERENCES school_groups(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_school_group_id 
ON users(school_group_id);
```

### Étape 3 : Vérifier

Exécutez cette requête pour vérifier :

```sql
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'users'
  AND kcu.column_name = 'school_group_id';
```

**Résultat attendu** :
```
constraint_name: users_school_group_id_fkey
table_name: users
column_name: school_group_id
foreign_table_name: school_groups
```

✅ Si vous voyez cela, c'est bon !

## 🔄 Alternative : Via l'interface Supabase

Si vous préférez l'interface graphique :

1. Allez dans **Table Editor**
2. Sélectionnez la table **users**
3. Cliquez sur la colonne **school_group_id**
4. Activez **Is Foreign Key**
5. Sélectionnez :
   - Table : `school_groups`
   - Column : `id`
   - On delete : `SET NULL`
   - On update : `CASCADE`
6. Cliquez sur **Save**

## 🧪 Test

Après avoir créé la relation :

1. **Rechargez la page** Utilisateurs dans votre app
2. **Vérifiez la console** : Plus d'erreur 400
3. **Vérifiez le tableau** : Les groupes scolaires s'affichent

## 📝 Pourquoi cette erreur ?

Supabase utilise les **foreign keys** pour comprendre les relations entre tables. Sans foreign key, Supabase ne sait pas comment faire la jointure avec la syntaxe :

```typescript
school_groups!school_group_id (id, name, code)
```

Avec la foreign key, Supabase comprend :
- ✅ `users.school_group_id` pointe vers `school_groups.id`
- ✅ La jointure est possible
- ✅ Les données sont récupérées correctement

## ✅ Résultat attendu

### Avant
```
❌ Erreur 400
❌ Could not find a relationship
❌ Tableau vide
```

### Après
```
✅ Requête réussie (200 OK)
✅ Relation reconnue
✅ Groupes scolaires affichés
```

---

**Fichier SQL complet** : `database/FIX_USERS_SCHOOL_GROUPS_RELATION.sql`

**Exécutez le script SQL dans Supabase et l'erreur disparaîtra !** 🚀
