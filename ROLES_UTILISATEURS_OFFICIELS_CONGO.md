# 🇨🇬 RÔLES UTILISATEURS OFFICIELS - E-PILOT CONGO

## 📋 Liste Complète et Définitive

### Rôles Implémentés (12 rôles)

| # | Rôle | Slug | Icône | Description |
|---|------|------|-------|-------------|
| 1 | **Proviseur** | `proviseur` | 🎓 | Responsable de l'établissement (Lycée) |
| 2 | **Directeur** | `directeur` | 👔 | Directeur de l'établissement (École/Collège) |
| 3 | **Directeur des Études** | `directeur_etudes` | 📋 | Responsable pédagogique et académique |
| 4 | **Secrétaire** | `secretaire` | 📝 | Gestion administrative et secrétariat |
| 5 | **Comptable** | `comptable` | 💰 | Gestion financière et comptabilité |
| 6 | **Enseignant** | `enseignant` | 👨‍🏫 | Personnel enseignant (toutes matières) |
| 7 | **Surveillant** | `surveillant` | 👮 | Surveillance et discipline |
| 8 | **Bibliothécaire** | `bibliothecaire` | 📚 | Gestion de la bibliothèque |
| 9 | **Élève** | `eleve` | 🎒 | Étudiant inscrit |
| 10 | **Parent** | `parent` | 👨‍👩‍👧‍👦 | Parent d'élève |
| 11 | **Gestionnaire de Cantine** | `gestionnaire_cantine` | 🍽️ | Gestion de la cantine scolaire |
| 12 | **Autre** | `autre` | 👤 | Autre personnel non catégorisé |

---

## 🏗️ Hiérarchie Complète du Système

```
┌─────────────────────────────────────────────────────────────┐
│ NIVEAU 1 : PLATEFORME                                       │
│ ─────────────────────────────────────────────────────────   │
│ • Super Admin E-Pilot                                       │
│   └─ Gère tous les groupes scolaires                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ NIVEAU 2 : GROUPE SCOLAIRE                                  │
│ ─────────────────────────────────────────────────────────   │
│ • Administrateur de Groupe                                  │
│   └─ Gère toutes les écoles de son groupe                   │
│   └─ Crée et gère tous les utilisateurs ci-dessous          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ NIVEAU 3 : ÉTABLISSEMENT (12 RÔLES)                         │
│ ─────────────────────────────────────────────────────────   │
│ 🎓 Proviseur              (Lycée)                           │
│ 👔 Directeur              (École/Collège)                   │
│ 📋 Directeur des Études   (Pédagogie)                       │
│ 📝 Secrétaire             (Administration)                  │
│ 💰 Comptable              (Finances)                        │
│ 👨‍🏫 Enseignant            (Enseignement)                    │
│ 👮 Surveillant            (Discipline)                      │
│ 📚 Bibliothécaire         (Bibliothèque)                    │
│ 🎒 Élève                  (Étudiant)                        │
│ 👨‍👩‍👧‍👦 Parent                (Famille)                       │
│ 🍽️ Gestionnaire Cantine  (Restauration)                    │
│ 👤 Autre                  (Divers)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Contexte d'Utilisation

### Qui crée ces utilisateurs ?
**L'Administrateur de Groupe** crée et gère tous ces rôles pour les écoles de son groupe.

### Où sont-ils créés ?
Dans la page **Utilisateurs** du dashboard Admin de Groupe :
- Menu : `⋮` → `Créer un utilisateur`
- Formulaire : `GroupUserFormDialog.tsx`

### Quels modules peuvent-ils recevoir ?
Chaque utilisateur peut se voir assigner des modules via :
- Menu : `⋮` → `📦 Assigner modules`
- Dialog : `UserModulesDialog.tsx`

---

## 📊 Répartition Typique dans une École

### Établissement Moyen (500 élèves)

| Rôle | Nombre Typique | % Total |
|------|----------------|---------|
| Élève | 500 | 85% |
| Parent | 500 | 85% |
| Enseignant | 30 | 5% |
| Surveillant | 5 | 1% |
| Secrétaire | 2 | 0.3% |
| Comptable | 1 | 0.2% |
| Bibliothécaire | 1 | 0.2% |
| Gestionnaire Cantine | 1 | 0.2% |
| Directeur des Études | 1 | 0.2% |
| Directeur/Proviseur | 1 | 0.2% |
| Autre | Variable | Variable |

**Total** : ~1,042 utilisateurs

---

## 🔐 Permissions par Rôle (Recommandations)

### 1. **Proviseur / Directeur** 🎓👔
**Modules recommandés** :
- ✅ Tous les modules (accès complet)
- ✅ Permissions : Lecture + Écriture + Suppression + Export

### 2. **Directeur des Études** 📋
**Modules recommandés** :
- ✅ Gestion des Notes
- ✅ Emploi du Temps
- ✅ Présence
- ✅ Bulletins
- ✅ Examens
- ✅ Permissions : Lecture + Écriture + Export

### 3. **Secrétaire** 📝
**Modules recommandés** :
- ✅ Inscriptions
- ✅ Gestion Utilisateurs
- ✅ Documents Administratifs
- ✅ Permissions : Lecture + Écriture

### 4. **Comptable** 💰
**Modules recommandés** :
- ✅ Finances
- ✅ Paiements
- ✅ Factures
- ✅ Comptabilité
- ✅ Permissions : Lecture + Écriture + Export

### 5. **Enseignant** 👨‍🏫
**Modules recommandés** :
- ✅ Gestion des Notes
- ✅ Présence
- ✅ Emploi du Temps (lecture seule)
- ✅ Cahier de Texte
- ✅ Permissions : Lecture + Écriture (limité à ses classes)

### 6. **Surveillant** 👮
**Modules recommandés** :
- ✅ Présence
- ✅ Discipline
- ✅ Vie Scolaire
- ✅ Permissions : Lecture + Écriture

### 7. **Bibliothécaire** 📚
**Modules recommandés** :
- ✅ Gestion Bibliothèque
- ✅ Prêts de Livres
- ✅ Inventaire
- ✅ Permissions : Lecture + Écriture

### 8. **Élève** 🎒
**Modules recommandés** :
- ✅ Mes Notes (lecture seule)
- ✅ Mon Emploi du Temps (lecture seule)
- ✅ Mes Bulletins (lecture seule)
- ✅ Bibliothèque (consultation)
- ✅ Permissions : Lecture uniquement

### 9. **Parent** 👨‍👩‍👧‍👦
**Modules recommandés** :
- ✅ Notes de mon enfant (lecture seule)
- ✅ Emploi du Temps (lecture seule)
- ✅ Bulletins (lecture seule)
- ✅ Finances (paiements)
- ✅ Permissions : Lecture + Paiement

### 10. **Gestionnaire de Cantine** 🍽️
**Modules recommandés** :
- ✅ Gestion Cantine
- ✅ Menus
- ✅ Inscriptions Cantine
- ✅ Permissions : Lecture + Écriture

### 11. **Autre** 👤
**Modules recommandés** :
- ✅ À définir selon le besoin
- ✅ Permissions : Variables

---

## 💻 Implémentation Technique

### Fichier Principal
```typescript
// src/features/dashboard/components/users/GroupUserFormDialog.tsx

const USER_ROLES = [
  { value: 'proviseur', label: '🎓 Proviseur' },
  { value: 'directeur', label: '👔 Directeur' },
  { value: 'directeur_etudes', label: '📋 Directeur des Études' },
  { value: 'secretaire', label: '📝 Secrétaire' },
  { value: 'comptable', label: '💰 Comptable' },
  { value: 'enseignant', label: '👨‍🏫 Enseignant' },
  { value: 'surveillant', label: '👮 Surveillant' },
  { value: 'bibliothecaire', label: '📚 Bibliothécaire' },
  { value: 'eleve', label: '🎒 Élève' },
  { value: 'parent', label: '👨‍👩‍👧‍👦 Parent' },
  { value: 'gestionnaire_cantine', label: '🍽️ Gestionnaire de Cantine' },
  { value: 'autre', label: '👤 Autre' },
] as const;
```

### Validation Zod
```typescript
role: z.enum([
  'proviseur',
  'directeur',
  'directeur_etudes',
  'secretaire',
  'comptable',
  'enseignant',
  'surveillant',
  'bibliothecaire',
  'eleve',
  'parent',
  'gestionnaire_cantine',
  'autre',
], {
  errorMap: () => ({ message: 'Veuillez sélectionner un rôle' }),
}),
```

### Base de Données
```sql
-- Table users
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin_groupe',
  'proviseur',
  'directeur',
  'directeur_etudes',
  'secretaire',
  'comptable',
  'enseignant',
  'surveillant',
  'bibliothecaire',
  'eleve',
  'parent',
  'gestionnaire_cantine',
  'autre'
);
```

---

## 🎨 Interface Utilisateur

### Dropdown de Sélection
```
┌─────────────────────────────────────┐
│ Rôle *                              │
│ ┌─────────────────────────────────┐ │
│ │ Sélectionner un rôle         ▼ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Options :                           │
│ 🎓 Proviseur                        │
│ 👔 Directeur                        │
│ 📋 Directeur des Études             │
│ 📝 Secrétaire                       │
│ 💰 Comptable                        │
│ 👨‍🏫 Enseignant                      │
│ 👮 Surveillant                      │
│ 📚 Bibliothécaire                   │
│ 🎒 Élève                            │
│ 👨‍👩‍👧‍👦 Parent                         │
│ 🍽️ Gestionnaire de Cantine         │
│ 👤 Autre                            │
└─────────────────────────────────────┘
```

---

## 📈 Statistiques Recommandées

### Dashboard Admin de Groupe
```typescript
const stats = {
  totalUsers: 1042,
  byRole: {
    eleve: 500,
    parent: 500,
    enseignant: 30,
    surveillant: 5,
    secretaire: 2,
    comptable: 1,
    bibliothecaire: 1,
    gestionnaire_cantine: 1,
    directeur_etudes: 1,
    directeur: 1,
    autre: 0,
  },
  activeUsers: 987,
  inactiveUsers: 55,
};
```

---

## ✅ Checklist de Validation

### Formulaire de Création
- [x] 12 rôles disponibles dans le dropdown
- [x] Icônes emoji pour chaque rôle
- [x] Labels en français
- [x] Validation Zod stricte
- [x] Sélection d'école obligatoire
- [x] Champs : prénom, nom, email, téléphone, rôle, école

### Affectation de Modules
- [x] Tous les rôles peuvent recevoir des modules
- [x] Permissions granulaires (4 niveaux)
- [x] Isolation par utilisateur (RLS)
- [x] Audit trail complet

### Base de Données
- [x] Enum `user_role` avec les 12 rôles
- [x] Colonne `role` dans la table `users`
- [x] Index sur la colonne `role`
- [x] RLS configuré

---

## 🎯 Cas d'Usage Typiques

### Scénario 1 : Création d'un Enseignant
```
1. Admin de Groupe se connecte
2. Va sur "Utilisateurs"
3. Clique "Créer un utilisateur"
4. Remplit le formulaire :
   - Prénom : Jean
   - Nom : Dupont
   - Email : jean.dupont@ecole.cg
   - Téléphone : +242069698620
   - Rôle : 👨‍🏫 Enseignant
   - École : Lycée Victor Hugo
5. Clique "Créer l'utilisateur"
6. ✅ Enseignant créé avec succès
```

### Scénario 2 : Affectation de Modules à un Enseignant
```
1. Admin clique sur ⋮ (menu) de l'enseignant
2. Clique "📦 Assigner modules"
3. Sélectionne :
   - Gestion des Notes ✓
   - Présence ✓
   - Cahier de Texte ✓
4. Définit permissions :
   - Lecture ✅
   - Écriture ✅
   - Suppression ❌
   - Export ✅
5. Clique "Assigner 3 modules"
6. ✅ Modules assignés avec succès
```

---

## 🏆 Conformité

### Système Éducatif Congolais
✅ **Rôles conformes** au système éducatif de la République du Congo
✅ **Terminologie officielle** (Proviseur, Directeur, etc.)
✅ **Hiérarchie respectée** (Proviseur > Directeur des Études > Enseignant)
✅ **Tous les acteurs** de l'écosystème scolaire représentés

### Best Practices
✅ **Validation stricte** (Zod)
✅ **Sécurité** (RLS + audit trail)
✅ **UX moderne** (icônes + labels clairs)
✅ **Scalable** (supporte des milliers d'utilisateurs)

---

## 📞 Support

Pour toute question sur les rôles :
1. Consulter ce document
2. Voir `GroupUserFormDialog.tsx`
3. Tester dans l'interface Admin de Groupe

---

## 🎉 Résumé

**12 rôles officiels implémentés** pour couvrir tous les besoins du système éducatif congolais :

1. 🎓 Proviseur
2. 👔 Directeur
3. 📋 Directeur des Études
4. 📝 Secrétaire
5. 💰 Comptable
6. 👨‍🏫 Enseignant
7. 👮 Surveillant
8. 📚 Bibliothécaire
9. 🎒 Élève
10. 👨‍👩‍👧‍👦 Parent
11. 🍽️ Gestionnaire de Cantine
12. 👤 Autre

**Système complet, conforme et prêt pour la production !** 🚀🇨🇬
