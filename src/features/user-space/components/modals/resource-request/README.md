# Module d'État des Besoins

## 📋 Description

Ce module permet aux établissements scolaires d'établir et de soumettre leur **état des besoins** en ressources (matériel informatique, mobilier, fournitures, etc.) aux administrateurs du groupe scolaire.

## 📁 Architecture

```
resource-request/
├── index.ts                      - Point d'entrée du module
├── resource-request.types.ts     - Types TypeScript
├── resource-catalog.ts           - Catalogue de ressources
├── useResourceRequest.ts         - Hook personnalisé (logique métier)
├── ResourceCatalog.tsx           - Composant catalogue avec filtres
├── ResourceCart.tsx              - Composant panier
├── ResourceRequestModal.tsx      - Modal principal (orchestration)
└── README.md                     - Cette documentation
```

## 🎯 Utilisation

```typescript
import { ResourceRequestModal } from '@/features/user-space/components/modals/resource-request';

// Dans votre composant
<ResourceRequestModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  schoolName="École Primaire XYZ"
  schoolId="optional-id" // Optionnel - récupéré automatiquement
/>
```

## 🔧 Hook personnalisé: useResourceRequest

### Fonctionnalités

Le hook `useResourceRequest` gère toute la logique métier de l'état des besoins:

- **Gestion du panier**: ajout, modification, suppression de ressources
- **Calculs**: total estimé, prix unitaires
- **Fichiers**: upload de documents justificatifs
- **Soumission**: envoi de l'état des besoins à Supabase avec validation

### Optimisations React

Toutes les fonctions utilisent `useCallback` pour:
- ✅ Éviter les re-créations inutiles
- ✅ Prévenir les stale closures
- ✅ Optimiser les performances
- ✅ Permettre la mémoïsation dans les composants enfants

### Exemple d'utilisation

```typescript
const {
  cart,
  addToCart,
  updateQuantity,
  submitRequest,
  calculateTotal
} = useResourceRequest();

// Ajouter une ressource
addToCart(resource);

// Mettre à jour la quantité
updateQuantity(resourceId, 5);

// Soumettre l'état des besoins
await submitRequest(() => {
  console.log('État des besoins envoyé avec succès!');
});
```

## 📊 Composants

### ResourceCatalog

Affiche le catalogue de ressources avec:
- Recherche par nom
- Filtres par catégorie
- Ajout au panier

### ResourceCart

Gère le panier avec:
- Liste des items
- Modification quantités/prix
- Justifications
- Upload de fichiers
- Actions (imprimer, soumettre)

### ResourceRequestModal

Modal principal d'état des besoins qui orchestre:
- Layout responsive (2/3 catalogue, 1/3 panier)
- Gestion de l'état et des interactions
- Formatage des prix (FCFA)
- Fermeture avec réinitialisation automatique

## 🗄️ Base de données

### Tables utilisées

1. **resource_requests**: État des besoins principal
   - `school_id`, `school_group_id`, `requested_by`
   - `title`: "État des besoins - [date]"
   - `description`, `notes`: Informations complémentaires
   - `status`: pending | approved | rejected | in_progress | completed
   - `priority`: low | normal | high | urgent

2. **resource_request_items**: Ressources demandées
   - `request_id` (FK vers resource_requests)
   - `resource_name`, `resource_category`
   - `quantity`, `unit`, `unit_price`
   - `justification`: Raison de la demande

3. **resource_request_attachments**: Documents justificatifs (futur)
   - Devis, factures proforma, etc.

## 🔒 Sécurité

- ✅ Validation côté client
- ✅ Vérification de l'utilisateur connecté
- ✅ Récupération dynamique des IDs (school, group)
- ✅ Gestion des erreurs avec messages explicites

## 🎨 Catalogue de ressources

18 ressources pré-définies dans 5 catégories:
- **Informatique**: Ordinateurs, imprimantes, projecteurs, tablettes
- **Mobilier**: Bureaux, chaises, tables-bancs, armoires, tableaux
- **Fournitures**: Papier, marqueurs, cahiers, stylos
- **Pédagogique**: Manuels, cartes, matériel scientifique
- **Autre**: Ressources personnalisées

## 🚀 Améliorations futures

- [ ] Upload réel de fichiers (Supabase Storage)
- [ ] Validation des formulaires avec Zod
- [ ] Historique des demandes
- [ ] Notifications en temps réel
- [ ] Export PDF de l'état des besoins
- [ ] Gestion des devises multiples
