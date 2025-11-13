# 🎯 Dialogs Déplaçables - E-Pilot Congo

## ✅ Implémentation terminée

Tous les formulaires (Dialog/Modal) sont maintenant **déplaçables avec la souris** !

---

## 📦 Composant créé

### **DraggableDialog** (`src/components/ui/draggable-dialog.tsx`)

Wrapper autour du Dialog de shadcn/ui qui ajoute la fonctionnalité de drag & drop.

**Fonctionnalités** :
- ✅ Déplacement avec la souris (drag & drop)
- ✅ Zone de drag personnalisable (via `data-draggable-handle`)
- ✅ Limites de déplacement (reste dans la fenêtre)
- ✅ Curseur `grabbing` pendant le drag
- ✅ Réinitialisation automatique de la position à la fermeture
- ✅ Transition fluide
- ✅ Compatible avec tous les Dialog existants

---

## 🎨 Utilisation

### **1. Importer le DraggableDialog**

```tsx
import {
  DraggableDialog as Dialog,
  DraggableDialogContent as DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/draggable-dialog';
```

### **2. Ajouter l'attribut `data-draggable-handle`**

Sur l'élément qui servira de "poignée" pour déplacer le dialog (généralement le header) :

```tsx
<DialogHeader data-draggable-handle className="cursor-move">
  <DialogTitle>Mon Titre</DialogTitle>
  <DialogDescription>Ma description</DialogDescription>
</DialogHeader>
```

### **3. Exemple complet**

```tsx
export const MonFormulaire = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {/* Zone de drag - Le header */}
        <DialogHeader data-draggable-handle className="cursor-move">
          <DialogTitle>Mon Formulaire</DialogTitle>
          <DialogDescription>
            Cliquez sur ce header et déplacez la fenêtre !
          </DialogDescription>
        </DialogHeader>

        {/* Contenu du formulaire */}
        <div className="space-y-4">
          <Input placeholder="Champ 1" />
          <Input placeholder="Champ 2" />
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## ✅ Formulaires mis à jour

Les formulaires suivants sont maintenant déplaçables :

### **1. SchoolGroupFormDialog** ✅
- Fichier : `src/features/dashboard/components/SchoolGroupFormDialog.tsx`
- Utilisation : Création/modification de groupes scolaires
- Zone de drag : Header du dialog

### **2. UserFormDialog** ✅
- Fichier : `src/features/dashboard/components/UserFormDialog.tsx`
- Utilisation : Création/modification d'administrateurs
- Zone de drag : Header du dialog

---

## 🎯 Comment ça fonctionne

### **Principe**

1. **Zone de drag** : Seuls les éléments avec `data-draggable-handle` permettent de déplacer le dialog
2. **Calcul de position** : La position est calculée en temps réel pendant le drag
3. **Limites** : Le dialog reste toujours visible dans la fenêtre (ne peut pas sortir)
4. **Réinitialisation** : La position revient à zéro quand le dialog se ferme

### **Événements**

- `mousedown` sur la zone de drag → Début du déplacement
- `mousemove` sur le document → Calcul de la nouvelle position
- `mouseup` sur le document → Fin du déplacement

### **Optimisations**

- ✅ Pas de transition pendant le drag (fluidité)
- ✅ Curseur `grabbing` pour feedback visuel
- ✅ `userSelect: none` pour éviter la sélection de texte
- ✅ Nettoyage automatique des event listeners

---

## 🔧 Personnalisation

### **Changer la zone de drag**

Par défaut, seul le header est déplaçable. Pour changer :

```tsx
{/* Rendre tout le dialog déplaçable */}
<DialogContent data-draggable-handle className="cursor-move">
  {/* ... */}
</DialogContent>

{/* Ou ajouter plusieurs zones */}
<div data-draggable-handle className="cursor-move">
  Zone 1
</div>
<div data-draggable-handle className="cursor-move">
  Zone 2
</div>
```

### **Désactiver le déplacement**

Simplement ne pas ajouter `data-draggable-handle` :

```tsx
<DialogHeader>
  {/* Pas déplaçable */}
  <DialogTitle>Titre</DialogTitle>
</DialogHeader>
```

---

## 🎨 Styles

Le composant utilise les styles suivants :

```css
/* Pendant le drag */
cursor: grabbing;
user-select: none;
transition: none;

/* Zone de drag */
cursor: move; /* ou grab */

/* Transition normale */
transition: transform 0.2s ease-out;
```

---

## 📋 Checklist pour ajouter à un nouveau formulaire

1. [ ] Remplacer `Dialog` par `DraggableDialog`
2. [ ] Remplacer `DialogContent` par `DraggableDialogContent`
3. [ ] Importer depuis `@/components/ui/draggable-dialog`
4. [ ] Ajouter `data-draggable-handle` sur le header
5. [ ] Ajouter `className="cursor-move"` sur le header
6. [ ] Tester le déplacement

---

## 🎉 Résultat

Tous les formulaires peuvent maintenant être **déplacés librement** dans la fenêtre en cliquant sur leur header et en les faisant glisser avec la souris !

**UX améliorée** :
- ✅ Plus de flexibilité pour l'utilisateur
- ✅ Peut déplacer le formulaire pour voir le contenu en dessous
- ✅ Feedback visuel clair (curseur grabbing)
- ✅ Comportement intuitif et fluide

---

## 🚀 Prochaines étapes (optionnel)

- [ ] Ajouter le redimensionnement des dialogs
- [ ] Sauvegarder la position dans localStorage
- [ ] Ajouter une animation de "snap" vers le centre
- [ ] Support du touch (mobile/tablette)
