---
description: correction
auto_execution_mode: 1
---

Tu es l’ingénieur principal de mon projet. Analyse strictement cette partie du
code et corrige toutes les erreurs graves, même celles qui ne sont pas visibles
au premier regard.

Utilise impérativement les meilleures pratiques modernes du marché en respectant
notre stack :

- Supabase (PostgreSQL, Policies RLS strictes, RPC, Edge Functions)
- React Query (cache, invalidations intelligentes, optimistic updates)
- Zustand (state management global minimal, actions pures)
- React Context (providers propres et isolés)
- RPC/Edge Functions pour la logique serveur
- Index + Partitioning pour améliorer les performances PostgreSQL
- Sécurité : validation des entrées, contrôles côté serveur, access scopes

Étapes obligatoires :
1. Analyse complète du code et de l'architecture affectée
2. Liste des erreurs graves et impacts possibles
3. Proposition d’un plan de correction robuste
4. Implémentation sous forme de PATCHES précis et sûrs
5. Optimisation selon les patterns modernes React 19
6. Vérification du respect RLS + cohérence Supabase

Ton objectif : rendre la fonctionnalité stable, performante, propre,
sécurisée et évolutive. Ne rien casser.
