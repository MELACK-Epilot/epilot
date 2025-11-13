# 🎯 ASSEMBLAGE MANUEL SIMPLIFIÉ

## Étape 1 : Ouvrir VS Code

1. Ouvrez VS Code
2. Ouvrez le fichier `InscriptionFormModerne_Part1.tsx`
3. **Sélectionnez TOUT** (Ctrl+A)
4. **Copiez** (Ctrl+C)

## Étape 2 : Créer le nouveau fichier

1. Créez un nouveau fichier : `InscriptionFormModerne.tsx`
2. **Collez** (Ctrl+V) tout le contenu de Part1

## Étape 3 : Ajouter handleSubmit

1. Trouvez la ligne avec `const handlePrevious` (ligne ~111)
2. Allez à la fin de cette fonction (après le `};` de handlePrevious)
3. **Ajoutez** ce code :

```typescript
  const handleSubmit = async () => {
    try {
      const data = {
        schoolId: 'SCHOOL_ID_HERE',
        academicYear: '2024-2025',
        studentFirstName: formData.studentFirstName,
        studentLastName: formData.studentLastName,
        studentGender: formData.studentGender,
        studentDateOfBirth: formData.studentDateOfBirth,
        studentPlaceOfBirth: formData.studentPlaceOfBirth,
        requestedLevel: formData.requestedLevel,
        address: formData.address,
        parent1: {
          firstName: formData.tuteurNomPrenom.split(' ')[1] || '',
          lastName: formData.tuteurNomPrenom.split(' ')[0] || '',
          phone: formData.tuteurTelephone,
          profession: formData.tuteurProfession,
        },
        notes: `Type: ${formData.typeInscription}\nClasse antérieure: ${formData.classeAnterieure}\nPaiement Juin: ${formData.moisPaye ? 'PAYÉ' : formData.moisNonPaye ? 'NON PAYÉ' : 'Non renseigné'}\n\n${formData.notes}`,
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

## Étape 4 : Ajouter les étapes 3 et 4

1. Ouvrez `InscriptionFormModerne_Part2.tsx`
2. **Copiez** de la ligne 6 à la ligne 165 (tout sauf les commentaires du début)
3. **Collez** à la fin du fichier (après l'étape 2, avant la fermeture de `</motion.div>`)

## Étape 5 : Ajouter la navigation

1. Trouvez `</AnimatePresence>` (vers la fin)
2. Juste après, **ajoutez** :

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

## Étape 6 : Formater

1. **Formatez** le fichier : `Shift+Alt+F`
2. **Sauvegardez** : `Ctrl+S`

## ✅ C'EST FAIT !

Votre formulaire `InscriptionFormModerne.tsx` est prêt ! 🎉

Testez-le avec :
```bash
npm run dev
```
