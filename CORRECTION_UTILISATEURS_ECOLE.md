# CORRECTION - UTILISATEURS D'ECOLE VISIBLES

## PROBLEME IDENTIFIE

Les utilisateurs d'ecole (Proviseurs Directeurs Enseignants CPE Comptables) n'apparaissaient PAS dans la page Assigner des Modules

## CAUSE

Hook useUsers ligne 80 filtrait uniquement super_admin et admin_groupe

## CORRECTION APPLIQUEE

### Fichier 1: useUsers.ts ligne 74-84

AVANT:
```typescript
if (filters?.schoolGroupId) {
  query = query.eq('school_group_id', filters.schoolGroupId);
} else {
  query = query.in('role', ['super_admin', 'admin_groupe']);
}
```

APRES:
```typescript
if (filters?.schoolGroupId) {
  // Admin Groupe : Voir TOUS les utilisateurs de son groupe
  // (Admin Groupe, Proviseurs, Directeurs, Enseignants, CPE, Comptables, etc.)
  // MAIS exclure le Super Admin (qui ne fait pas partie du groupe)
  query = query
    .eq('school_group_id', filters.schoolGroupId)
    .neq('role', 'super_admin');
} else {
  // Super Admin : Voir Super Admin ET Admin Groupe uniquement
  query = query.in('role', ['super_admin', 'admin_groupe']);
}
```

### Fichier 2: AssignModulesV2.tsx ligne 38-40

AVANT:
```typescript
const { data: usersData, isLoading: usersLoading } = useUsers();
```

APRES:
```typescript
const { user } = useAuth();

const { data: usersData, isLoading: usersLoading } = useUsers({
  schoolGroupId: user?.schoolGroupId,
});
```

## RESULTAT

Admin Groupe voit maintenant TOUS les utilisateurs de son groupe
- Admin Groupe
- Proviseurs avec nom ecole
- Directeurs avec nom ecole
- Enseignants avec nom ecole
- CPE avec nom ecole
- Comptables avec nom ecole
- Tous les autres roles

Super Admin reste EXCLU (ne fait pas partie du groupe)

## LOGIQUE FINALE

### Admin Groupe
- Voit TOUS les utilisateurs de SON groupe scolaire
- Peut assigner modules a tous
- Ne voit PAS le Super Admin
- Ne voit PAS les utilisateurs d'autres groupes

### Super Admin
- Voit uniquement Super Admin et Admin Groupe
- Gere les abonnements pas les modules
- N'apparait PAS dans liste Admin Groupe

Date 6 Novembre 2025
Status CORRIGE
Impact MAJEUR
