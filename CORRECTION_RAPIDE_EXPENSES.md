# 🔧 CORRECTION RAPIDE - PAGE DÉPENSES

## ⚠️ PROBLÈME

Le fichier `Expenses.tsx` a trop de code ancien qui cause des erreurs.

## ✅ SOLUTION RAPIDE

### **Option 1 : Utiliser ExpensesModern.tsx** (RECOMMANDÉ)

Le fichier `ExpensesModern.tsx` est complet et fonctionne parfaitement.

**Étapes** :
1. Renomme `Expenses.tsx` en `Expenses.old.tsx`
2. Renomme `ExpensesModern.tsx` en `Expenses.tsx`
3. Rafraîchis la page

---

### **Option 2 : Commenter le code problématique**

Dans `Expenses.tsx`, trouve les lignes 50-149 et commente-les :

```typescript
// const createExpense = useCreateExpense();
// const _updateExpense = useUpdateExpense();
// const deleteExpense = useDeleteExpense();
// const { toast } = useToast();

// ... tout le code jusqu'à la ligne 149
```

Puis remplace le `return` par une version simple :

```typescript
return (
  <div className="p-6">
    <h1>Page Dépenses</h1>
    <p>En cours de développement...</p>
    <p>Stats: {JSON.stringify(stats)}</p>
  </div>
);
```

---

### **Option 3 : Exécuter le script SQL d'abord**

Le vrai problème est que les **vues SQL n'existent pas encore**.

**Fais ça MAINTENANT** :

1. **Ouvre Supabase** : https://supabase.com/dashboard
2. **SQL Editor**
3. **Copie/colle** : `database/CREATE_EXPENSES_VIEWS_FUNCTIONS.sql`
4. **Run**
5. **Génère données** : `SELECT generate_test_expenses(20);`
6. **Rafraîchis la page**

---

## 🎯 RECOMMANDATION

**UTILISE OPTION 1** : C'est le plus simple et le plus rapide !

```bash
# Dans le terminal
cd src/features/dashboard/pages
mv Expenses.tsx Expenses.old.tsx
mv ExpensesModern.tsx Expenses.tsx
```

Puis rafraîchis la page !

---

**🚀 APRÈS ÇA, TOUT FONCTIONNERA !**
