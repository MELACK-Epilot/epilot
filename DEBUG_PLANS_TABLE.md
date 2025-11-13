# 🔍 Debug : Problème avec les plans

## Problème identifié

Le hook `usePlans` cherche dans la table `subscription_plans` mais la migration SQL référence une table `plans`.

## Solution rapide

Exécute cette requête dans Supabase pour vérifier quelle table existe :

```sql
-- Vérifier quelle table existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name = 'plans' OR table_name = 'subscription_plans');
```

## Si la table s'appelle `plans`

Change le hook `usePlans.ts` ligne 78 :

```typescript
// Avant
.from('subscription_plans')

// Après
.from('plans')
```

## Si la table s'appelle `subscription_plans`

Change la migration SQL `create_plan_change_requests.sql` :

```sql
-- Remplace toutes les occurrences de
REFERENCES plans(id)

-- Par
REFERENCES subscription_plans(id)
```
