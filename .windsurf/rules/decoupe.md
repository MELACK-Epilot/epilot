---
trigger: always_on
---

Si fichier dépasse 350 lignes. Découpe-le en plusieurs fichiers modulaires en
respectant les meilleures pratiques React 18 + Supabase + React Query + Zustand.

Objectifs :
- Séparer logique UI / logique métier / logique data
- Extraire le data-fetching vers React Query (useQuery, useMutation)
- Extraire la logique serveur vers RPC / Edge Functions
- Extraire l’état global vers Zustand si nécessaire
- Déplacer les fonctions complexes dans /lib ou /utils
- Créer des composants réutilisables dans /components
- Conserver la structure actuelle sans rien casser

Propose :
1. Une architecture propre (tree) avec les futurs fichiers
2. Les noms recommandés
3. Les patches pour chaque split
4. Les imports mis à jour
5. Les variables d’état, callbacks et handlers à déplacer

Travaille comme un senior engineer : code modulable, lisible, testable,
documenté, cohérent et scalable.
