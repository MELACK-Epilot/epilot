# 🚀 Plan de Scalabilité : Gestion de 500+ Groupes Scolaires

**Objectif** : Assurer que la page Abonnements reste performante et fluide avec un grand volume de données.

---

## 1. Pagination Serveur (Priorité Haute)

Actuellement, `useSubscriptions` charge **tous** les abonnements d'un coup. C'est rapide pour 10 abonnements, mais lent pour 500+.

### Solution Technique
Modifier `useSubscriptions.ts` pour accepter `page` et `limit`.

```typescript
// Hook useSubscriptions optimisé
export const useSubscriptions = ({ page = 1, limit = 25, filters }: SubscriptionOptions) => {
  return useQuery({
    queryKey: ['subscriptions', page, limit, filters],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, count } = await supabase
        .from('subscriptions')
        .select('...', { count: 'exact' })
        .range(from, to); // ✅ Pagination native Supabase
        
      return { data, total: count };
    }
  });
};
```

---

## 2. Recherche Serveur (Full-Text Search)

Le filtrage actuel se fait côté client (après avoir tout chargé). Il faut passer à une recherche serveur.

### Solution Technique
Utiliser l'opérateur `ilike` ou `textSearch` de Supabase sur le backend.

```typescript
if (searchQuery) {
  // Recherche optimisée sur le nom du groupe
  query = query.ilike('school_groups.name', `%${searchQuery}%`);
}
```

---

## 3. Filtres Rapides Intelligents

Pour gérer 500 groupes, il faut trouver l'information vite.

### Nouveaux Filtres Suggérés
1.  **Par Montant** : "Abonnements > 100k" (Gros clients)
2.  **Par Date d'Échéance** : "Expire ce mois-ci" (Focus renouvellement)
3.  **Par Plan** : "Institutionnel uniquement"

---

## 4. Optimisation des Performances (React)

- **Virtualisation** : Si on décide d'afficher de longues listes sans pagination classique, utiliser `react-window` pour ne rendre que les lignes visibles.
- **Memoization** : Utiliser `useMemo` pour les calculs lourds (déjà en place, mais à surveiller).

---

## 📅 Planning Suggéré

1.  **Phase 1 (Immédiat)** : Corrections visuelles (Fait ✅).
2.  **Phase 2 (Court terme)** : Implémenter la Pagination Serveur.
3.  **Phase 3 (Moyen terme)** : Recherche avancée côté serveur.

Ce plan garantit que E-Pilot pourra scaler sans problème technique majeur.
