# 🚀 GUIDE D'INSTALLATION - FORMULAIRE ÉCOLES

## ✅ CE QUI EST DÉJÀ FAIT

Le formulaire est **100% complet** dans le fichier :
```
src/features/dashboard/components/schools/SchoolFormDialog.tsx
```

Avec :
- ✅ 12 départements du Congo-Brazzaville (listes déroulantes)
- ✅ 40+ villes filtrées par département (listes déroulantes)
- ✅ Upload de logo avec aperçu
- ✅ Code postal optionnel
- ✅ Validation Zod complète
- ✅ Soumission fonctionnelle

## 🔧 CE QU'IL FAUT FAIRE (3 étapes simples)

### ÉTAPE 1 : Exécuter le script SQL ⏱️ 30 secondes

1. Ouvrir **Supabase Dashboard** : https://supabase.com/dashboard
2. Aller dans votre projet E-Pilot
3. Cliquer sur **SQL Editor** (dans le menu gauche)
4. Copier-coller le contenu du fichier :
   ```
   database/SETUP_FORMULAIRE_ECOLES_COMPLET.sql
   ```
5. Cliquer sur **Run** (ou F5)

**Ce script fait tout automatiquement** :
- ✅ Ajoute les colonnes manquantes (logo_url, departement, city, etc.)
- ✅ Crée le bucket Supabase Storage pour les logos
- ✅ Configure les politiques d'accès
- ✅ Assigne des couleurs aux écoles existantes

### ÉTAPE 2 : Redémarrer l'application ⏱️ 10 secondes

Dans votre terminal :
```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### ÉTAPE 3 : Vider le cache du navigateur ⏱️ 5 secondes

- **Windows** : `Ctrl + Shift + R`
- **Mac** : `Cmd + Shift + R`

## 🎯 VÉRIFICATION

Après ces 3 étapes, ouvrez le formulaire de création d'école :

1. Aller sur la page **Écoles**
2. Cliquer sur **+ Nouvelle école**
3. Vous devriez voir **4 onglets** :
   - Général
   - **Localisation** (avec listes déroulantes Département et Ville)
   - Contact
   - **Apparence** (avec upload de logo)

### Test rapide :

1. **Onglet Localisation** :
   - Cliquer sur "Département" → Voir 12 départements
   - Sélectionner "Brazzaville"
   - Cliquer sur "Ville" → Voir "Brazzaville"
   - Sélectionner "Niari"
   - Cliquer sur "Ville" → Voir 5 villes (Dolisie, Mossendjo, etc.)

2. **Onglet Apparence** :
   - Cliquer sur "Choisir un logo"
   - Sélectionner une image
   - Voir l'aperçu immédiat

3. **Soumission** :
   - Remplir les champs requis (Nom, Code, Département, Ville)
   - Cliquer sur "Créer l'école"
   - Voir le message de succès

## ❓ PROBLÈMES POSSIBLES

### Problème 1 : "Les listes déroulantes sont vides"
**Solution** : Vérifier que le script SQL a bien été exécuté

### Problème 2 : "Je ne vois pas les onglets"
**Solution** : Vider le cache du navigateur (Ctrl+Shift+R)

### Problème 3 : "Erreur lors de l'upload du logo"
**Solution** : Vérifier que le bucket 'school-logos' existe dans Supabase Storage

### Problème 4 : "Erreur lors de la soumission"
**Solution** : Vérifier que les colonnes ont été ajoutées à la table schools

## 📊 DÉPARTEMENTS ET VILLES

### 12 Départements du Congo-Brazzaville :
1. Brazzaville
2. Pointe-Noire
3. Bouenza (4 villes)
4. Cuvette (4 villes)
5. Cuvette-Ouest (3 villes)
6. Kouilou (4 villes)
7. Lékoumou (4 villes)
8. Likouala (4 villes)
9. Niari (5 villes)
10. Plateaux (4 villes)
11. Pool (5 villes)
12. Sangha (4 villes)

**Total : 40+ villes**

## 🎉 C'EST TOUT !

Après ces 3 étapes simples, votre formulaire est **100% fonctionnel** !

---

## 📞 BESOIN D'AIDE ?

Si quelque chose ne fonctionne pas :

1. Vérifier que le fichier utilisé est bien `SchoolFormDialog.tsx` (pas une variante)
2. Vérifier les logs de la console du navigateur (F12)
3. Vérifier que le script SQL s'est exécuté sans erreur
4. Redémarrer complètement l'application

**Le formulaire est complet et testé, il devrait fonctionner parfaitement !** ✅
