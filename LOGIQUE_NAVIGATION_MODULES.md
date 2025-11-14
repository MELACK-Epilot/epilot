# 🎯 LOGIQUE COMPLÈTE DE NAVIGATION DES MODULES

## 📋 **FLUX COMPLET DU SYSTÈME**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SUPER ADMIN E-PILOT                                      │
│    - Crée les Catégories Métiers (8 catégories)            │
│    - Crée les Modules (50 fonctionnalités)                 │
│    - Définit les Plans d'abonnement                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. AFFECTATION SELON ABONNEMENT                             │
│    - plan_modules définit quels modules par plan            │
│    - group_module_configs active modules pour groupe        │
│    - Fonction RPC: get_available_modules_for_group()       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ADMIN GROUPE ASSIGNE                                     │
│    - Voit UNIQUEMENT modules de son plan                    │
│    - Assigne modules aux utilisateurs (Proviseur, CPE...)  │
│    - Fonction RPC: assign_module_with_validation()         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UTILISATEUR VOIT SES MODULES                             │
│    - Interface: MyModulesProviseurModern                    │
│    - Cards clickables avec icônes                           │
│    - Filtrables par catégorie, recherche                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CLIC SUR MODULE CARD ⭐ POINT CRITIQUE                   │
│    - Récupère: module.slug, user.school_group_id,          │
│                user.school_id, user.role                    │
│    - Navigate vers: /modules/{slug}                         │
│    - Passe le contexte automatiquement                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. ESPACE DE TRAVAIL SPÉCIFIQUE                             │
│    - Reconnaît automatiquement le groupe scolaire           │
│    - Reconnaît automatiquement l'école                      │
│    - Charge les données filtrées par école                  │
│    - Utilisateur travaille dans SON contexte                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 **POINT CRITIQUE : RECONNAISSANCE AUTOMATIQUE DU CONTEXTE**

### **Données Utilisateur Nécessaires**

```typescript
interface UserContext {
  id: string;                    // ID utilisateur
  role: string;                  // proviseur, cpe, comptable...
  school_id: string;             // ⭐ ID de l'école
  school_group_id: string;       // ⭐ ID du groupe scolaire
  firstName: string;
  lastName: string;
  email: string;
}
```

### **Données Module Nécessaires**

```typescript
interface ModuleContext {
  id: string;                    // ID du module
  slug: string;                  // ⭐ 'gestion-classes', 'notes-evaluations'...
  name: string;                  // Nom affiché
  category_id: string;           // Catégorie métier
}
```

---

## 🚀 **IMPLÉMENTATION DE LA NAVIGATION**

### **1. Fonction de Navigation avec Contexte**

```typescript
// src/features/user-space/utils/module-navigation.ts

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/auth.store';
import type { ModuleEnrichi } from '../types/proviseur-modules.types';

/**
 * Hook pour naviguer vers un module avec contexte automatique
 */
export function useModuleNavigation() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigateToModule = async (module: ModuleEnrichi) => {
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return;
    }

    // Vérifier que l'utilisateur a les infos nécessaires
    if (!user.school_id || !user.school_group_id) {
      console.error('❌ Contexte utilisateur incomplet', {
        school_id: user.school_id,
        school_group_id: user.school_group_id,
      });
      return;
    }

    // Incrémenter le compteur d'accès
    await incrementModuleAccess(module.id, user.id);

    // Construire l'URL avec le contexte
    const moduleUrl = `/modules/${module.slug}`;
    
    // Naviguer avec le state pour passer le contexte
    navigate(moduleUrl, {
      state: {
        moduleId: module.id,
        moduleName: module.name,
        userId: user.id,
        userRole: user.role,
        schoolId: user.school_id,           // ⭐ Contexte école
        schoolGroupId: user.school_group_id, // ⭐ Contexte groupe
        categoryId: module.category_id,
      },
    });

    console.log('✅ Navigation vers module:', {
      module: module.name,
      slug: module.slug,
      école: user.school_id,
      groupe: user.school_group_id,
    });
  };

  return { navigateToModule };
}

/**
 * Incrémenter le compteur d'accès au module
 */
async function incrementModuleAccess(moduleId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('user_modules')
      .update({
        access_count: supabase.raw('access_count + 1'),
        last_accessed_at: new Date().toISOString(),
      })
      .eq('module_id', moduleId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur incrémentation accès:', error);
  }
}
```

---

### **2. Mise à Jour du handleModuleClick**

```typescript
// src/features/user-space/pages/MyModulesProviseurModern.tsx

import { useModuleNavigation } from '../utils/module-navigation';

export default function MyModulesProviseurModern() {
  const { user } = useAuth();
  const { modules, isLoading, error } = useProviseurModules();
  const { navigateToModule } = useModuleNavigation(); // ⭐ Hook de navigation
  
  // ... reste du code ...

  // Gérer le clic sur un module
  const handleModuleClick = (module: ModuleEnrichi) => {
    navigateToModule(module); // ⭐ Navigation avec contexte automatique
  };

  // ... reste du code ...
}
```

---

### **3. Route du Module avec Contexte**

```typescript
// src/routes/module-routes.tsx

import { Route } from 'react-router-dom';
import { ModuleWorkspace } from '@/features/modules/pages/ModuleWorkspace';

export const moduleRoutes = (
  <>
    {/* Route dynamique pour tous les modules */}
    <Route path="/modules/:moduleSlug" element={<ModuleWorkspace />} />
  </>
);
```

---

### **4. Composant Espace de Travail du Module**

```typescript
// src/features/modules/pages/ModuleWorkspace.tsx

import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ModuleContextState {
  moduleId: string;
  moduleName: string;
  userId: string;
  userRole: string;
  schoolId: string;           // ⭐ Contexte école
  schoolGroupId: string;      // ⭐ Contexte groupe
  categoryId: string;
}

export function ModuleWorkspace() {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const location = useLocation();
  const context = location.state as ModuleContextState;

  const [moduleData, setModuleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!context) {
      console.error('❌ Contexte manquant');
      return;
    }

    loadModuleData();
  }, [moduleSlug, context]);

  const loadModuleData = async () => {
    try {
      console.log('🔍 Chargement module avec contexte:', {
        slug: moduleSlug,
        école: context.schoolId,
        groupe: context.schoolGroupId,
      });

      // ⭐ Charger les données FILTRÉES par école
      const { data, error } = await supabase
        .from('module_specific_data') // Table spécifique au module
        .select('*')
        .eq('school_id', context.schoolId)           // ⭐ Filtre école
        .eq('school_group_id', context.schoolGroupId); // ⭐ Filtre groupe

      if (error) throw error;

      setModuleData(data);
      console.log('✅ Données chargées pour école:', context.schoolId);
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="p-6">
      <h1>{context.moduleName}</h1>
      <p>École: {context.schoolId}</p>
      <p>Groupe: {context.schoolGroupId}</p>
      
      {/* ⭐ Composant spécifique selon le slug du module */}
      {moduleSlug === 'gestion-classes' && <GestionClassesModule data={moduleData} context={context} />}
      {moduleSlug === 'notes-evaluations' && <NotesEvaluationsModule data={moduleData} context={context} />}
      {moduleSlug === 'emplois-du-temps' && <EmploisDuTempsModule data={moduleData} context={context} />}
      {/* ... autres modules ... */}
    </div>
  );
}
```

---

## 🔒 **SÉCURITÉ : RLS AUTOMATIQUE**

Les données sont **automatiquement filtrées** par RLS :

```sql
-- Policy sur les tables de données des modules
CREATE POLICY "users_access_own_school_data"
ON module_specific_data
FOR SELECT
USING (
  school_id IN (
    SELECT school_id 
    FROM users 
    WHERE id = auth.uid()
  )
);
```

---

## 📊 **EXEMPLE CONCRET**

### **Scénario : Proviseur Orel clique sur "Gestion Classes"**

```
1. Proviseur Orel clique sur card "Gestion Classes"
   ↓
2. handleModuleClick() appelé avec module
   ↓
3. navigateToModule() récupère contexte:
   - user.school_id = "école-123"
   - user.school_group_id = "groupe-456"
   - module.slug = "gestion-classes"
   ↓
4. Navigation vers: /modules/gestion-classes
   State passé: {
     schoolId: "école-123",
     schoolGroupId: "groupe-456",
     ...
   }
   ↓
5. ModuleWorkspace charge les données:
   SELECT * FROM classes
   WHERE school_id = "école-123"
   AND school_group_id = "groupe-456"
   ↓
6. Proviseur Orel voit UNIQUEMENT les classes de SON école
   ✅ Contexte automatiquement reconnu
   ✅ Données filtrées
   ✅ Sécurité RLS active
```

---

## ✅ **CHECKLIST D'IMPLÉMENTATION**

### **Backend**
- [x] RLS policies sur toutes les tables de modules
- [x] Filtrage automatique par school_id
- [x] Filtrage automatique par school_group_id
- [ ] Fonction RPC pour incrémenter access_count

### **Frontend**
- [ ] Créer `module-navigation.ts` (hook de navigation)
- [ ] Mettre à jour `handleModuleClick` dans MyModulesProviseurModern
- [ ] Créer `ModuleWorkspace.tsx` (composant générique)
- [ ] Créer composants spécifiques par module (GestionClassesModule, etc.)
- [ ] Ajouter routes dynamiques `/modules/:slug`

### **Sécurité**
- [x] RLS activé
- [x] Contexte utilisateur vérifié
- [ ] Validation du module assigné avant accès
- [ ] Logs d'accès pour audit

---

## 🎯 **PROCHAINES ÉTAPES**

1. **Créer le hook de navigation** avec contexte automatique
2. **Créer ModuleWorkspace** générique
3. **Créer les composants spécifiques** pour chaque module
4. **Tester le flux complet** de bout en bout

---

## 🏆 **RÉSULTAT ATTENDU**

✅ **Utilisateur clique** sur module card  
✅ **Système reconnaît** automatiquement école + groupe  
✅ **Données chargées** filtrées par contexte  
✅ **Utilisateur travaille** dans SON espace  
✅ **Sécurité garantie** par RLS  

**Le système est INTELLIGENT et CONTEXTUEL ! 🎉🚀✨**
