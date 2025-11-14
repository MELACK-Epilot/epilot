# 🚀 SCRIPT DE DÉPLOIEMENT AUTOMATISÉ - E-Pilot

## 📋 **CHECKLIST COMPLÈTE DE DÉPLOIEMENT**

### ✅ **ÉTAPE 1 : EXÉCUTION SQL (5 minutes)**

#### **1.1 Ouvrir Supabase SQL Editor**
- Aller sur [supabase.com](https://supabase.com)
- Sélectionner le projet E-Pilot
- Cliquer sur "SQL Editor"

#### **1.2 Exécuter les Fonctions SQL**
```sql
-- COPIER ET COLLER CE CODE COMPLET DANS SUPABASE :

-- Fonction compatible avec la structure existante user_modules
CREATE OR REPLACE FUNCTION assign_modules_by_role_compatible(
  p_user_id UUID,
  p_user_role TEXT,
  p_school_group_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_assigned_count INTEGER := 0;
  v_available_modules RECORD;
  v_current_user_id UUID;
BEGIN
  -- Récupérer l'utilisateur actuel pour assigned_by
  SELECT auth.uid() INTO v_current_user_id;
  
  -- Supprimer les anciennes assignations automatiques pour éviter les doublons
  DELETE FROM user_modules 
  WHERE user_id = p_user_id 
    AND assigned_by IS NULL; -- Marqueur pour assignations automatiques

  -- Assigner les modules selon le rôle
  FOR v_available_modules IN
    SELECT DISTINCT
      m.id as module_id,
      m.name as module_name,
      m.slug as module_slug
    FROM modules m
    LEFT JOIN group_module_configs gmc ON gmc.module_id = m.id AND gmc.school_group_id = p_school_group_id
    WHERE 
      m.status = 'active'
      AND (
        -- Proviseur a accès aux modules éducatifs et administratifs de base
        (p_user_role = 'proviseur' AND m.slug IN (
          'dashboard', 'classes', 'eleves', 'personnel', 'rapports', 'communication',
          'emploi-temps', 'notes', 'absences', 'discipline'
        ))
        OR
        -- Directeur a accès aux modules éducatifs
        (p_user_role IN ('directeur', 'directeur_etudes') AND m.slug IN (
          'dashboard', 'classes', 'eleves', 'emploi-temps', 'notes', 'rapports',
          'communication', 'ressources'
        ))
        OR
        -- Enseignant a accès aux modules pédagogiques
        (p_user_role = 'enseignant' AND m.slug IN (
          'dashboard', 'mes-classes', 'notes', 'emploi-temps', 'ressources',
          'communication'
        ))
        OR
        -- Admin groupe a accès aux modules de son groupe
        (p_user_role = 'admin_groupe' AND (gmc.is_enabled = true OR gmc.is_enabled IS NULL))
        OR
        -- Super admin a accès à tous les modules
        p_user_role = 'SUPER_ADMIN'
      )
  LOOP
    -- Insérer dans user_modules avec la structure existante
    INSERT INTO user_modules (
      user_id,
      module_id,
      is_enabled,
      assigned_at,
      assigned_by,
      settings
    ) VALUES (
      p_user_id,
      v_available_modules.module_id,
      true,
      NOW(),
      NULL, -- NULL indique une assignation automatique par rôle
      jsonb_build_object(
        'auto_assigned', true,
        'role', p_user_role,
        'assigned_at', NOW()
      )
    )
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      is_enabled = true,
      assigned_at = NOW(),
      settings = EXCLUDED.settings;

    v_assigned_count := v_assigned_count + 1;
  END LOOP;

  -- Construire le résultat
  v_result := json_build_object(
    'success', true,
    'user_id', p_user_id,
    'role', p_user_role,
    'assigned_modules_count', v_assigned_count,
    'message', format('Assigné %s modules par défaut pour le rôle %s', v_assigned_count, p_user_role)
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, retourner les détails
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'user_id', p_user_id,
    'role', p_user_role
  );
END;
$$;

-- Fonction pour réassigner manuellement les modules d'un utilisateur
CREATE OR REPLACE FUNCTION reassign_user_modules_compatible(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_result JSON;
BEGIN
  -- Récupérer les infos utilisateur depuis users ou profiles
  SELECT id, role, school_group_id 
  INTO v_user
  FROM users 
  WHERE id = p_user_id;

  -- Si pas trouvé dans users, essayer profiles
  IF NOT FOUND THEN
    SELECT id, role, school_group_id 
    INTO v_user
    FROM profiles 
    WHERE id = p_user_id;
  END IF;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  -- Réassigner les modules
  SELECT assign_modules_by_role_compatible(v_user.id, v_user.role, v_user.school_group_id)
  INTO v_result;

  RETURN v_result;
END;
$$;
```

#### **1.3 Vérifier l'Exécution**
- ✅ Aucune erreur affichée
- ✅ Message "Success" visible

---

### ✅ **ÉTAPE 2 : ASSIGNER LES MODULES AU PROVISEUR (2 minutes)**

#### **2.1 Identifier l'ID Utilisateur**
Dans Supabase, aller dans "Table Editor" → "users" ou "profiles" et copier l'ID de l'utilisateur Orel DEBA.

#### **2.2 Exécuter l'Assignation**
```sql
-- Remplacer 'USER_ID_ICI' par l'ID réel de Orel DEBA
SELECT assign_modules_by_role_compatible(
  'USER_ID_ICI'::UUID,
  'proviseur',
  '91442ccd-663a-4732-a521-edcc2423a012'::UUID
);
```

#### **2.3 Vérifier le Résultat**
Le résultat doit afficher :
```json
{
  "success": true,
  "user_id": "...",
  "role": "proviseur",
  "assigned_modules_count": 10,
  "message": "Assigné 10 modules par défaut pour le rôle proviseur"
}
```

---

### ✅ **ÉTAPE 3 : TESTER L'INTERFACE (3 minutes)**

#### **3.1 Rafraîchir l'Application**
- Actualiser la page E-Pilot (F5)
- Se reconnecter si nécessaire

#### **3.2 Naviguer vers "Mes Modules"**
- Cliquer sur "Mes Modules" dans le menu
- Vérifier que la nouvelle interface s'affiche

#### **3.3 Validation Visuelle**
✅ **Attendu :**
- Titre : "Mes Modules - Proviseur"
- Nombre de modules : 10
- Modules visibles : Dashboard, Classes, Élèves, Personnel, Rapports, Communication, Emploi du temps, Notes, Absences, Discipline

❌ **Si problème :**
- Cliquer sur "Assigner Mes Modules"
- Attendre le message de succès
- Actualiser la page

---

## 🧪 **ÉTAPE 4 : TESTS DE VALIDATION (5 minutes)**

### **4.1 Test Console Navigateur**
Ouvrir la console (F12) et exécuter :
```javascript
// Test de cohérence
await testSystemeCompatible.checkDatabaseConsistency();

// Test spécifique Proviseur
await testSystemeCompatible.testAutoAssignmentCompatible('USER_ID_ICI');
```

### **4.2 Test Fonctionnel**
- ✅ Cliquer sur chaque module → Doit tracker l'accès
- ✅ Actualiser → Modules toujours visibles
- ✅ Compteur d'accès → Doit s'incrémenter

---

## 🎯 **RÉSULTATS ATTENDUS**

### **Interface Proviseur :**
| Élément | Attendu |
|---------|---------|
| Titre | "Mes Modules - Proviseur" |
| Nombre de modules | 10 |
| Statut | "Actif" |
| Modules visibles | Dashboard, Classes, Élèves, Personnel, Rapports, Communication, Emploi du temps, Notes, Absences, Discipline |

### **Fonctionnalités :**
- ✅ Assignation automatique
- ✅ Tracking des accès
- ✅ Temps réel
- ✅ Interface responsive

---

## 🚨 **RÉSOLUTION DE PROBLÈMES**

### **Problème 1 : "Aucun Module Assigné"**
**Solution :**
1. Vérifier que les fonctions SQL sont bien créées
2. Cliquer sur "Assigner Mes Modules"
3. Vérifier l'ID utilisateur dans la requête SQL

### **Problème 2 : "Erreur assignation"**
**Solution :**
1. Vérifier que la table `user_modules` existe
2. Vérifier que des modules existent dans la table `modules`
3. Vérifier les permissions Supabase

### **Problème 3 : "Interface debug au lieu de Proviseur"**
**Solution :**
1. Vérifier que `user.role === 'proviseur'`
2. Actualiser la page
3. Vérifier les logs console

---

## 📞 **SUPPORT IMMÉDIAT**

### **En cas de blocage :**
1. **Copier l'erreur exacte** affichée
2. **Faire une capture d'écran** de l'interface
3. **Vérifier les logs** dans la console navigateur (F12)
4. **Contacter l'équipe technique** avec ces éléments

### **Contacts :**
- 📧 Support technique : [email]
- 💬 Chat équipe : [lien]
- 📱 Urgence : [téléphone]

---

## 🎉 **VALIDATION FINALE**

### **Checklist de Succès :**
- [ ] Fonctions SQL exécutées sans erreur
- [ ] 10 modules assignés au Proviseur
- [ ] Interface "Mes Modules - Proviseur" affichée
- [ ] Modules cliquables et fonctionnels
- [ ] Tracking des accès opérationnel

### **Une fois validé :**
✅ **Le système est opérationnel !**
✅ **Le Proviseur voit ses modules !**
✅ **L'architecture est robuste et évolutive !**

---

**Temps total estimé : 15 minutes**
**Niveau de difficulté : Facile**
**Prérequis : Accès Supabase + Interface E-Pilot**

🚀 **Prêt pour la production !**
