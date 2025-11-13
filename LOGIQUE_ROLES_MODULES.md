# LOGIQUE DES ROLES - ASSIGNATION MODULES

## RAPPEL IMPORTANT

### SUPER ADMIN E-PILOT
- Role: super_admin
- Responsabilite: Gerer les ABONNEMENTS des groupes scolaires
- Acces: Plateforme globale E-Pilot
- NE FAIT PAS PARTIE des groupes scolaires
- NE DOIT PAS apparaitre dans la page Assigner des Modules

### ADMIN GROUPE
- Role: admin_groupe
- Responsabilite: Assigner les MODULES aux utilisateurs de SON groupe
- Acces: Son groupe scolaire uniquement
- Peut voir: Tous les utilisateurs de son groupe SAUF le Super Admin

### AUTRES ROLES
- Proviseur Directeur Enseignant CPE Comptable etc
- Font partie du groupe scolaire
- Peuvent recevoir des modules assignes par Admin Groupe

## CORRECTION APPLIQUEE

Fichier: src/features/dashboard/pages/AssignModules.tsx

AVANT (ERREUR):
- Affichait TOUS les utilisateurs y compris Super Admin
- Super Admin visible dans liste Admin Groupe

APRES (CORRECT):
- Filtre qui EXCLUT role super_admin
- Super Admin ne peut pas recevoir de modules via Admin Groupe
- Seuls les utilisateurs du groupe scolaire sont visibles

Code:
```typescript
if (user.role === 'super_admin') {
  return false; // EXCLURE
}
```

## HIERARCHIE CORRECTE

```
SUPER ADMIN E-PILOT
  |
  | Gere abonnements
  |
  v
GROUPE SCOLAIRE (Plan: Premium/Pro/etc)
  |
  | Admin Groupe assigne modules
  |
  v
UTILISATEURS DU GROUPE
  - Admin Groupe
  - Proviseurs
  - Directeurs
  - Enseignants
  - CPE
  - Comptables
  - etc.
```

## FLUX CORRECT

1. Super Admin cree groupe scolaire
2. Super Admin definit plan abonnement (Premium/Pro)
3. Plan determine modules disponibles
4. Admin Groupe assigne modules aux utilisateurs
5. Super Admin ne recoit JAMAIS de modules

## RESULTAT

- Super Admin invisible dans page Assigner Modules
- Admin Groupe voit uniquement son equipe
- Logique metier respectee
- Separation des responsabilites claire

Date: 6 Novembre 2025
Status: CORRIGE
