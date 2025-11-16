# ✅ PROTECTION PAR MODULES - SYSTÈME COMPLET

## 🎯 LOGIQUE MÉTIER E-PILOT

### Hiérarchie et Assignation des Modules

```
SUPER ADMIN (Plateforme E-Pilot)
    ↓ crée
MODULES (50 modules pédagogiques)
    ↓ inclus dans
PLANS D'ABONNEMENT (Gratuit → Institutionnel)
    ↓ souscrit par
ADMIN DE GROUPE (Réseau d'écoles)
    ↓ assigne selon rôle
PROVISEUR/DIRECTEUR (Une école)
    ↓ accède uniquement à
MODULES ASSIGNÉS
```

### 🔑 Règles d'Accès

1. **Admin de Groupe** voit les modules selon son PLAN d'abonnement
2. **Admin de Groupe** assigne les modules aux utilisateurs selon leur RÔLE
3. **Proviseur** accède UNIQUEMENT aux modules qui lui sont assignés
4. **Pas d'assignation** = **Pas d'accès**

---

## 🛡️ PROTECTION DES ROUTES

### Système de Double Protection

```tsx
<ProtectedRoute roles={['proviseur', 'directeur']}>
  <ProtectedModuleRoute moduleSlug="personnel">
    <StaffManagementPage />
  </ProtectedModuleRoute>
</ProtectedRoute>
```

**Niveau 1** : `ProtectedRoute` - Vérifie le RÔLE  
**Niveau 2** : `ProtectedModuleRoute` - Vérifie le MODULE assigné

---

## 📋 ROUTES PROTÉGÉES PAR MODULES

### 1. Gestion du Personnel
```tsx
<Route path="staff-management" element={
  <ProtectedRoute roles={['proviseur', 'directeur', 'directeur_etudes', 'admin_groupe']}>
    <ProtectedModuleRoute moduleSlug="personnel">
      <StaffManagementPage />
    </ProtectedModuleRoute>
  </ProtectedRoute>
} />
```

**Module requis**: `personnel`  
**Rôles autorisés**: Proviseur, Directeur, Directeur d'études, Admin Groupe  
**Condition**: Le module "personnel" doit être assigné par l'Admin de Groupe

---

### 2. Gestion des Classes
```tsx
<Route path="classes-management" element={
  <ProtectedRoute roles={['proviseur', 'directeur', 'directeur_etudes', 'admin_groupe']}>
    <ProtectedModuleRoute moduleSlug="classes">
      <ClassesManagementPage />
    </ProtectedModuleRoute>
  </ProtectedRoute>
} />
```

**Module requis**: `classes`  
**Rôles autorisés**: Proviseur, Directeur, Directeur d'études, Admin Groupe  
**Condition**: Le module "classes" doit être assigné

---

### 3. Rapports et Documents
```tsx
<Route path="reports-management" element={
  <ProtectedRoute roles={['proviseur', 'directeur', 'directeur_etudes', 'admin_groupe']}>
    <ProtectedModuleRoute moduleSlug="rapports">
      <SchoolReportsPage />
    </ProtectedModuleRoute>
  </ProtectedRoute>
} />
```

**Module requis**: `rapports`  
**Rôles autorisés**: Proviseur, Directeur, Directeur d'études, Admin Groupe  
**Condition**: Le module "rapports" doit être assigné

---

### 4. Statistiques Avancées
```tsx
<Route path="advanced-stats" element={
  <ProtectedRoute roles={['proviseur', 'directeur', 'directeur_etudes', 'admin_groupe']}>
    <ProtectedModuleRoute moduleSlug="statistiques">
      <AdvancedStatsPage />
    </ProtectedModuleRoute>
  </ProtectedRoute>
} />
```

**Module requis**: `statistiques`  
**Rôles autorisés**: Proviseur, Directeur, Directeur d'études, Admin Groupe  
**Condition**: Le module "statistiques" doit être assigné

---

## 🔒 COMPOSANT ProtectedModuleRoute

### Fonctionnement

```tsx
export const ProtectedModuleRoute = ({
  moduleSlug,
  children,
  redirectTo,
  customMessage,
}: ProtectedModuleRouteProps) => {
  const hasModule = useHasModuleRT(moduleSlug);

  // Si le module n'est pas assigné
  if (!hasModule) {
    // Affiche un message élégant
    return <AccessDeniedScreen />;
  }

  // Si autorisé, afficher le contenu
  return <>{children}</>;
};
```

### Hook `useHasModuleRT`

Vérifie en temps réel si l'utilisateur a accès au module :

```tsx
const hasModule = useHasModuleRT('personnel');
// true si assigné, false sinon
```

---

## 🎨 ÉCRAN D'ACCÈS REFUSÉ

### Message Élégant

Lorsqu'un utilisateur tente d'accéder à une page sans le module assigné :

```
┌─────────────────────────────────────┐
│         🔒 Module non accessible     │
│                                      │
│  Le module "personnel" ne vous a    │
│  pas été assigné.                    │
│                                      │
│  Contactez votre administrateur de   │
│  groupe pour obtenir l'accès.        │
│                                      │
│  [Retour au tableau de bord]         │
│  [Voir mes modules]                  │
└─────────────────────────────────────┘
```

### Informations Affichées

- ✅ Nom du module manquant
- ✅ Message explicatif
- ✅ Instructions pour obtenir l'accès
- ✅ Boutons de navigation

---

## 🔄 FLUX D'ASSIGNATION

### Étape 1: Admin de Groupe assigne le module

```sql
INSERT INTO user_modules (user_id, module_id, is_enabled)
VALUES ('proviseur-id', 'module-personnel-id', true);
```

### Étape 2: Proviseur peut maintenant accéder

```tsx
// Avant assignation
hasModule('personnel') → false
// Page bloquée avec message

// Après assignation
hasModule('personnel') → true
// Page accessible
```

### Étape 3: Synchronisation temps réel

Le système utilise **Supabase Realtime** pour mettre à jour les permissions instantanément :

```tsx
// Écoute des changements sur user_modules
supabase
  .channel('user_modules_changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'user_modules' 
  }, (payload) => {
    // Mise à jour automatique des permissions
    refreshUserModules();
  })
  .subscribe();
```

---

## 📊 EXEMPLES DE MODULES

### Modules Courants

| Module | Slug | Description |
|--------|------|-------------|
| Personnel | `personnel` | Gestion des enseignants et staff |
| Classes | `classes` | Gestion des classes et emplois du temps |
| Élèves | `eleves` | Gestion des élèves et inscriptions |
| Finances | `finances` | Comptabilité et paiements |
| Rapports | `rapports` | Génération de rapports |
| Statistiques | `statistiques` | Tableaux de bord et analytics |
| Communication | `communication` | Messagerie et notifications |
| Bibliothèque | `bibliotheque` | Gestion de la bibliothèque |

---

## 🎯 SCÉNARIOS D'UTILISATION

### Scénario 1: Proviseur avec module Personnel

```
1. Admin de Groupe assigne "personnel" au Proviseur
2. Proviseur se connecte
3. Proviseur clique sur "Gestion du Personnel"
4. ✅ Page StaffManagementPage s'affiche
5. Proviseur peut gérer son personnel
```

### Scénario 2: Proviseur SANS module Personnel

```
1. Admin de Groupe n'a PAS assigné "personnel"
2. Proviseur se connecte
3. Proviseur clique sur "Gestion du Personnel"
4. ❌ Message "Module non accessible"
5. Proviseur contacte l'Admin de Groupe
6. Admin assigne le module
7. ✅ Accès immédiat (temps réel)
```

### Scénario 3: Navigation depuis EstablishmentPage

```tsx
// Dans EstablishmentPage
const handleViewStaff = () => {
  navigate('/user/staff-management');
};

// Si module "personnel" assigné
→ StaffManagementPage s'affiche

// Si module "personnel" NON assigné
→ Écran "Module non accessible"
```

---

## 🔧 CONFIGURATION ADMIN DE GROUPE

### Page d'Assignation des Modules

L'Admin de Groupe peut assigner les modules depuis :

```
/dashboard/assign-modules
```

**Fonctionnalités** :
- ✅ Voir tous les utilisateurs de son groupe
- ✅ Voir les modules disponibles selon son plan
- ✅ Assigner/Retirer des modules par utilisateur
- ✅ Assigner des modules par rôle (en masse)
- ✅ Voir l'historique des assignations

---

## 📱 INTERFACE UTILISATEUR

### Page "Mes Modules"

Le Proviseur peut voir ses modules assignés :

```
/user/modules
```

**Affichage** :
```
┌─────────────────────────────────────┐
│         📚 Mes Modules               │
│                                      │
│  ✅ Personnel (Actif)                │
│  ✅ Classes (Actif)                  │
│  ✅ Élèves (Actif)                   │
│  ❌ Finances (Non assigné)           │
│  ❌ Bibliothèque (Non assigné)       │
│                                      │
│  Vous avez accès à 3 modules sur 5   │
└─────────────────────────────────────┘
```

---

## ✅ AVANTAGES DU SYSTÈME

### 1. Sécurité
- ✅ Double protection (Rôle + Module)
- ✅ Vérification côté serveur (RLS Supabase)
- ✅ Pas de contournement possible

### 2. Flexibilité
- ✅ Admin de Groupe contrôle les accès
- ✅ Assignation granulaire par utilisateur
- ✅ Changements en temps réel

### 3. Expérience Utilisateur
- ✅ Messages clairs et explicatifs
- ✅ Navigation intuitive
- ✅ Pas de pages cassées

### 4. Monétisation
- ✅ Modules liés aux plans d'abonnement
- ✅ Upsell naturel (modules premium)
- ✅ Contrôle des fonctionnalités

---

## 🎉 RÉSUMÉ

**Le système de protection par modules est maintenant complet !**

### Ce qui fonctionne :
✅ **Double protection** : Rôle + Module assigné  
✅ **Routes sécurisées** : Toutes les pages protégées  
✅ **Messages élégants** : Écrans d'accès refusé clairs  
✅ **Temps réel** : Synchronisation instantanée  
✅ **Logique métier** : Respecte la hiérarchie E-Pilot  
✅ **Flexibilité** : Admin de Groupe contrôle tout  

### Flux complet :
```
ADMIN DE GROUPE
    ↓ assigne modules
PROVISEUR
    ↓ tente d'accéder
VÉRIFICATION
    ├─→ Module assigné ? ✅ → Page affichée
    └─→ Module non assigné ? ❌ → Message d'erreur
```

**Le Proviseur ne peut accéder qu'aux modules que l'Admin de Groupe lui a assignés ! 🎊**
