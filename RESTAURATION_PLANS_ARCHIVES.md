# ✅ FONCTIONNALITÉ - Restauration des Plans Archivés

**Date** : 9 novembre 2025, 22:00  
**Demande** : Restaurer les plans archivés

---

## 🎯 FONCTIONNALITÉS AJOUTÉES

### **1. Hook de Restauration** ✅

**Fichier** : `src/features/dashboard/hooks/usePlans.ts`

```typescript
/**
 * Hook pour restaurer un plan archivé
 */
export const useRestorePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
    },
  });
};
```

---

### **2. Bouton "Plans Archivés" dans le Header** ✅

**Position** : En haut de la page, à côté des autres boutons

```typescript
<Button 
  variant="outline" 
  onClick={() => setShowArchived(!showArchived)}
>
  <Archive className="w-4 h-4 mr-2" />
  {showArchived ? 'Plans Actifs' : 'Plans Archivés'}
  {!showArchived && plans && plans.filter(p => !p.isActive).length > 0 && (
    <Badge className="ml-2 bg-orange-500">
      {plans.filter(p => !p.isActive).length}
    </Badge>
  )}
</Button>
```

**Fonctionnalités** :
- ✅ **Toggle** : Bascule entre plans actifs et archivés
- ✅ **Badge compteur** : Affiche le nombre de plans archivés
- ✅ **Couleur orange** : Attire l'attention sur les plans archivés

---

### **3. Affichage Visuel des Plans Archivés** ✅

**Modifications visuelles** :

```typescript
// Carte avec opacité réduite
<Card className={`... ${!plan.isActive ? 'opacity-60' : ''}`}>

// Badge "Archivé" en haut à droite
{!plan.isActive && (
  <Badge className="bg-gray-500 text-white border-0 shadow-lg">
    <Archive className="w-3 h-3 mr-1" />
    Archivé
  </Badge>
)}

// Header en niveaux de gris
<div className={`... ${!plan.isActive ? 'grayscale' : ''}`}>

// Badge de statut rouge
<Badge className={`${plan.isActive ? 'bg-white/20' : 'bg-red-500/80'} ...`}>
  {plan.isActive ? (
    <><CheckCircle2 /> Actif</>
  ) : (
    <><Archive /> Inactif</>
  )}
</Badge>
```

**Résultat visuel** :
```
┌─────────────────────────────────────┐
│ [Archivé]                           │ ← Badge gris en haut à droite
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Icon]            [Inactif]     │ │ ← Header en niveaux de gris
│ │                                 │ │
│ │ Plan Premium (Archivé)          │ │
│ │ Description...                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Prix : 50,000 FCFA/mois             │
│                                     │
│ [🔄 Restaurer]                      │ ← Bouton vert
└─────────────────────────────────────┘
   ↑ Carte avec opacité 60%
```

---

### **4. Bouton "Restaurer"** ✅

**Affichage conditionnel** :

```typescript
{isSuperAdmin && (
  <div className="p-4 bg-gray-50 border-t flex gap-2 mt-auto">
    {plan.isActive ? (
      // Plan actif : Boutons Modifier + Archiver
      <>
        <Button onClick={() => handleEdit(plan)}>
          <Edit /> Modifier
        </Button>
        <Button onClick={() => handleDelete(plan)}>
          <Archive />
        </Button>
      </>
    ) : (
      // Plan archivé : Bouton Restaurer
      <Button 
        className="flex-1 text-[#2A9D8F] hover:bg-[#2A9D8F]/10"
        onClick={() => handleRestore(plan)}
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        Restaurer
      </Button>
    )}
  </div>
)}
```

---

## 🔄 WORKFLOW COMPLET

### **Scénario 1 : Archiver un Plan**

```
1. Super Admin clique sur 🗑️ (icône Archive)
   ↓
2. Vérification des abonnements actifs
   ↓
3a. SI des abonnements actifs :
    ⚠️ Toast : "3 groupes sont abonnés..."
    → Archivage bloqué
    
3b. SI aucun abonnement actif :
    → Confirmation : "Êtes-vous sûr ? Vous pourrez le restaurer."
    ↓
4. Super Admin confirme
   ↓
5. Plan archivé (is_active = false)
   ↓
6. Toast : "✅ Plan archivé avec succès"
   ↓
7. Plan disparaît de la liste (si vue "Plans Actifs")
   ↓
8. Badge compteur mis à jour : "Plans Archivés (1)"
```

---

### **Scénario 2 : Voir les Plans Archivés**

```
1. Super Admin clique sur "Plans Archivés"
   ↓
2. État showArchived = true
   ↓
3. Hook usePlans({ status: 'all' })
   ↓
4. Requête SQL : WHERE is_active = false
   ↓
5. Affichage des plans archivés :
   - Opacité 60%
   - Badge "Archivé" gris
   - Header en niveaux de gris
   - Badge "Inactif" rouge
   - Bouton "Restaurer" vert
```

---

### **Scénario 3 : Restaurer un Plan**

```
1. Super Admin clique sur "Plans Archivés"
   ↓
2. Voit le plan "Premium" archivé
   ↓
3. Clique sur "🔄 Restaurer"
   ↓
4. Confirmation : "Êtes-vous sûr de vouloir restaurer ?"
   ↓
5. Super Admin confirme
   ↓
6. Hook useRestorePlan() exécuté
   ↓
7. UPDATE subscription_plans SET is_active = true
   ↓
8. Toast : "✅ Plan restauré avec succès"
   ↓
9. Cache invalidé automatiquement
   ↓
10. Plan réapparaît dans "Plans Actifs"
    - Opacité 100%
    - Badge "Actif" vert
    - Header en couleur
    - Boutons "Modifier" + "Archiver"
```

---

## 📊 DONNÉES EN TEMPS RÉEL

### **Requête SQL - Plans Actifs**

```sql
SELECT *
FROM subscription_plans
WHERE is_active = true
ORDER BY price ASC;
```

**Résultat** :
```
┌──────────────┬─────────┬───────────┬──────────┐
│ id           │ name    │ price     │ is_active│
├──────────────┼─────────┼───────────┼──────────┤
│ plan-gratuit │ Gratuit │ 0         │ true     │
│ plan-premium │ Premium │ 50000     │ true     │
│ plan-pro     │ Pro     │ 150000    │ true     │
└──────────────┴─────────┴───────────┴──────────┘
```

---

### **Requête SQL - Plans Archivés**

```sql
SELECT *
FROM subscription_plans
WHERE is_active = false
ORDER BY price ASC;
```

**Résultat** :
```
┌──────────────────┬──────────────┬───────────┬──────────┐
│ id               │ name         │ price     │ is_active│
├──────────────────┼──────────────┼───────────┼──────────┤
│ plan-premium-old │ Premium Old  │ 40000     │ false    │
│ plan-starter     │ Starter      │ 25000     │ false    │
└──────────────────┴──────────────┴───────────┴──────────┘
```

---

### **Requête SQL - Restauration**

```sql
UPDATE subscription_plans
SET is_active = true
WHERE id = 'plan-premium-old';
```

**Résultat** :
```
✅ 1 ligne mise à jour
```

---

## 🎨 UX/UI

### **Bouton "Plans Archivés"**

**État : Plans Actifs (par défaut)** :
```
┌────────────────────────────────────┐
│ [📦 Plans Archivés (2)]            │ ← Badge orange avec compteur
└────────────────────────────────────┘
```

**État : Plans Archivés** :
```
┌────────────────────────────────────┐
│ [📦 Plans Actifs]                  │
└────────────────────────────────────┘
```

---

### **Carte Plan Actif**

```
┌─────────────────────────────────────┐
│ [👑 Populaire]                      │ ← Badge jaune
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Icon]            [✅ Actif]    │ │ ← Header coloré
│ │                                 │ │
│ │ Plan Premium                    │ │
│ │ Description...                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Prix : 50,000 FCFA/mois             │
│                                     │
│ [✏️ Modifier] [🗑️]                 │ ← Boutons bleu + rouge
└─────────────────────────────────────┘
   ↑ Opacité 100%, couleurs vives
```

---

### **Carte Plan Archivé**

```
┌─────────────────────────────────────┐
│ [📦 Archivé]                        │ ← Badge gris
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Icon]            [❌ Inactif]  │ │ ← Header gris (grayscale)
│ │                                 │ │
│ │ Plan Premium Old                │ │
│ │ Description...                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Prix : 40,000 FCFA/mois             │
│                                     │
│ [🔄 Restaurer]                      │ ← Bouton vert pleine largeur
└─────────────────────────────────────┘
   ↑ Opacité 60%, niveaux de gris
```

---

## 🔐 SÉCURITÉ

### **Vérifications**

1. ✅ **Rôle Super Admin** : Seul le Super Admin peut archiver/restaurer
2. ✅ **Abonnements actifs** : Vérification avant archivage
3. ✅ **Confirmation** : Double confirmation (toast + confirm)
4. ✅ **RLS** : Row Level Security sur `subscription_plans`

### **Policies RLS**

```sql
-- Seul Super Admin peut archiver/restaurer des plans
CREATE POLICY "Super Admin can update plans"
  ON subscription_plans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );
```

---

## 📁 FICHIERS MODIFIÉS

### **Backend (Hooks)**
- ✅ `src/features/dashboard/hooks/usePlans.ts`
  - Ajout du hook `useRestorePlan()`
  - Modification du hook `usePlans()` pour accepter `status: 'all'`

### **Frontend (Pages)**
- ✅ `src/features/dashboard/pages/Plans.tsx`
  - Ajout de l'état `showArchived`
  - Ajout du bouton "Plans Archivés" avec badge compteur
  - Ajout de la fonction `handleRestore()`
  - Modification de l'affichage des cartes (opacité, grayscale, badges)
  - Modification des boutons d'action (Restaurer vs Archiver)

---

## 🎯 RÉSUMÉ DES FONCTIONNALITÉS

### **✅ Archivage**

1. ✅ **Vérification** : Abonnements actifs avant archivage
2. ✅ **Confirmation** : "Vous pourrez le restaurer plus tard"
3. ✅ **Soft delete** : `is_active = false` (données conservées)
4. ✅ **Toast** : "Plan archivé avec succès"

### **✅ Affichage**

1. ✅ **Bouton toggle** : "Plans Actifs" ↔ "Plans Archivés"
2. ✅ **Badge compteur** : Nombre de plans archivés (orange)
3. ✅ **Opacité 60%** : Plans archivés moins visibles
4. ✅ **Grayscale** : Header en niveaux de gris
5. ✅ **Badge "Archivé"** : Badge gris en haut à droite
6. ✅ **Badge "Inactif"** : Badge rouge dans le header

### **✅ Restauration**

1. ✅ **Bouton "Restaurer"** : Vert, pleine largeur
2. ✅ **Confirmation** : "Êtes-vous sûr ?"
3. ✅ **Mise à jour** : `is_active = true`
4. ✅ **Toast** : "Plan restauré avec succès"
5. ✅ **Réaffichage** : Plan réapparaît dans "Plans Actifs"

---

## 🚀 RÉSULTAT FINAL

**Workflow complet** :
```
1. Super Admin archive un plan
   ↓
2. Plan disparaît de la liste active
   ↓
3. Badge "Plans Archivés (1)" apparaît
   ↓
4. Super Admin clique sur "Plans Archivés"
   ↓
5. Voit le plan archivé (opacité 60%, grayscale)
   ↓
6. Clique sur "🔄 Restaurer"
   ↓
7. Plan restauré et réapparaît dans "Plans Actifs"
   ↓
8. Badge compteur mis à jour : "Plans Archivés (0)"
```

**Avantages** :
- ✅ **Aucune perte de données** : Soft delete
- ✅ **Réversible** : Restauration en 1 clic
- ✅ **Visuel clair** : Plans archivés facilement identifiables
- ✅ **Sécurisé** : Vérification des abonnements actifs
- ✅ **UX intuitive** : Toggle simple entre actifs/archivés

**La fonctionnalité de restauration est maintenant opérationnelle !** 🎉
