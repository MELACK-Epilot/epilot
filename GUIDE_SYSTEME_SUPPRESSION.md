# 🗑️ GUIDE - Système de Suppression Complet

**Date** : 8 novembre 2025, 00:52 AM  
**Statut** : ✅ SYSTÈME COMPLET

---

## 🎯 FONCTIONNALITÉS

### **1. Vérification des Dépendances** ✅
- Abonnements actifs (bloquant)
- Modules assignés (supprimés en cascade)
- Catégories assignées (supprimées en cascade)
- Historique des abonnements (conservé)

### **2. Trois Modes de Suppression** ✅
- **Archivage (Soft Delete)** : Recommandé, réversible
- **Suppression Simple** : Si aucun abonnement actif
- **Suppression Forcée** : Annule les abonnements actifs

### **3. Audit Complet** ✅
- Logs de toutes les suppressions
- Données sauvegardées en JSON
- Compteur de dépendances supprimées
- Raison de la suppression

### **4. Interface Intelligente** ✅
- Dialog avec vérification en temps réel
- Badges colorés par statut
- Alertes contextuelles
- Confirmation pour actions dangereuses

---

## 📋 INSTALLATION

### **Étape 1 : Exécuter le Script SQL** (2 minutes)

```bash
# Dans Supabase SQL Editor
```

Exécutez `database/SYSTEME_SUPPRESSION_PLANS.sql`

**Ce script crée** :
1. ✅ Table `deletion_logs` (audit)
2. ✅ Fonction `check_plan_dependencies()` (vérification)
3. ✅ Fonction `delete_plan_safely()` (suppression sécurisée)
4. ✅ Fonction `archive_plan()` (archivage)
5. ✅ Fonction `restore_plan()` (restauration)

---

### **Étape 2 : Intégrer dans la Page Plans**

Modifiez votre page Plans (ex: `PlansUltimate.tsx`) :

```typescript
import { useState } from 'react';
import { PlanDeletionDialog } from '../components/plans/PlanDeletionDialog';
import type { PlanWithContent } from '../hooks/usePlanWithContent';

export const PlansPage = () => {
  const [planToDelete, setPlanToDelete] = useState<PlanWithContent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (plan: PlanWithContent) => {
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      {/* Votre liste de plans */}
      <Button onClick={() => handleDeleteClick(plan)}>
        Supprimer
      </Button>

      {/* Dialog de suppression */}
      <PlanDeletionDialog
        plan={planToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setPlanToDelete(null);
        }}
      />
    </>
  );
};
```

---

## 🔧 UTILISATION

### **Scénario 1 : Archiver un Plan (Recommandé)**

**Quand** : Le plan n'est plus proposé mais des abonnements existent

**Étapes** :
1. Cliquer sur "Supprimer" sur le plan
2. Le dialog affiche les dépendances
3. Cliquer sur "Archiver (recommandé)"
4. Optionnel : Ajouter une raison
5. Confirmer

**Résultat** :
```
✅ Plan "Premium" archivé avec succès
- Plan caché de la liste
- Abonnements existants continuent
- Peut être restauré plus tard
```

---

### **Scénario 2 : Supprimer un Plan Sans Abonnements**

**Quand** : Plan jamais utilisé ou tous les abonnements sont expirés

**Étapes** :
1. Cliquer sur "Supprimer" sur le plan
2. Vérifier les dépendances :
   ```
   ✅ Aucun abonnement actif
   ⚠️ 25 modules assignés - Seront supprimés
   ⚠️ 3 catégories assignées - Seront supprimées
   ```
3. Cliquer sur "Supprimer définitivement"
4. Confirmer

**Résultat** :
```
✅ Plan "Premium" supprimé avec succès (28 dépendances supprimées)
- Plan supprimé de la base
- Modules et catégories supprimés
- Historique conservé dans deletion_logs
```

---

### **Scénario 3 : Forcer la Suppression (Dangereux)**

**Quand** : Migration urgente, plan obsolète avec abonnements actifs

**Étapes** :
1. Cliquer sur "Supprimer" sur le plan
2. Voir l'alerte :
   ```
   ❌ Ce plan a des abonnements actifs
   La suppression est fortement déconseillée
   ```
3. Cliquer sur "Forcer la suppression"
4. Lire l'alerte de confirmation
5. Cliquer sur "Confirmer la suppression forcée"

**Résultat** :
```
⚠️ Abonnements actifs annulés automatiquement
✅ Plan "Premium" supprimé avec succès
- Abonnements passés à 'cancelled'
- Plan supprimé
- Modules et catégories supprimés
```

---

### **Scénario 4 : Restaurer un Plan Archivé**

**SQL** :
```sql
SELECT * FROM restore_plan(
  'uuid-du-plan',
  'uuid-user'
);
```

**Résultat** :
```
✅ Plan "Premium" restauré avec succès
- Plan visible à nouveau
- Peut être sélectionné pour nouveaux abonnements
```

---

## 📊 VÉRIFICATIONS

### **1. Vérifier les Dépendances (Avant Suppression)**

```sql
SELECT * FROM check_plan_dependencies('uuid-du-plan');
```

**Résultat** :
```
dependency_type        | count | can_delete | message
-----------------------|-------|------------|---------------------------
active_subscriptions   | 2     | false      | ❌ 2 abonnement(s) actif(s)
plan_modules           | 25    | true       | ⚠️ 25 module(s) assigné(s)
plan_categories        | 3     | true       | ⚠️ 3 catégorie(s) assignée(s)
inactive_subscriptions | 5     | true       | ℹ️ 5 abonnement(s) inactif(s)
```

**Interprétation** :
- ❌ `can_delete = false` → Suppression bloquée (archivage recommandé)
- ⚠️ `can_delete = true, count > 0` → Suppression possible (dépendances supprimées)
- ✅ `count = 0` → Aucune dépendance

---

### **2. Voir l'Historique des Suppressions**

```sql
SELECT 
  record_data->>'name' as plan_name,
  deletion_type,
  reason,
  dependencies_count,
  deleted_at
FROM deletion_logs
WHERE table_name = 'subscription_plans'
ORDER BY deleted_at DESC
LIMIT 10;
```

**Résultat** :
```
plan_name | deletion_type | reason           | dependencies_count | deleted_at
----------|---------------|------------------|--------------------|-----------
Premium   | hard          | Plan obsolète    | 28                 | 2025-11-08
Gratuit   | soft          | Plus proposé     | 0                  | 2025-11-07
Pro       | hard          | Migration v2     | 34                 | 2025-11-06
```

---

## 🎨 INTERFACE UTILISATEUR

### **Dialog de Suppression**

**Éléments visuels** :
1. **Titre** : "Supprimer le plan 'Premium'" avec icône ⚠️
2. **Liste des dépendances** :
   - ✅ Vert : Aucune dépendance
   - ⚠️ Orange : Dépendances supprimées en cascade
   - ❌ Rouge : Bloquant (abonnements actifs)
3. **Alertes contextuelles** :
   - Rouge : Abonnements actifs détectés
   - Orange : Confirmation de suppression forcée
4. **Champ raison** : Textarea optionnel
5. **Boutons** :
   - Annuler (outline)
   - Archiver (bleu, recommandé)
   - Supprimer (rouge, si possible)
   - Forcer (rouge foncé, si abonnements actifs)

---

## 🔒 SÉCURITÉ

### **Permissions RLS**

Ajoutez ces policies :

```sql
-- Seul Super Admin peut supprimer
CREATE POLICY "Super Admin can delete plans"
  ON subscription_plans
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Seul Super Admin peut voir les logs
CREATE POLICY "Super Admin can view deletion logs"
  ON deletion_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );
```

---

## 📈 AVANTAGES

### **Avant (Système Basique)** ❌
```typescript
const handleDelete = async (id: string) => {
  await supabase
    .from('subscription_plans')
    .update({ is_active: false })
    .eq('id', id);
};
```

**Problèmes** :
- ❌ Pas de vérification des dépendances
- ❌ Pas d'audit
- ❌ Pas de suppression réelle
- ❌ Pas de gestion des abonnements actifs

---

### **Après (Système Complet)** ✅

**Avantages** :
- ✅ Vérification automatique des dépendances
- ✅ 3 modes : Archivage, Suppression, Force
- ✅ Audit complet avec logs
- ✅ Interface intelligente avec alertes
- ✅ Suppression en cascade sécurisée
- ✅ Restauration possible (archivage)
- ✅ Raison de suppression enregistrée

---

## 🧪 TESTS

### **Test 1 : Archiver un Plan**

```sql
SELECT * FROM archive_plan(
  (SELECT id FROM subscription_plans WHERE slug = 'premium'),
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1),
  'Plan obsolète'
);
```

**Vérifier** :
```sql
SELECT name, is_active FROM subscription_plans WHERE slug = 'premium';
-- Résultat : is_active = false
```

---

### **Test 2 : Supprimer un Plan Sans Abonnements**

```sql
-- Créer un plan test
INSERT INTO subscription_plans (name, slug, price, is_active)
VALUES ('Test Plan', 'test', 0, true)
RETURNING id;

-- Supprimer
SELECT * FROM delete_plan_safely(
  'uuid-du-plan-test',
  'uuid-user',
  false,
  'Plan de test'
);

-- Vérifier
SELECT * FROM subscription_plans WHERE slug = 'test';
-- Résultat : 0 rows (supprimé)
```

---

### **Test 3 : Bloquer la Suppression (Abonnements Actifs)**

```sql
SELECT * FROM delete_plan_safely(
  (SELECT id FROM subscription_plans WHERE slug = 'premium'),
  'uuid-user',
  false,  -- force = false
  'Test'
);

-- Résultat attendu :
-- success = false
-- message = "❌ Impossible de supprimer : Des abonnements actifs..."
```

---

## 📝 CHECKLIST D'INSTALLATION

- [ ] Script SQL exécuté (`SYSTEME_SUPPRESSION_PLANS.sql`)
- [ ] Table `deletion_logs` créée
- [ ] 5 fonctions créées (check, delete, archive, restore)
- [ ] Hook `usePlanDeletion.ts` ajouté
- [ ] Composant `PlanDeletionDialog.tsx` ajouté
- [ ] Intégré dans la page Plans
- [ ] Policies RLS ajoutées
- [ ] Tests effectués (archivage, suppression, blocage)
- [ ] Documentation lue

---

## 🎉 RÉSULTAT FINAL

**Système de suppression** :
- ✅ Intelligent (vérification automatique)
- ✅ Sécurisé (3 niveaux de protection)
- ✅ Auditable (logs complets)
- ✅ Réversible (archivage + restauration)
- ✅ Professionnel (interface claire)

**Comparable à** : Stripe, Shopify, AWS (niveau entreprise)

---

**Date** : 8 novembre 2025, 00:52 AM  
**Développé par** : Cascade AI  
**Statut** : ✅ PRODUCTION READY

**Le système de suppression est maintenant complet et sécurisé !** 🚀
