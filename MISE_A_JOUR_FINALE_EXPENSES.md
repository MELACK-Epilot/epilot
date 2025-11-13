# 🚀 MISE À JOUR FINALE - PAGE EXPENSES.TSX

## 📝 MODIFICATIONS À FAIRE

### **1. Ajouter les imports**

Ajoute ces imports au début du fichier après les imports existants :

```typescript
import { DeleteConfirmModal, ApproveConfirmModal } from '../components/expenses/ExpenseModals';
import { BulkExpenseActions } from '../components/expenses/BulkExpenseActions';
import { printExpenses } from '@/utils/expenseExport';
import { useUpdateExpense } from '../hooks/useExpenses';
```

### **2. Ajouter les états pour sélection multiple**

Ajoute après les états existants (ligne ~47) :

```typescript
// États sélection multiple
const [selectedExpenses, setSelectedExpenses] = useState<any[]>([]);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [showApproveConfirm, setShowApproveConfirm] = useState(false);
const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
```

### **3. Ajouter le hook updateExpense**

Ajoute après `const deleteExpense = useDeleteExpense();` (ligne ~58) :

```typescript
const updateExpense = useUpdateExpense();
```

### **4. Modifier le handler handleDelete**

Remplace la fonction `handleDelete` (ligne ~178) par :

```typescript
const handleDelete = (expense: any) => {
  setExpenseToDelete(expense);
  setShowDeleteConfirm(true);
};

const confirmDelete = async () => {
  if (!expenseToDelete) return;
  try {
    await deleteExpense.mutateAsync(expenseToDelete.id);
    setSuccessMessage({
      title: 'Dépense supprimée',
      message: 'La dépense a été supprimée avec succès !',
    });
    setShowSuccessModal(true);
    refetch();
  } catch (error) {
    console.error('Erreur suppression:', error);
    alert('Erreur lors de la suppression');
  }
};
```

### **5. Ajouter les handlers pour actions groupées**

Ajoute après `handleViewDetails` (ligne ~198) :

```typescript
// Handlers actions groupées
const handleBulkApprove = () => {
  setShowApproveConfirm(true);
};

const confirmBulkApprove = async () => {
  try {
    for (const expense of selectedExpenses) {
      await updateExpense.mutateAsync({
        id: expense.id,
        status: 'paid',
      });
    }
    setSuccessMessage({
      title: 'Dépenses approuvées',
      message: `${selectedExpenses.length} dépense(s) approuvée(s) avec succès !`,
    });
    setShowSuccessModal(true);
    setSelectedExpenses([]);
    refetch();
  } catch (error) {
    console.error('Erreur approbation:', error);
    alert('Erreur lors de l\'approbation');
  }
};

const handleBulkExport = () => {
  setShowExportModal(true);
};

const handleBulkPrint = () => {
  printExpenses(selectedExpenses);
  setSuccessMessage({
    title: 'Impression lancée',
    message: `${selectedExpenses.length} dépense(s) envoyée(s) à l'imprimante !`,
  });
  setShowSuccessModal(true);
};

const handleBulkDelete = async () => {
  if (confirm(`Supprimer ${selectedExpenses.length} dépense(s) ?`)) {
    try {
      for (const expense of selectedExpenses) {
        await deleteExpense.mutateAsync(expense.id);
      }
      setSuccessMessage({
        title: 'Dépenses supprimées',
        message: `${selectedExpenses.length} dépense(s) supprimée(s) avec succès !`,
      });
      setShowSuccessModal(true);
      setSelectedExpenses([]);
      refetch();
    } catch (error) {
      console.error('Erreur suppression bulk:', error);
      alert('Erreur lors de la suppression');
    }
  }
};
```

### **6. Ajouter checkbox dans le tableau**

Modifie le tableau pour ajouter une colonne de sélection. Ajoute AVANT la colonne 'reference' (ligne ~201) :

```typescript
{
  key: 'select',
  label: (
    <input
      type="checkbox"
      checked={selectedExpenses.length === expenses?.length && expenses?.length > 0}
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedExpenses(expenses || []);
        } else {
          setSelectedExpenses([]);
        }
      }}
      className="rounded border-gray-300"
    />
  ),
  render: (e: any) => (
    <input
      type="checkbox"
      checked={selectedExpenses.some(exp => exp.id === e.id)}
      onChange={(ev) => {
        if (ev.target.checked) {
          setSelectedExpenses([...selectedExpenses, e]);
        } else {
          setSelectedExpenses(selectedExpenses.filter(exp => exp.id !== e.id));
        }
      }}
      className="rounded border-gray-300"
    />
  )
},
```

### **7. Ajouter la barre d'actions groupées**

Ajoute AVANT les modals (ligne ~461) :

```typescript
{/* Barre d'actions groupées */}
<BulkExpenseActions
  selectedCount={selectedExpenses.length}
  onApprove={handleBulkApprove}
  onExport={handleBulkExport}
  onPrint={handleBulkPrint}
  onDelete={handleBulkDelete}
  onClear={() => setSelectedExpenses([])}
/>
```

### **8. Ajouter les nouveaux modals**

Ajoute APRÈS les modals existants (ligne ~486) :

```typescript
<DeleteConfirmModal
  isOpen={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={confirmDelete}
  expense={expenseToDelete}
/>

<ApproveConfirmModal
  isOpen={showApproveConfirm}
  onClose={() => setShowApproveConfirm(false)}
  onConfirm={confirmBulkApprove}
  count={selectedExpenses.length}
/>
```

---

## ✅ RÉSULTAT FINAL

Après ces modifications, tu auras :

1. ✅ **Sélection multiple** avec checkbox
2. ✅ **Barre d'actions groupées** en bas
3. ✅ **Modal de confirmation suppression** moderne
4. ✅ **Modal de confirmation approbation** moderne
5. ✅ **Action Approuver** (passe à "paid")
6. ✅ **Action Exporter** (CSV, Excel, PDF)
7. ✅ **Action Imprimer** (ouvre fenêtre impression)
8. ✅ **Action Supprimer** (supprime sélection)

---

## 🎯 ORDRE D'EXÉCUTION

1. Copie les imports (étape 1)
2. Copie les états (étape 2)
3. Copie le hook (étape 3)
4. Remplace handleDelete (étape 4)
5. Copie les handlers groupés (étape 5)
6. Ajoute checkbox tableau (étape 6)
7. Ajoute barre actions (étape 7)
8. Ajoute modals (étape 8)
9. Sauvegarde
10. Rafraîchis la page

---

**🚀 APRÈS ÇA, TOUT SERA PARFAIT !**
