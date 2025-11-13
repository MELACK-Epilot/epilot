# 🔍 Diagnostic : Tableau vide malgré des données existantes

## Problème
Les KPIs affichent des données, mais le tableau reste vide avec "Aucun résultat trouvé".

## Causes possibles

### 1. **Politiques RLS (Row Level Security) trop restrictives** ⚠️ PROBABLE
- Les stats utilisent `count()` qui peut fonctionner même avec RLS
- Mais le `SELECT *` peut être bloqué par les politiques RLS
- **Solution** : Vérifier les politiques RLS dans Supabase

### 2. **Erreur silencieuse dans la transformation des données**
- Le hook transforme les données (lignes 132-154)
- Une erreur dans cette transformation pourrait retourner un tableau vide
- **Solution** : Vérifier les logs de la console

### 3. **Cache React Query obsolète**
- React Query peut avoir mis en cache un résultat vide
- **Solution** : Rafraîchir ou vider le cache

## Actions à effectuer

### Action 1 : Vérifier les logs de la console (PRIORITAIRE)
1. Ouvrez la console du navigateur (F12)
2. Rechargez la page
3. Cherchez ces messages :
   ```
   🚀 useSchoolGroups: Hook appelé avec filtres: undefined
   🔄 useSchoolGroups: Début de la requête...
   📊 useSchoolGroups: Résultat requête: { ... }
   ```
4. **Notez** :
   - `dataLength` : Combien de résultats ?
   - `error` : Y a-t-il une erreur ?
   - `firstItem` : Contenu du premier élément

### Action 2 : Vérifier les politiques RLS dans Supabase
1. Allez dans Supabase Dashboard
2. Cliquez sur **Authentication** > **Policies**
3. Cherchez la table `school_groups`
4. Vérifiez qu'il existe une politique **SELECT** pour les utilisateurs anonymes ou authentifiés

**Script SQL à exécuter dans Supabase** :
```sql
-- Vérifier les politiques RLS existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'school_groups';

-- Vérifier si RLS est activé
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'school_groups';
```

### Action 3 : Désactiver temporairement RLS (TEST UNIQUEMENT)
**⚠️ ATTENTION : À faire uniquement en développement !**

```sql
-- Désactiver RLS temporairement pour tester
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;

-- Après le test, réactiver RLS
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
```

### Action 4 : Créer une politique RLS permissive (si nécessaire)
```sql
-- Politique SELECT pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to view school_groups"
ON school_groups
FOR SELECT
TO authenticated
USING (true);

-- Politique SELECT pour les utilisateurs anonymes (développement uniquement)
CREATE POLICY "Allow anon users to view school_groups"
ON school_groups
FOR SELECT
TO anon
USING (true);
```

### Action 5 : Vider le cache React Query
Ajoutez ce bouton temporaire dans votre page :
```tsx
<Button onClick={() => {
  queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
  queryClient.clear();
}}>
  🔄 Vider le cache
</Button>
```

## Résolution probable

**Si les KPIs fonctionnent mais pas le tableau**, c'est très probablement un problème de **RLS**.

Les requêtes `count()` peuvent fonctionner avec des politiques RLS différentes des `SELECT *`.

**Solution recommandée** :
1. Vérifier les logs de la console
2. Vérifier les politiques RLS
3. Créer une politique SELECT permissive pour le développement
4. En production, affiner les politiques selon les rôles

## Prochaines étapes

Après avoir vérifié les logs de la console, partagez-moi :
- Le contenu exact du log `📊 useSchoolGroups: Résultat requête:`
- Les politiques RLS existantes sur `school_groups`

Je pourrai alors vous donner la solution exacte ! 🎯
