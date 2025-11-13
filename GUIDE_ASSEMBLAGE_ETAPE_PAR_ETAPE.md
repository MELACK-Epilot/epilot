# 🎯 GUIDE D'ASSEMBLAGE - ÉTAPE PAR ÉTAPE

## ✅ ÉTAPE 1 : Ouvrir les fichiers sources

Vous avez 3 fichiers à assembler :
1. `InscriptionFormModerne_Part1.tsx` (407 lignes)
2. `InscriptionFormModerne_Part2.tsx` (165 lignes)  
3. `InscriptionFormModerne_Part3.tsx` (94 lignes)

---

## 📋 ÉTAPE 2 : Créer le fichier final

**Fichier à créer** : `InscriptionFormModerne.tsx`

---

## 🔧 ÉTAPE 3 : Copier Part1 (COMPLET)

### ✅ Action : Copiez TOUT le contenu de `Part1`

**De la ligne 1 à la ligne 407**

Cela inclut :
- ✅ Tous les imports
- ✅ Les constantes (STEPS, NIVEAUX_SCOLAIRES)
- ✅ L'interface InscriptionFormModerneProps
- ✅ Le début du composant
- ✅ Les hooks (useState, createInscription, etc.)
- ✅ Les handlers (handleChange, handleNext, handlePrevious)
- ✅ Le return avec Dialog
- ✅ Le Stepper
- ✅ L'AnimatePresence
- ✅ **ÉTAPE 1 : Informations Élève** (complet)
- ✅ **ÉTAPE 2 : Tuteur/Tutrice** (complet)

**⚠️ IMPORTANT** : Part1 se termine par `)}` à la ligne 407 (fin de l'étape 2)

---

## 🔧 ÉTAPE 4 : Ajouter Part2 (ÉTAPES 3 et 4)

### ✅ Action : Copiez UNIQUEMENT les lignes 6 à 165 de `Part2`

**NE COPIEZ PAS** :
- ❌ Les 5 premières lignes (commentaire)

**COPIEZ** :
- ✅ Ligne 6 à 165 : Les étapes 3 et 4

Cela inclut :
- ✅ **ÉTAPE 3 : Paiement & Notes** (complet)
- ✅ **ÉTAPE 4 : Récapitulatif** (complet)

**⚠️ IMPORTANT** : Part2 se termine par `)}` à la ligne 165 (fin de l'étape 4)

---

## 🔧 ÉTAPE 5 : Ajouter Part3 (handleSubmit + Navigation)

### ✅ Action A : Ajouter handleSubmit AVANT le return

**Où ?** Juste après `handlePrevious` et AVANT `return (`

**Copiez** : Lignes 6 à 41 de Part3

```typescript
  const handleSubmit = async () => {
    try {
      const data = {
        schoolId: 'SCHOOL_ID_HERE',
        academicYear: '2024-2025',
        // ... reste du code
      };
      
      if (isEditing) {
        await updateInscription.mutateAsync({ id: inscriptionId!, ...data });
        toast.success('✅ Inscription modifiée avec succès');
      } else {
        await createInscription.mutateAsync(data);
        toast.success('✅ Inscription créée avec succès');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('❌ Erreur lors de l\'enregistrement');
      console.error(error);
    }
  };
```

### ✅ Action B : Ajouter la Navigation

**Où ?** Juste après `</motion.div>` et `</AnimatePresence>`

**Copiez** : Lignes 50 à 89 de Part3

```typescript
        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t-2 mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-6 text-base"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Précédent
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-[#1D3557] hover:bg-[#1D3557]/90 px-8 py-6 text-base font-semibold"
            >
              Suivant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createInscription.isPending || updateInscription.isPending}
              className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 px-8 py-6 text-base font-semibold"
            >
              {createInscription.isPending || updateInscription.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {isEditing ? 'Enregistrer' : 'Créer l\'inscription'}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## ✅ ÉTAPE 6 : Vérifier la structure finale

Votre fichier doit avoir cette structure :

```typescript
// IMPORTS (de Part1)
import { useState } from 'react';
import { ... } from 'lucide-react';
// ... tous les imports

// CONSTANTES (de Part1)
const STEPS = [...];
const NIVEAUX_SCOLAIRES = [...];

// INTERFACE (de Part1)
interface InscriptionFormModerneProps { ... }

// COMPOSANT (de Part1)
export const InscriptionFormModerne = ({ ... }) => {
  // HOOKS (de Part1)
  const isEditing = !!inscriptionId;
  const createInscription = useCreateInscription();
  const updateInscription = useUpdateInscription();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ ... });
  
  // HANDLERS (de Part1)
  const handleChange = (field: string, value: any) => { ... };
  const handleNext = () => { ... };
  const handlePrevious = () => { ... };
  
  // HANDLER SUBMIT (de Part3)
  const handleSubmit = async () => { ... };

  // RENDER
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>...</DialogHeader>
        
        {/* Stepper (de Part1) */}
        <div className="flex items-center...">...</div>
        
        {/* Contenu (de Part1 + Part2) */}
        <AnimatePresence mode="wait">
          <motion.div ...>
            {/* Étape 1 - de Part1 */}
            {currentStep === 1 && (...)}
            
            {/* Étape 2 - de Part1 */}
            {currentStep === 2 && (...)}
            
            {/* Étape 3 - de Part2 */}
            {currentStep === 3 && (...)}
            
            {/* Étape 4 - de Part2 */}
            {currentStep === 4 && (...)}
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation - de Part3 */}
        <div className="flex justify-between...">...</div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🎯 ÉTAPE 7 : Tester

```bash
npm run dev
```

Naviguez vers la page des inscriptions et testez le formulaire !

---

## ⚠️ Points d'attention

### ❌ Erreurs courantes à éviter

1. **Ne pas copier les commentaires de Part2 et Part3**
   - Part2 commence à la ligne 6 (pas ligne 1)
   - Part3 : ne copiez que handleSubmit et Navigation

2. **Ne pas oublier handleSubmit**
   - Il doit être AVANT le return
   - Après handlePrevious

3. **Bien fermer toutes les accolades**
   - Vérifiez que chaque `{` a son `}`
   - Utilisez l'auto-formatage de VS Code (Shift+Alt+F)

4. **Vérifier les imports**
   - Tous les imports doivent être en haut du fichier
   - Pas d'imports en double

---

## ✅ Checklist finale

- [ ] Part1 copié en entier (ligne 1 à 407)
- [ ] Part2 copié (ligne 6 à 165, SANS les commentaires)
- [ ] handleSubmit ajouté (Part3, ligne 6 à 41)
- [ ] Navigation ajoutée (Part3, ligne 50 à 89)
- [ ] Aucune erreur TypeScript
- [ ] Fichier formaté (Shift+Alt+F)
- [ ] Test dans le navigateur

---

## 🎉 Félicitations !

Votre formulaire moderne est prêt ! 🚀🇨🇬

**Prochaine étape** : Utilisez-le dans votre page d'inscriptions !

```typescript
import { InscriptionFormModerne } from './components/InscriptionFormModerne';

<InscriptionFormModerne
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => {
    // Rafraîchir la liste
  }}
/>
```
