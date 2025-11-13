# Guide de Test - Formulaire d'Inscription

## 🎯 Objectif

Tester le formulaire d'inscription en 6 étapes et identifier pourquoi le bouton "Suivant" ne fonctionne pas.

## ✅ Corrections appliquées

1. **Ajout de logs détaillés** dans `handleNext()` pour voir les erreurs de validation
2. **Affichage des erreurs spécifiques** avec toast pour chaque champ invalide
3. **Types Supabase mis à jour** avec tous les champs manquants

## 📋 Structure de la table inscriptions (BDD)

Voici les champs de la table selon votre INSERT :

### **Champs obligatoires** :
- `school_id` (UUID)
- `academic_year` (string, ex: "2024-2025")
- `inscription_number` (string, ex: "INS-2024-001")
- `student_first_name` (string)
- `student_last_name` (string)
- `student_date_of_birth` (date)
- `student_gender` ('M' | 'F')
- `requested_level` (string, ex: "5EME")
- `serie` (string, ex: "A")
- `parent1_first_name` (string)
- `parent1_last_name` (string)
- `parent1_phone` (string, ex: "+242 06 123 4567")
- `est_redoublant` (boolean)
- `est_affecte` (boolean)
- `a_aide_sociale` (boolean)
- `est_pensionnaire` (boolean)
- `a_bourse` (boolean)
- `frais_inscription` (decimal)
- `frais_scolarite` (decimal)
- `documents` (JSON, ex: [])
- `status` (enum: 'en_attente', 'validee', 'refusee', 'inscrit')
- `workflow_step` (string, ex: 'soumission')

### **Champs optionnels** :
- `student_place_of_birth`
- `student_photo`
- `requested_class_id`
- `parent1_email`
- `parent1_profession`
- `parent2_*` (tous optionnels)
- `address`, `city`, `region`
- `numero_affectation`
- `frais_cantine`, `frais_transport`
- `internal_notes`
- `rejection_reason`
- `submitted_at`, `validated_at`, `validated_by`

## 🔍 Étapes du formulaire

### **Étape 1 : Informations Générales** ✅
**Champs affichés** :
- ✅ `student_last_name` (obligatoire)
- ✅ `student_postnom` (optionnel)
- ✅ `student_first_name` (obligatoire)
- ✅ `student_gender` (obligatoire)
- ✅ `student_date_of_birth` (obligatoire)
- ✅ `student_place_of_birth` (optionnel)
- ✅ `student_nationality` (optionnel, défaut: "Congolaise")
- ✅ `student_national_id` (optionnel)
- ✅ `address`, `city`, `region` (optionnels)
- ✅ `student_phone`, `student_email` (optionnels)

**Validation** :
- Nom et prénom : min 2 caractères
- Date de naissance : âge entre 3 et 30 ans
- Téléphone : format +242 XX XXX XXXX
- Email : doit finir par .cg ou .com

### **Étape 2 : Parents / Tuteurs** ✅
**Champs affichés** :
- ✅ `parent1_first_name` (obligatoire)
- ✅ `parent1_last_name` (obligatoire)
- ✅ `parent1_phone` (obligatoire)
- ✅ `parent1_email` (optionnel)
- ✅ `parent1_profession` (optionnel)
- ✅ `parent2_*` (tous optionnels)

### **Étape 3 : Informations Scolaires** ✅
**Champs affichés** :
- ✅ `academic_year` (obligatoire)
- ✅ `requested_level` (obligatoire)
- ✅ `serie` (optionnel)
- ✅ `type_inscription` (obligatoire: nouvelle/réinscription/transfert)
- ✅ `ancienne_ecole` (si transfert)
- ✅ `est_redoublant` (boolean)
- ✅ `est_affecte` (boolean)
- ✅ `numero_affectation` (si affecté)

### **Étape 4 : Frais de Scolarité** ✅
**Champs affichés** :
- ✅ `frais_inscription` (obligatoire)
- ✅ `frais_scolarite` (obligatoire)
- ✅ `frais_cantine` (optionnel)
- ✅ `frais_transport` (optionnel)
- ✅ `a_aide_sociale` (boolean)
- ✅ `est_pensionnaire` (boolean)
- ✅ `a_bourse` (boolean)

### **Étape 5 : Documents** ✅
**Champs affichés** :
- Upload de documents (photo, certificat, relevé de notes, etc.)
- Stocké dans le champ `documents` (JSON)

### **Étape 6 : Récapitulatif** ✅
**Champs affichés** :
- ✅ `internal_notes` (optionnel)
- Résumé de toutes les informations

## 🧪 Plan de test

### **Test 1 : Étape 1 - Champs obligatoires**
1. Ouvrir le formulaire "Nouvelle inscription"
2. Laisser les champs vides
3. Cliquer sur "Suivant"
4. **Résultat attendu** : Messages d'erreur pour chaque champ obligatoire

### **Test 2 : Étape 1 - Validation**
1. Remplir :
   - Nom : "DUPONT"
   - Prénom : "Jean"
   - Sexe : "Masculin"
   - Date de naissance : "2010-05-15"
2. Cliquer sur "Suivant"
3. **Résultat attendu** : Passage à l'étape 2

### **Test 3 : Étape 2 - Parents**
1. Remplir :
   - Prénom père : "Pierre"
   - Nom père : "DUPONT"
   - Téléphone : "+242 06 123 4567"
2. Cliquer sur "Suivant"
3. **Résultat attendu** : Passage à l'étape 3

### **Test 4 : Étape 3 - Scolaire**
1. Remplir :
   - Année académique : "2024-2025"
   - Niveau : "5EME"
   - Type : "Nouvelle inscription"
2. Cliquer sur "Suivant"
3. **Résultat attendu** : Passage à l'étape 4

### **Test 5 : Soumission complète**
1. Compléter toutes les étapes
2. Cliquer sur "Soumettre"
3. **Résultat attendu** : Inscription créée avec succès

## 🐛 Problèmes possibles

### **Problème 1 : Bouton "Suivant" ne fait rien**
**Causes possibles** :
- ❌ Validation échoue silencieusement
- ❌ Champs obligatoires non remplis
- ❌ Format de données incorrect

**Solution** : Avec les logs ajoutés, ouvrez la console du navigateur (F12) et regardez les erreurs affichées.

### **Problème 2 : Champs "troqués" (inversés)**
**Causes possibles** :
- ❌ Ordre des champs dans le formulaire ne correspond pas à l'attente
- ❌ Labels incorrects

**Solution** : Vérifier l'ordre dans `InscriptionStep1.tsx` (Nom, Post-nom, Prénom)

### **Problème 3 : Données non sauvegardées**
**Causes possibles** :
- ❌ Transformation des données incorrecte dans `onSubmit`
- ❌ Champs manquants dans la mutation

**Solution** : Vérifier le mapping dans `InscriptionFormComplet.tsx` ligne 204-213

## 🔧 Actions de débogage

1. **Ouvrir la console du navigateur** (F12)
2. **Aller sur** : `/dashboard/modules/inscriptions`
3. **Cliquer sur** : "Nouvelle inscription"
4. **Remplir** l'étape 1 avec les données minimales
5. **Cliquer sur** "Suivant"
6. **Observer** les messages d'erreur dans :
   - Console (logs)
   - Toasts (notifications)
   - Sous les champs (messages rouges)

## 📊 Checklist de vérification

- [ ] Console ouverte (F12)
- [ ] Formulaire ouvert
- [ ] Champs obligatoires remplis
- [ ] Bouton "Suivant" cliqué
- [ ] Erreurs observées dans la console
- [ ] Messages toast affichés
- [ ] Étape suivante atteinte (ou non)

## 💡 Conseils

1. **Commencez simple** : Remplissez uniquement les champs obligatoires
2. **Lisez les erreurs** : Les messages vous diront exactement quel champ pose problème
3. **Testez étape par étape** : Ne passez pas à l'étape suivante tant que la précédente n'est pas validée
4. **Vérifiez les formats** : Téléphone (+242...), Email (.cg ou .com), Date (YYYY-MM-DD)

---

**Date** : 31 octobre 2025  
**Statut** : 🧪 **PRÊT POUR LES TESTS**  
**Prochaine étape** : Ouvrir le formulaire et tester avec les logs activés
