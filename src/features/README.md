# 📁 Structure des Features - E-Pilot Congo

Cette structure organise l'application selon les niveaux d'accès et les responsabilités.

## 🏗️ Architecture par Niveaux

```
src/features/
├── super-admin/      ✅ Niveau 1 - Plateforme (11 items)
├── admin-groupe/     ✅ Niveau 2 - Réseau d'écoles (25 items)
├── user-space/       ✅ Niveau 3 - Personnel (58 items)
├── shared/           ✅ Composants partagés (181 items)
├── auth/             ✅ Authentification (8 items)
└── modules/          ✅ Modules métier (47 items)
```

## 📋 Description des Niveaux

### 🔴 Super Admin (Niveau 1)
**Responsabilité** : Gestion globale de la plateforme
- Dashboard plateforme
- Configuration système
- Analytiques globales
- Gestion des licences

### 🟡 Admin Groupe (Niveau 2)
**Responsabilité** : Gestion des réseaux d'écoles
- Dashboard groupe
- Gestion des écoles
- Analytiques du réseau
- Configuration du groupe

### 🟢 User Space (Niveau 3)
**Responsabilité** : Espace personnel/école
- Dashboard utilisateur
- Gestion quotidienne
- Modules spécifiques à l'école
- Interface utilisateur final

### 🔵 Shared
**Responsabilité** : Composants réutilisables
- Composants UI
- Services communs
- Types partagés
- Hooks utilitaires

### 🟣 Auth
**Responsabilité** : Authentification et autorisation
- Login/Logout
- Gestion des sessions
- Contrôle d'accès
- Sécurité

### 🟠 Modules
**Responsabilité** : Modules métier spécialisés
- Gestion des élèves
- Comptabilité
- Emploi du temps
- Communications

## 🎯 Conventions de Nommage

### Dossiers
- `components/` : Composants React
- `services/` : Services et API calls
- `types/` : Types TypeScript
- `hooks/` : Hooks personnalisés
- `utils/` : Fonctions utilitaires

### Fichiers
- `index.ts` : Point d'entrée du module
- `*.component.tsx` : Composants React
- `*.service.ts` : Services
- `*.types.ts` : Définitions de types
- `*.hook.ts` : Hooks personnalisés

## 🔄 Imports

### Import depuis un autre niveau
```typescript
// ✅ Correct - Import depuis shared
import { Button } from '@/features/shared';

// ✅ Correct - Import depuis auth
import { useAuth } from '@/features/auth';

// ❌ Éviter - Import circulaire entre niveaux
import { UserComponent } from '@/features/user-space';
```

### Import interne
```typescript
// ✅ Correct - Import relatif dans le même module
import { UserService } from './services/userService';
```

## 📊 Métriques de Complexité

| Niveau | Composants | Services | Types | Hooks | Total |
|--------|------------|----------|-------|-------|-------|
| Super Admin | 4 | 2 | 2 | 2 | 11 |
| Admin Groupe | 8 | 4 | 4 | 4 | 25 |
| User Space | 20 | 15 | 12 | 11 | 58 |
| Shared | 50 | 20 | 15 | 25 | 181 |
| Auth | 3 | 2 | 2 | 1 | 8 |
| Modules | 15 | 12 | 10 | 10 | 47 |

## 🚀 Migration

Cette structure remplace l'ancienne organisation pour :
- ✅ Meilleure séparation des responsabilités
- ✅ Code plus maintenable
- ✅ Réutilisabilité accrue
- ✅ Navigation plus intuitive
- ✅ Évolutivité améliorée
