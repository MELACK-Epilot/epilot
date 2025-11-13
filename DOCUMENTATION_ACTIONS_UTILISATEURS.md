# 📚 DOCUMENTATION - ACTIONS UTILISATEURS

## 🔐 1. RÉINITIALISER MOT DE PASSE

### **Qu'est-ce que c'est ?**
La fonction "Réinitialiser MDP" permet d'envoyer un email de réinitialisation de mot de passe à un utilisateur.

### **Comment ça fonctionne ?**

1. **Déclenchement** :
   - L'admin clique sur les 3 points verticaux (⋮) dans le tableau
   - Sélectionne "Réinitialiser MDP"
   - Une confirmation s'affiche : `Envoyer un email de réinitialisation à [email] ?`

2. **Processus technique** :
   ```typescript
   // Fichier: src/features/dashboard/pages/Users.tsx (ligne 153-162)
   const handleResetPassword = useCallback(async (user: User) => {
     if (confirm(`Envoyer un email de réinitialisation à ${user.email} ?`)) {
       try {
         await resetPassword.mutateAsync(user.email);
         toast.success('Email de réinitialisation envoyé');
       } catch (error: any) {
         toast.error(error.message || 'Erreur lors de l\'envoi');
       }
     }
   }, [resetPassword]);
   ```

3. **Backend (Supabase Auth)** :
   ```typescript
   // Fichier: src/features/dashboard/hooks/useUsers.ts (ligne 494-506)
   export const useResetPassword = () => {
     return useMutation({
       mutationFn: async (email: string) => {
         const { error } = await supabase.auth.resetPasswordForEmail(email, {
           redirectTo: `${window.location.origin}/reset-password`,
         });
         if (error) throw error;
         return { success: true };
       },
     });
   };
   ```

### **Ce qui se passe pour l'utilisateur** :

1. ✅ L'utilisateur reçoit un **email de Supabase**
2. ✅ L'email contient un **lien de réinitialisation**
3. ✅ Le lien redirige vers `/reset-password` de votre application
4. ✅ L'utilisateur peut définir un **nouveau mot de passe**
5. ✅ Le nouveau mot de passe est **enregistré dans Supabase Auth**

### **Sécurité** :
- ✅ Le lien expire après un certain temps (défini par Supabase)
- ✅ L'ancien mot de passe devient invalide une fois le nouveau défini
- ✅ L'utilisateur doit avoir accès à son email

---

## 📦 2. ASSIGNER MODULES ET CATÉGORIES

### **Qu'est-ce que c'est ?**
Le système d'affectation de modules permet à l'admin de groupe de :
- ✅ Donner accès à des modules spécifiques à un utilisateur
- ✅ Définir des permissions granulaires (lecture, écriture, suppression, export)
- ✅ Assigner des catégories entières de modules

### **Architecture du système** :

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN DE GROUPE                       │
│         (Gère les utilisateurs de son groupe)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              MODULES DISPONIBLES                         │
│  (Selon le plan du groupe : Free, Basic, Pro, Premium)  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            ASSIGNATION À L'UTILISATEUR                   │
│  • Module individuel (direct assignment)                 │
│  • Catégorie complète (category assignment)              │
│  • Permissions : Lecture, Écriture, Suppression, Export │
└─────────────────────────────────────────────────────────┘
```

### **Tables de la base de données** :

#### **1. `modules`** (Catalogue des modules)
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES module_categories(id),
  is_active BOOLEAN DEFAULT true,
  required_plan TEXT, -- 'free', 'basic', 'pro', 'premium'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **2. `module_categories`** (Catégories de modules)
```sql
CREATE TABLE module_categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT, -- Couleur pour l'UI
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **3. `user_module_permissions`** (Vue des permissions)
```sql
-- Vue qui combine les assignations directes et par catégorie
CREATE VIEW user_module_permissions AS
SELECT 
  uma.user_id,
  m.id AS module_id,
  m.name AS module_name,
  m.slug AS module_slug,
  mc.id AS category_id,
  mc.name AS category_name,
  'direct' AS assignment_type,
  uma.can_read,
  uma.can_write,
  uma.can_delete,
  uma.can_export,
  uma.assigned_by,
  uma.assigned_at,
  uma.valid_until
FROM user_assigned_modules uma
JOIN modules m ON uma.module_id = m.id
JOIN module_categories mc ON m.category_id = mc.id

UNION ALL

SELECT 
  uac.user_id,
  m.id AS module_id,
  m.name AS module_name,
  m.slug AS module_slug,
  mc.id AS category_id,
  mc.name AS category_name,
  'category' AS assignment_type,
  uac.default_can_read AS can_read,
  uac.default_can_write AS can_write,
  uac.default_can_delete AS can_delete,
  uac.default_can_export AS can_export,
  uac.assigned_by,
  uac.assigned_at,
  uac.valid_until
FROM user_assigned_categories uac
JOIN module_categories mc ON uac.category_id = mc.id
JOIN modules m ON m.category_id = mc.id;
```

#### **4. `user_assigned_modules`** (Assignations directes)
```sql
CREATE TABLE user_assigned_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(user_id, module_id)
);
```

#### **5. `user_assigned_categories`** (Assignations par catégorie)
```sql
CREATE TABLE user_assigned_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES module_categories(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  default_can_read BOOLEAN DEFAULT true,
  default_can_write BOOLEAN DEFAULT false,
  default_can_delete BOOLEAN DEFAULT false,
  default_can_export BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(user_id, category_id)
);
```

### **Fonctions PostgreSQL (RPC)** :

#### **1. `assign_module_to_user`**
```sql
CREATE OR REPLACE FUNCTION assign_module_to_user(
  p_user_id UUID,
  p_module_id UUID,
  p_assigned_by UUID,
  p_can_read BOOLEAN DEFAULT true,
  p_can_write BOOLEAN DEFAULT false,
  p_can_delete BOOLEAN DEFAULT false,
  p_can_export BOOLEAN DEFAULT false,
  p_valid_until TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Vérifier si déjà assigné
  IF EXISTS (
    SELECT 1 FROM user_assigned_modules 
    WHERE user_id = p_user_id AND module_id = p_module_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Module déjà assigné à cet utilisateur'
    );
  END IF;

  -- Insérer l'assignation
  INSERT INTO user_assigned_modules (
    user_id, module_id, assigned_by,
    can_read, can_write, can_delete, can_export,
    valid_until, notes
  ) VALUES (
    p_user_id, p_module_id, p_assigned_by,
    p_can_read, p_can_write, p_can_delete, p_can_export,
    p_valid_until, p_notes
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Module assigné avec succès'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **2. `revoke_module_from_user`**
```sql
CREATE OR REPLACE FUNCTION revoke_module_from_user(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS JSON AS $$
BEGIN
  DELETE FROM user_assigned_modules
  WHERE user_id = p_user_id AND module_id = p_module_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Assignation non trouvée'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Module révoqué avec succès'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Interface utilisateur (Dialog)** :

Le composant `UserModulesDialog` offre :

1. **Recherche de modules** :
   - Barre de recherche en temps réel
   - Filtrage par nom, description ou catégorie

2. **Permissions granulaires** :
   - 📖 **Lecture** : Voir les données
   - ✏️ **Écriture** : Créer/modifier
   - 🗑️ **Suppression** : Supprimer
   - 📥 **Export** : Exporter les données

3. **Sélection multiple** :
   - Bouton "Tout sélectionner"
   - Bouton "Tout désélectionner"
   - Checkbox par module

4. **Indicateurs visuels** :
   - ✅ Modules déjà assignés (en bleu, non modifiables)
   - 🟢 Modules sélectionnés (en vert)
   - ⚪ Modules disponibles (en gris)

5. **Statistiques** :
   - Nombre de modules déjà assignés
   - Nombre de modules disponibles
   - Nombre de modules sélectionnés

### **Flux d'utilisation** :

```
1. Admin clique sur "Assigner modules" (⋮ → Assigner modules)
   ↓
2. Dialog s'ouvre avec la liste des modules disponibles
   ↓
3. Admin sélectionne les modules souhaités
   ↓
4. Admin définit les permissions (Lecture, Écriture, etc.)
   ↓
5. Admin clique sur "Assigner X module(s)"
   ↓
6. Système appelle `useAssignMultipleModules`
   ↓
7. Pour chaque module, appel RPC `assign_module_to_user`
   ↓
8. Résultat affiché : "X module(s) assigné(s) avec succès"
   ↓
9. Cache invalidé → Liste rafraîchie automatiquement
```

### **Vérification de l'état actuel** :

Pour vérifier si le système fonctionne :

1. **Vérifier les tables** :
   ```sql
   -- Modules disponibles
   SELECT * FROM modules;
   
   -- Catégories
   SELECT * FROM module_categories;
   
   -- Assignations
   SELECT * FROM user_assigned_modules;
   SELECT * FROM user_assigned_categories;
   
   -- Vue complète
   SELECT * FROM user_module_permissions WHERE user_id = 'USER_ID';
   ```

2. **Vérifier les fonctions RPC** :
   ```sql
   -- Tester l'assignation
   SELECT assign_module_to_user(
     'user_id',
     'module_id',
     'admin_id',
     true, false, false, false
   );
   ```

3. **Vérifier dans l'interface** :
   - Ouvrir le dialog "Assigner modules"
   - Vérifier que les modules s'affichent
   - Vérifier que les modules déjà assignés sont marqués
   - Tester l'assignation d'un nouveau module

---

## ✅ RÉSUMÉ

### **Réinitialiser MDP** :
- ✅ Envoie un email via Supabase Auth
- ✅ Lien de réinitialisation vers `/reset-password`
- ✅ Sécurisé et géré par Supabase

### **Assigner Modules** :
- ✅ Système complet avec permissions granulaires
- ✅ Assignation directe ou par catégorie
- ✅ Interface moderne avec recherche et sélection multiple
- ✅ Fonctions RPC PostgreSQL pour la logique métier
- ✅ Cache invalidé automatiquement

### **Points à vérifier** :
1. Les tables `modules`, `module_categories`, `user_assigned_modules`, `user_assigned_categories` existent
2. Les fonctions RPC `assign_module_to_user` et `revoke_module_from_user` existent
3. La vue `user_module_permissions` existe
4. Des modules sont créés dans la base de données
5. Le hook `useSchoolGroupModules` retourne bien les modules du groupe

---

## 🔧 PROCHAINES ÉTAPES

Si le système ne fonctionne pas, il faut :

1. **Créer les tables manquantes** (voir SQL ci-dessus)
2. **Créer les fonctions RPC** (voir SQL ci-dessus)
3. **Créer la vue** `user_module_permissions`
4. **Peupler la table `modules`** avec des modules de test
5. **Peupler la table `module_categories`** avec des catégories
6. **Tester l'assignation** via l'interface

---

**📝 Note** : Ce système est conçu pour être flexible et évolutif. Il permet une gestion fine des permissions et s'adapte à différents plans d'abonnement.
