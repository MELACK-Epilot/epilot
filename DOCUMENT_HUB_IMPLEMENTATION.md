# 📚 HUB DOCUMENTAIRE SOCIAL - Implémentation

## 🎯 Vue d'Ensemble

Le **Hub Documentaire Social** est un système complet de gestion et partage de documents pour les groupes scolaires avec des fonctionnalités sociales (commentaires, réactions, statistiques).

## ✅ Ce qui a été Créé

### 1. 📊 Base de Données (SQL)

**Fichier:** `database/CREATE_DOCUMENT_HUB_TABLES.sql`

#### Tables Créées

1. **`group_documents`** - Documents principaux
   - Métadonnées (titre, description, catégorie, tags)
   - Fichier (nom, chemin, taille, type)
   - Visibilité (group, school, private)
   - Statistiques (vues, téléchargements, commentaires)
   - Épinglage et archivage

2. **`document_comments`** - Commentaires
   - Support des réponses (parent_comment_id)
   - Limite 2000 caractères
   - Modification et suppression

3. **`document_reactions`** - Réactions
   - Types: vu, important, utile, like
   - Une réaction par type par utilisateur

4. **`document_views`** - Suivi des vues
   - Enregistrement unique par utilisateur
   - Incrémente automatiquement views_count

#### Triggers Automatiques ✅

1. **updated_at** - Mise à jour automatique timestamp
2. **views_count** - Incrémentation automatique
3. **comments_count** - Compteur automatique

#### Sécurité RLS ✅

- **Lecture:** Utilisateurs voient documents de leur groupe
- **Création:** Proviseurs, directeurs, comptables autorisés
- **Modification:** Auteur ou admin de groupe
- **Suppression:** Auteur ou admin de groupe
- **Commentaires:** Tous peuvent commenter, supprimer les leurs
- **Réactions:** Tous peuvent réagir

#### Indexes de Performance ✅

- 11 indexes créés pour optimiser les requêtes
- Index GIN sur tags pour recherche full-text
- Index sur dates, catégories, relations

### 2. 📝 Types TypeScript

**Fichier:** `src/features/document-hub/types/document-hub.types.ts`

#### Types Principaux

```typescript
- GroupDocument        // Document complet avec relations
- DocumentComment      // Commentaire avec réponses
- DocumentReaction     // Réaction utilisateur
- DocumentView         // Vue de document
- UploadDocumentForm   // Formulaire d'upload
- DocumentFilters      // Filtres de recherche
- DocumentStats        // Statistiques
```

#### Types Enum

```typescript
- DocumentCategory: 'Administratif' | 'Pédagogique' | 'Financier' | 'RH' | 'Technique' | 'Autre'
- DocumentVisibility: 'group' | 'school' | 'private'
- ReactionType: 'vu' | 'important' | 'utile' | 'like'
```

### 3. 🔧 Hook Personnalisé

**Fichier:** `src/features/document-hub/hooks/useDocumentHub.ts`

#### Fonctionnalités

```typescript
const {
  documents,              // Liste filtrée
  isLoading,             // État de chargement
  filters,               // Filtres actifs
  applyFilters,          // Appliquer filtres
  uploadDocument,        // Upload + BDD
  downloadDocument,      // Télécharger
  recordView,            // Enregistrer vue
  addReaction,           // Ajouter/retirer réaction
  togglePin,             // Épingler/désépingler
  deleteDocument,        // Supprimer
  refreshDocuments,      // Recharger
} = useDocumentHub(schoolGroupId);
```

#### Optimisations

- ✅ useCallback pour toutes les fonctions
- ✅ Gestion d'état optimisée
- ✅ Rechargement automatique après actions
- ✅ Gestion d'erreurs complète

## 🚀 Prochaines Étapes

### À Créer (Frontend)

1. **DocumentHub.tsx** - Composant principal (feed)
   - Liste des documents
   - Barre de recherche
   - Filtres
   - Bouton upload

2. **DocumentCard.tsx** - Carte de document
   - Affichage infos
   - Actions (télécharger, commenter, réagir)
   - Statistiques
   - Menu contextuel

3. **UploadDocumentModal.tsx** - Modal d'upload
   - Formulaire complet
   - Drag & drop
   - Prévisualisation
   - Validation

4. **DocumentComments.tsx** - Système de commentaires
   - Liste des commentaires
   - Formulaire d'ajout
   - Réponses imbriquées
   - Suppression

5. **DocumentFilters.tsx** - Panneau de filtres
   - Catégories
   - Écoles
   - Auteurs
   - Tags
   - Dates

6. **DocumentStats.tsx** - Statistiques
   - Documents par catégorie
   - Plus vus/téléchargés
   - Activité récente

## 📋 Fonctionnalités Implémentées

### ✅ Gestion de Documents

- [x] Upload vers Supabase Storage
- [x] Métadonnées complètes
- [x] Catégorisation
- [x] Tags pour recherche
- [x] Visibilité configurable
- [x] Épinglage
- [x] Archivage
- [x] Suppression

### ✅ Interactions Sociales

- [x] Commentaires
- [x] Réponses aux commentaires
- [x] Réactions (4 types)
- [x] Compteurs automatiques
- [x] Suivi des vues

### ✅ Recherche & Filtres

- [x] Recherche textuelle
- [x] Filtre par catégorie
- [x] Filtre par école
- [x] Filtre par auteur
- [x] Filtre par tags
- [x] Filtre par date
- [x] Filtre épinglés

### ✅ Sécurité

- [x] RLS policies actives
- [x] Permissions par rôle
- [x] Validation des données
- [x] Limite de taille (50MB)
- [x] Authentification requise

### ✅ Performance

- [x] 11 indexes créés
- [x] Requêtes optimisées
- [x] Chargement avec relations
- [x] Pagination (à implémenter frontend)

## 🎨 Design Proposé

### Feed Principal

```
┌─────────────────────────────────────────────────┐
│  📚 Hub Documentaire                            │
│  ┌──────────────────────────────────────────┐  │
│  │ 🔍 Rechercher...        [Filtres ▼]      │  │
│  │ [+ Publier un document]                   │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 📌 ÉPINGLÉ                               │   │
│  │ 📄 Circulaire N°05/2025                 │   │
│  │ 👤 Admin Groupe • Administratif          │   │
│  │ 📅 Il y a 2 jours • 👁️ 45 vues          │   │
│  │                                           │   │
│  │ 💬 5 commentaires                        │   │
│  │ 👍 12 vu • ⭐ 8 important • ❤️ 5 utile  │   │
│  │                                           │   │
│  │ [📥 Télécharger] [💬 Commenter] [⭐]     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 📊 Rapport Trimestriel Q1 2025          │   │
│  │ 👤 Proviseur École A • Pédagogique      │   │
│  │ 📅 Il y a 5 jours • 👁️ 23 vues          │   │
│  │ 🏷️ rapport, trimestre, Q1               │   │
│  │                                           │   │
│  │ 💬 3 commentaires                        │   │
│  │ 👍 8 vu • ⭐ 3 important                 │   │
│  │                                           │   │
│  │ [📥 Télécharger] [💬 Commenter] [⭐]     │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Carte Document (Détails)

```
┌─────────────────────────────────────────────────┐
│  📄 Circulaire N°05/2025 - Calendrier Scolaire │
│  ───────────────────────────────────────────── │
│                                                 │
│  👤 Admin Groupe                                │
│  📅 Publié le 14 novembre 2025                  │
│  📁 Administratif                               │
│  🏷️ circulaire, calendrier, 2025               │
│  👁️ 45 vues • 📥 12 téléchargements            │
│                                                 │
│  📝 Description:                                │
│  Calendrier officiel pour l'année scolaire     │
│  2025-2026 avec dates importantes...           │
│                                                 │
│  ───────────────────────────────────────────── │
│                                                 │
│  💬 Commentaires (5)                            │
│                                                 │
│  👤 Proviseur École B • Il y a 1 jour          │
│  Merci pour ce calendrier détaillé !           │
│  [Répondre]                                     │
│                                                 │
│  👤 Directeur École C • Il y a 2 heures        │
│  Pouvons-nous avoir la version Word ?          │
│  [Répondre]                                     │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ 💬 Ajouter un commentaire...             │  │
│  │ [Envoyer]                                 │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 🔄 Flux Utilisateur

### 1. Publication de Document

```
Utilisateur (Proviseur)
    ↓ clique "Publier un document"
Modal Upload s'ouvre
    ↓ remplit formulaire
    ↓ sélectionne fichier
    ↓ choisit catégorie/tags
    ↓ définit visibilité
    ↓ clique "Publier"
Upload vers Supabase Storage
    ↓ succès
Création entrée BDD
    ↓ succès
Toast "Document publié !"
    ↓
Feed se recharge
    ↓
Document apparaît en haut
```

### 2. Téléchargement

```
Utilisateur clique "Télécharger"
    ↓
Hook récupère URL signée
    ↓
Ouvre dans nouvel onglet
    ↓
Incrémente downloads_count
    ↓
Recharge feed
```

### 3. Commentaire

```
Utilisateur clique "Commenter"
    ↓
Section commentaires s'ouvre
    ↓
Tape commentaire
    ↓
Clique "Envoyer"
    ↓
Insertion en BDD
    ↓
Trigger incrémente comments_count
    ↓
Commentaire apparaît
```

### 4. Réaction

```
Utilisateur clique réaction (ex: ⭐)
    ↓
Vérifie si déjà réagi
    ↓ oui
Supprime réaction
    ↓ non
Ajoute réaction
    ↓
Recharge feed
```

## 📊 Statistiques Disponibles

### Par Document
- Nombre de vues
- Nombre de téléchargements
- Nombre de commentaires
- Réactions par type

### Globales
- Total documents
- Documents par catégorie
- Plus vus
- Plus téléchargés
- Activité récente

## 🔒 Permissions Détaillées

### Admin Groupe
- ✅ Voir tous les documents du groupe
- ✅ Publier documents visibles par tous
- ✅ Épingler/désépingler n'importe quel document
- ✅ Supprimer n'importe quel document
- ✅ Supprimer n'importe quel commentaire

### Proviseur/Directeur
- ✅ Voir documents du groupe
- ✅ Publier documents pour son école ou le groupe
- ✅ Modifier/supprimer ses propres documents
- ✅ Commenter tous les documents
- ✅ Supprimer ses propres commentaires

### Comptable
- ✅ Voir documents du groupe
- ✅ Publier documents financiers
- ✅ Modifier/supprimer ses propres documents
- ✅ Commenter tous les documents

### Autres Utilisateurs
- ✅ Voir documents du groupe
- ✅ Télécharger documents
- ✅ Commenter
- ✅ Réagir

## 🎯 Cas d'Usage

### Cas 1: Circulaire Administrative
```
Admin Groupe publie:
- Titre: "Circulaire N°05/2025"
- Catégorie: Administratif
- Visibilité: Groupe entier
- Tags: circulaire, important, 2025
- Épinglé: Oui

→ Tous les proviseurs voient et téléchargent
→ Peuvent commenter pour questions
→ Marquent comme "vu"
```

### Cas 2: Rapport d'École
```
Proviseur École A publie:
- Titre: "Rapport Trimestriel Q1"
- Catégorie: Pédagogique
- Visibilité: École A uniquement
- Tags: rapport, Q1, 2025

→ Admin Groupe peut voir
→ Autres proviseurs ne voient pas
→ Personnel École A peut télécharger
```

### Cas 3: Document Financier
```
Comptable publie:
- Titre: "Budget Prévisionnel 2025"
- Catégorie: Financier
- Visibilité: Groupe
- Tags: budget, finances, 2025

→ Admin Groupe et proviseurs voient
→ Peuvent commenter pour ajustements
→ Marquent comme "important"
```

## 🚀 Prochaine Session

Je vais créer:
1. ✅ Composant DocumentHub (feed principal)
2. ✅ Composant DocumentCard (carte de document)
3. ✅ Composant UploadDocumentModal (modal d'upload)
4. ✅ Composant DocumentComments (système de commentaires)
5. ✅ Intégration complète

---

**Statut:** 🟡 En cours (Backend terminé, Frontend à créer)  
**Date:** 16 Novembre 2025  
**Prochaine étape:** Création des composants React
