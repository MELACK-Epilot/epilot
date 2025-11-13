# ⚡ Actions immédiates pour corriger les erreurs TypeScript

## 🎯 Problème
`useUsers.ts` et `useTickets.ts` ont des erreurs TypeScript graves car Supabase ne reconnaît pas les types des tables.

## ✅ Solution en 3 étapes (5 minutes)

### Étape 1 : Générer les types Supabase
```bash
npx supabase gen types typescript --project-id csltuxbanvweyfzqpfap > src/types/supabase.ts
```

### Étape 2 : Mettre à jour `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### Étape 3 : Vérifier
```bash
npx tsc --noEmit
```

## 🚀 Résultat
- ✅ Plus d'erreurs TypeScript
- ✅ Auto-complétion fonctionnelle
- ✅ Types précis pour toutes les tables

---

**Temps estimé** : 5 minutes  
**Impact** : Résout toutes les erreurs TypeScript dans useUsers.ts et useTickets.ts
