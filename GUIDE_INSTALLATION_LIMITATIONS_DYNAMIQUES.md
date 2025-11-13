# 📦 GUIDE D'INSTALLATION : Limitations Dynamiques

**Date** : 7 novembre 2025, 12:15 PM  
**Temps d'installation** : 5 minutes

---

## 🎯 ÉTAPES D'INSTALLATION

### **ÉTAPE 1 : Exécuter le Script SQL** (2 min)

1. Ouvrir **Supabase Dashboard**
2. Aller dans **SQL Editor**
3. Copier le contenu de `database/CREATE_CHECK_PLAN_LIMIT_FUNCTION.sql`
4. Cliquer sur **Run**

**Résultat attendu** :
```
✅ Function check_plan_limit created successfully
✅ Function increment_resource_count created successfully
✅ Function decrement_resource_count created successfully
```

---

### **ÉTAPE 2 : Vérifier les Fonctions** (1 min)

**Test 1 : Vérifier une limite**
```sql
-- Remplacer 'your-group-id' par un vrai ID de groupe
SELECT * FROM check_plan_limit('your-group-id', 'schools');
```

**Résultat attendu** :
```
allowed | current_count | max_limit | remaining | plan_name | message
--------|---------------|-----------|-----------|-----------|--------
true    | 2             | 5         | 3         | Premium   | Vous pouvez créer 3 schools supplémentaire(s)
```

**Test 2 : Incrémenter un compteur**
```sql
SELECT increment_resource_count('your-group-id', 'schools', 1);
```

**Résultat attendu** :
```
✅ Success (no error)
```

---

### **ÉTAPE 3 : Tester dans l'Application** (2 min)

1. **Aller sur la page Utilisateurs** : `/dashboard/users`
2. **Cliquer sur "Nouvel Utilisateur"**
3. **Remplir le formulaire**
4. **Cliquer sur "Enregistrer"**

**Résultats possibles** :

**✅ Si limite OK** :
```
✅ Utilisateur créé avec succès
```

**❌ Si limite atteinte** :
```
❌ Limite de 10 utilisateur(s) atteinte pour le plan Gratuit. 
   Veuillez mettre à niveau votre plan.
```

---

## 🎨 INTÉGRATION UI (Optionnel)

### **Afficher les Quotas sur le Dashboard**

**Fichier** : `src/features/dashboard/pages/Dashboard.tsx`

```tsx
import { QuotasDashboard } from '../components/QuotaDisplay';
import { useCurrentUserGroup } from '../hooks/useCurrentUserGroup';

export const Dashboard = () => {
  const { data: currentGroup } = useCurrentUserGroup();
  
  return (
    <div className="space-y-6">
      {/* Autres composants */}
      
      {/* ✅ AJOUTER ICI */}
      {currentGroup && (
        <div>
          <h2 className="text-xl font-bold mb-4">Quotas d'Utilisation</h2>
          <QuotasDashboard schoolGroupId={currentGroup.id} />
        </div>
      )}
    </div>
  );
};
```

---

## 📊 CRÉER DES PLANS PERSONNALISÉS

### **Exemple 1 : Plan "École Unique"**

```sql
INSERT INTO subscription_plans (
  name,
  slug,
  description,
  price,
  currency,
  billing_period,
  max_schools,
  max_students,
  max_staff,
  max_storage,
  features,
  is_active
) VALUES (
  'École Unique',
  'ecole-unique',
  'Parfait pour une seule école',
  15000,
  'FCFA',
  'monthly',
  1,           -- ✅ 1 école maximum
  50,          -- ✅ 50 élèves maximum
  10,          -- ✅ 10 staff maximum
  5,           -- ✅ 5 GB de stockage
  '["Gestion des élèves", "Gestion du personnel", "Rapports de base"]',
  true
);
```

---

### **Exemple 2 : Plan "Multi-Écoles"**

```sql
INSERT INTO subscription_plans (
  name,
  slug,
  description,
  price,
  currency,
  billing_period,
  max_schools,
  max_students,
  max_staff,
  max_storage,
  features,
  is_active
) VALUES (
  'Multi-Écoles',
  'multi-ecoles',
  'Pour gérer plusieurs écoles',
  75000,
  'FCFA',
  'monthly',
  10,          -- ✅ 10 écoles maximum
  500,         -- ✅ 500 élèves maximum
  100,         -- ✅ 100 staff maximum
  50,          -- ✅ 50 GB de stockage
  '["Gestion multi-écoles", "Rapports avancés", "API Access", "Support prioritaire"]',
  true
);
```

---

### **Exemple 3 : Plan "Illimité"**

```sql
INSERT INTO subscription_plans (
  name,
  slug,
  description,
  price,
  currency,
  billing_period,
  max_schools,
  max_students,
  max_staff,
  max_storage,
  features,
  is_active
) VALUES (
  'Illimité',
  'illimite',
  'Aucune limite, tout inclus',
  250000,
  'FCFA',
  'monthly',
  -1,          -- ✅ Illimité
  -1,          -- ✅ Illimité
  -1,          -- ✅ Illimité
  -1,          -- ✅ Illimité
  '["Tout illimité", "White label", "Support 24/7", "Formations incluses"]',
  true
);
```

---

## 🔧 DÉPANNAGE

### **Problème 1 : Fonction non trouvée**

**Erreur** :
```
function check_plan_limit(uuid, text) does not exist
```

**Solution** :
1. Vérifier que le script SQL a été exécuté
2. Vérifier les permissions : `GRANT EXECUTE ON FUNCTION check_plan_limit TO authenticated;`
3. Rafraîchir la connexion Supabase

---

### **Problème 2 : Limite non appliquée**

**Erreur** :
```
Utilisateur créé alors que limite atteinte
```

**Solution** :
1. Vérifier que `useCreateUser` a été modifié
2. Vérifier que la fonction `check_plan_limit` est appelée
3. Vérifier les logs : `console.log('❌ Erreur vérification limite:', limitError);`

---

### **Problème 3 : Compteur incorrect**

**Erreur** :
```
Compteur affiche 0 alors qu'il y a des écoles
```

**Solution** :
1. Recalculer les compteurs :
```sql
UPDATE school_groups sg
SET school_count = (
  SELECT COUNT(*) FROM schools WHERE school_group_id = sg.id
);
```

2. Vérifier que `increment_resource_count` est appelé après création

---

## ✅ CHECKLIST POST-INSTALLATION

### **Base de Données**
- [ ] Fonctions SQL créées
- [ ] Permissions accordées
- [ ] Tests SQL réussis

### **Code**
- [ ] `useCreateSchool` modifié
- [ ] `useCreateUser` modifié
- [ ] `useCheckPlanLimit` importé
- [ ] `QuotaDisplay` créé

### **Tests**
- [ ] Création d'école avec limite OK
- [ ] Création d'école avec limite atteinte (bloquée)
- [ ] Création d'utilisateur avec limite OK
- [ ] Création d'utilisateur avec limite atteinte (bloquée)
- [ ] Affichage des quotas sur le dashboard

### **UI**
- [ ] Barres de progression visibles
- [ ] Alertes affichées quand proche limite
- [ ] Bouton "Mettre à niveau" fonctionne
- [ ] Messages d'erreur clairs

---

## 🎊 FÉLICITATIONS !

Votre système de **limitations dynamiques** est maintenant **opérationnel** ! 🚀

**Prochaines étapes** :
1. Créer vos plans personnalisés
2. Assigner les plans aux groupes
3. Tester les limitations
4. Afficher les quotas sur le dashboard

---

**Support** : Si vous rencontrez des problèmes, consultez `IMPLEMENTATION_LIMITATIONS_DYNAMIQUES.md`

**Date** : 7 novembre 2025, 12:15 PM  
**Statut** : ✅ PRÊT À L'EMPLOI
