# Fix Supabase Types - Relationships Key

## ✅ Problème résolu

**Erreur TypeScript** :
```
Argument of type '{ status: string; rejection_reason: string; }' 
is not assignable to parameter of type 'never'.
```

## 🔍 Cause racine

Les types Supabase générés manuellement étaient **incomplets**. Chaque table dans `Database['public']['Tables']` doit avoir **4 clés obligatoires** :

1. ✅ `Row` - Type pour lecture
2. ✅ `Insert` - Type pour insertion
3. ✅ `Update` - Type pour mise à jour
4. ❌ `Relationships` - **MANQUAIT** → Causait l'erreur `never`

Sans la clé `Relationships`, TypeScript ne peut pas inférer correctement les types pour les opérations Supabase (`.update()`, `.insert()`, etc.).

## 🛠️ Solution appliquée

Ajout de `Relationships: []` à **toutes les 9 tables** :

```typescript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: { ... }
        Insert: { ... }
        Update: { ... }
        Relationships: []  // ← AJOUTÉ
      }
      school_groups: {
        Row: { ... }
        Insert: { ... }
        Update: { ... }
        Relationships: []  // ← AJOUTÉ
      }
      // ... et ainsi de suite pour toutes les tables
    }
  }
}
```

## 📋 Tables corrigées (9/9)

1. ✅ `users`
2. ✅ `school_groups`
3. ✅ `schools`
4. ✅ `plans`
5. ✅ `subscriptions`
6. ✅ `business_categories`
7. ✅ `modules`
8. ✅ `inscriptions`
9. ✅ `activity_logs`
10. ✅ `notifications`

## 🎯 Résultat

Le hook `useRejectInscription` fonctionne maintenant correctement :

```typescript
// ✅ Plus d'erreur TypeScript
const { error } = await supabase
  .from('inscriptions')
  .update({
    status: 'rejected',
    rejection_reason: reason,
  })
  .eq('id', id);
```

## 💡 Recommandation future

Pour éviter ce problème à l'avenir, **générez les types automatiquement** avec la CLI Supabase :

```bash
npx supabase gen types typescript --project-id csltuxbanvweyfzqpfap > src/types/supabase.types.ts
```

Cela garantit que tous les types sont complets et à jour avec votre schéma de base de données.

## 📁 Fichiers modifiés

- ✅ `src/types/supabase.types.ts` - Ajout de `Relationships: []` à toutes les tables
- ✅ `src/features/modules/inscriptions/hooks/mutations/useRejectInscription.ts` - Fonctionne maintenant

## ✨ Statut

**RÉSOLU** - TypeScript infère maintenant correctement les types pour toutes les opérations Supabase.
