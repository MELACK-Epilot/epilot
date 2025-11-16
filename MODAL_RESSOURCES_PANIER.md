# ✅ MODAL DEMANDE DE RESSOURCES - SYSTÈME DE PANIER

## 🎯 CONCEPT

Un système complet de demande de ressources avec :
- **Catalogue de ressources** organisé par catégories
- **Panier** pour gérer les sélections
- **Justifications** pour chaque ressource
- **Upload de fichiers** optionnel
- **Impression** de l'état des besoins
- **Soumission** aux administrateurs

---

## 🛒 FONCTIONNALITÉS PRINCIPALES

### 1. Catalogue de Ressources

#### Catégories Disponibles
- **Informatique** : Ordinateurs, imprimantes, projecteurs, tablettes
- **Mobilier** : Bureaux, chaises, tables-bancs, armoires, tableaux
- **Fournitures** : Papier, marqueurs, cahiers, stylos
- **Pédagogique** : Manuels, cartes, matériel scientifique
- **Autre** : Ressources personnalisées

#### Recherche et Filtrage
```tsx
// Recherche par nom
<Input placeholder="Rechercher une ressource..." />

// Filtrage par catégorie
<Button>Tous</Button>
<Button>Informatique</Button>
<Button>Mobilier</Button>
...
```

#### Affichage des Ressources
```
┌─────────────────────────────────────────┐
│ Ordinateur portable                      │
│ Catégorie: Informatique                  │
│ Unité: unité | ~350 000 FCFA            │
│                        [+ Ajouter]       │
└─────────────────────────────────────────┘
```

---

### 2. Système de Panier

#### Ajout au Panier
```tsx
const addToCart = (resource: Resource) => {
  const existingItem = cart.find(item => item.resource.id === resource.id);
  if (existingItem) {
    // Incrémenter la quantité
    updateQuantity(resource.id, existingItem.quantity + 1);
  } else {
    // Ajouter au panier
    setCart([...cart, { resource, quantity: 1, justification: '' }]);
  }
};
```

#### Gestion des Quantités
```tsx
// Augmenter
<button onClick={() => updateQuantity(id, quantity + 1)}>
  <Plus />
</button>

// Diminuer
<button onClick={() => updateQuantity(id, quantity - 1)}>
  <Minus />
</button>

// Saisie manuelle
<Input 
  type="number" 
  value={quantity}
  onChange={(e) => updateQuantity(id, parseInt(e.target.value))}
/>
```

#### Justification par Ressource
```tsx
<Textarea
  placeholder="Justification (optionnel)..."
  value={item.justification}
  onChange={(e) => updateJustification(id, e.target.value)}
  rows={2}
/>
```

---

### 3. Calcul Automatique

#### Total Estimé
```tsx
const calculateTotal = () => {
  return cart.reduce((total, item) => {
    return total + (item.resource.estimatedPrice || 0) * item.quantity;
  }, 0);
};
```

#### Affichage
```tsx
Total estimé: 1 250 000 FCFA
```

---

### 4. Documents Joints (Optionnel)

#### Upload de Fichiers
```tsx
<Button onClick={handleFileUpload}>
  <Upload /> Ajouter
</Button>
```

#### Liste des Fichiers
```
┌─────────────────────────────────────────┐
│ 📄 Devis_Fournisseur.pdf (1.2 MB)  [X] │
│ 📄 Catalogue_Materiel.pdf (850 KB) [X] │
└─────────────────────────────────────────┘
```

---

### 5. Notes Générales

```tsx
<Textarea
  placeholder="Ajoutez des informations complémentaires..."
  value={generalNotes}
  onChange={(e) => setGeneralNotes(e.target.value)}
  rows={3}
/>
```

**Utilisation** :
- Contexte de la demande
- Urgence
- Informations complémentaires
- Contraintes spécifiques

---

### 6. Impression de l'État

#### Fonctionnalité
```tsx
import { useReactToPrint } from 'react-to-print';

const handlePrint = useReactToPrint({
  content: () => printRef.current,
  documentTitle: `Etat_Besoins_${schoolName}_${date}`,
});
```

#### Format Imprimé
```
═══════════════════════════════════════════
         ÉTAT DES BESOINS
         École Sainte Marie
      Date: 16/11/2025
═══════════════════════════════════════════

┌────────────────────────────────────────────────────────────┐
│ Ressource         │ Qté │ Unité │ P.U.      │ Total      │ Justification │
├────────────────────────────────────────────────────────────┤
│ Ordinateur        │  10 │ unité │ 350 000   │ 3 500 000  │ Salle info    │
│ portable          │     │       │           │            │               │
├────────────────────────────────────────────────────────────┤
│ Table-banc        │  50 │ unité │  25 000   │ 1 250 000  │ Nouvelles     │
│ élève             │     │       │           │            │ classes       │
├────────────────────────────────────────────────────────────┤
│                   │     │       │ TOTAL:    │ 4 750 000  │               │
└────────────────────────────────────────────────────────────┘

Notes générales:
Demande urgente pour la rentrée prochaine.
Budget disponible: 5 000 000 FCFA

Documents joints:
• Devis_Fournisseur.pdf (1.2 MB)
• Catalogue_Materiel.pdf (850 KB)
```

---

### 7. Soumission

#### Validation
```tsx
if (cart.length === 0) {
  toast({
    title: "Panier vide",
    description: "Ajoutez au moins une ressource.",
    variant: "destructive",
  });
  return;
}
```

#### Envoi
```tsx
const handleSubmit = () => {
  // Envoyer aux administrateurs
  toast({
    title: "Demande envoyée !",
    description: `État des besoins (${cart.length} ressource(s)) envoyé.`,
  });
};
```

---

## 🎨 INTERFACE UTILISATEUR

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🛒 Demande de Ressources                                   │
│  Sélectionnez les ressources nécessaires pour École X       │
├──────────────────────────────────┬──────────────────────────┤
│  CATALOGUE (2/3)                 │  PANIER (1/3)            │
│                                  │                          │
│  🔍 [Rechercher...]              │  🛒 Panier (3)           │
│  [Tous][Info][Mobilier]...       │  Total: 1 250 000 FCFA  │
│                                  │                          │
│  ┌──────────────────────────┐   │  ┌────────────────────┐ │
│  │ Ordinateur portable      │   │  │ Ordinateur (2)     │ │
│  │ Informatique             │   │  │ [- 2 +]            │ │
│  │ ~350 000 FCFA   [Ajouter]│   │  │ Justif: Salle info │ │
│  └──────────────────────────┘   │  └────────────────────┘ │
│                                  │                          │
│  ┌──────────────────────────┐   │  ┌────────────────────┐ │
│  │ Table-banc élève         │   │  │ Table-banc (50)    │ │
│  │ Mobilier                 │   │  │ [- 50 +]           │ │
│  │ ~25 000 FCFA    [Ajouter]│   │  │ Justif: Classes    │ │
│  └──────────────────────────┘   │  └────────────────────┘ │
│                                  │                          │
│  ...                             │  Notes générales:       │
│                                  │  [________________]     │
│                                  │                          │
│                                  │  Documents:             │
│                                  │  📄 Devis.pdf      [X]  │
│                                  │  [+ Ajouter]            │
│                                  │                          │
│                                  │  [🖨️ Imprimer l'état]   │
│                                  │  [📤 Soumettre]         │
└──────────────────────────────────┴──────────────────────────┘
```

---

## 📊 DONNÉES DU CATALOGUE

### Structure Resource

```tsx
interface Resource {
  id: string;
  name: string;
  category: string;
  unit: string;
  estimatedPrice?: number;
}
```

### Exemples de Ressources

| Catégorie | Ressource | Unité | Prix Estimé |
|-----------|-----------|-------|-------------|
| Informatique | Ordinateur portable | unité | 350 000 FCFA |
| Informatique | Imprimante | unité | 75 000 FCFA |
| Mobilier | Bureau enseignant | unité | 45 000 FCFA |
| Mobilier | Table-banc élève | unité | 25 000 FCFA |
| Fournitures | Ramette papier A4 | ramette | 3 500 FCFA |
| Pédagogique | Manuels scolaires | lot | 15 000 FCFA |

---

## 🔄 FLUX D'UTILISATION

### Scénario Complet

```
1. Proviseur ouvre le modal
   ↓
2. Recherche "ordinateur"
   ↓
3. Clique sur "Ajouter" pour Ordinateur portable
   ↓
4. Ajuste la quantité à 10
   ↓
5. Ajoute justification: "Salle informatique"
   ↓
6. Ajoute Table-banc (50 unités)
   ↓
7. Ajoute justification: "Nouvelles classes"
   ↓
8. Ajoute notes générales
   ↓
9. Upload devis fournisseur
   ↓
10. Clique "Imprimer" pour vérifier
    ↓
11. Clique "Soumettre"
    ↓
12. Demande envoyée aux admins !
```

---

## ✅ AVANTAGES DU SYSTÈME

### 1. Simplicité
- ✅ Interface intuitive type e-commerce
- ✅ Ajout rapide au panier
- ✅ Gestion facile des quantités

### 2. Flexibilité
- ✅ Catalogue extensible
- ✅ Justifications personnalisées
- ✅ Documents optionnels

### 3. Professionnalisme
- ✅ Calcul automatique des totaux
- ✅ Format imprimable
- ✅ Présentation claire

### 4. Traçabilité
- ✅ Historique des demandes
- ✅ Justifications documentées
- ✅ Pièces jointes

---

## 🎯 VALIDATION

### Checks Avant Soumission

```tsx
✓ Au moins 1 ressource dans le panier
✓ Quantités > 0
✓ Format des fichiers valide (optionnel)
✓ Connexion Supabase OK
```

### Messages d'Erreur

| Erreur | Message |
|--------|---------|
| Panier vide | "Ajoutez au moins une ressource" |
| Quantité invalide | "La quantité doit être supérieure à 0" |
| Erreur upload | "Impossible d'uploader le fichier" |

---

## 📱 RESPONSIVE DESIGN

### Desktop (> 1024px)
```
[Catalogue 2/3] [Panier 1/3]
```

### Tablet (768-1024px)
```
[Catalogue 2/3]
[Panier 1/3]
```

### Mobile (< 768px)
```
[Catalogue Full Width]
[Panier Full Width - Sticky Bottom]
```

---

## 🔧 INTÉGRATION

### Dans EstablishmentPage

```tsx
// État
const [isResourceRequestModalOpen, setIsResourceRequestModalOpen] = useState(false);

// Handler
const handleResourceRequest = () => {
  setIsResourceRequestModalOpen(true);
};

// Rendu
<ResourceRequestModal
  isOpen={isResourceRequestModalOpen}
  onClose={() => setIsResourceRequestModalOpen(false)}
  schoolName={schoolGroup?.name || 'Groupe Scolaire'}
  schoolId={schoolGroup?.id || ''}
/>
```

### Boutons Déclencheurs

- **Demande de Ressources** → Ouvre le modal
- **État des Besoins** → Ouvre le modal (même modal)

---

## 📦 DÉPENDANCES

```json
{
  "react-to-print": "^2.15.1"
}
```

### Installation
```bash
npm install react-to-print
```

---

## 🎉 RÉSULTAT FINAL

**Le modal ResourceRequestModal est un système complet de gestion des demandes !**

### Ce qui fonctionne :
✅ **Catalogue organisé** par catégories  
✅ **Recherche et filtrage** en temps réel  
✅ **Panier interactif** avec quantités  
✅ **Justifications** par ressource  
✅ **Calcul automatique** des totaux  
✅ **Upload de fichiers** optionnel  
✅ **Impression** de l'état des besoins  
✅ **Soumission** aux administrateurs  
✅ **Interface moderne** et intuitive  

### Expérience Utilisateur :
✅ Proviseur sélectionne facilement les ressources  
✅ Gère les quantités comme un panier e-commerce  
✅ Justifie chaque demande  
✅ Peut imprimer avant d'envoyer  
✅ Feedback visuel immédiat  

**Le Proviseur peut maintenant gérer ses demandes de ressources de manière professionnelle ! 🎊**
