# 📖 Guide Utilisateur - Gestion des Groupes Scolaires

## 🎯 Nouvelles fonctionnalités disponibles

### **6 actions de gestion**

Chaque groupe scolaire dispose maintenant de **6 actions** accessibles via le menu **⋮** (trois points verticaux) :

---

## 1️⃣ Voir détails 👁️

**Quand l'utiliser** : Pour consulter toutes les informations d'un groupe

**Ce qui s'affiche** :
- Informations générales (nom, code, région, ville)
- Administrateur assigné
- Plan d'abonnement
- Statut actuel
- Statistiques (nombre d'écoles, élèves, personnel)
- Dates de création et modification

**Action** : Cliquez sur **"Voir détails"** dans le menu

---

## 2️⃣ Modifier ✏️

**Quand l'utiliser** : Pour mettre à jour les informations d'un groupe

**Ce que vous pouvez modifier** :
- Nom du groupe
- Code
- Région et ville
- Adresse
- Téléphone
- Site web
- Logo
- Administrateur
- Plan d'abonnement
- Description

**Action** : Cliquez sur **"Modifier"** dans le menu

---

## 3️⃣ Activer ✅

**Quand l'utiliser** : Pour réactiver un groupe inactif ou suspendu

**Disponible si** : Le groupe a le statut **Inactif** ou **Suspendu**

**Effet** :
- Le groupe passe au statut **Actif**
- Le badge devient vert
- Le groupe est pleinement opérationnel
- Notification de confirmation affichée

**Action** : Cliquez sur **"Activer"** (texte vert) dans le menu

---

## 4️⃣ Désactiver ❌

**Quand l'utiliser** : Pour désactiver temporairement un groupe actif

**Disponible si** : Le groupe a le statut **Actif**

**Effet** :
- Le groupe passe au statut **Inactif**
- Le badge devient gris
- Le groupe est temporairement désactivé
- Peut être réactivé à tout moment
- Notification de confirmation affichée

**Action** : Cliquez sur **"Désactiver"** (texte orange) dans le menu

---

## 5️⃣ Suspendre 🚫

**Quand l'utiliser** : Pour suspendre un groupe (mesure disciplinaire ou administrative)

**Disponible si** : Le groupe n'est **pas déjà suspendu**

**Effet** :
- Le groupe passe au statut **Suspendu**
- Le badge devient rouge
- Le groupe est bloqué
- Peut être réactivé par un administrateur
- Notification d'avertissement affichée

**Action** : Cliquez sur **"Suspendre"** (texte jaune) dans le menu

---

## 6️⃣ Supprimer définitivement 🗑️

**⚠️ ATTENTION : Action irréversible !**

**Quand l'utiliser** : Pour supprimer définitivement un groupe de la base de données

**Disponible** : Toujours (pour tous les statuts)

**Ce qui se passe** :

### **Étape 1 : Boîte de dialogue de confirmation**
Une fenêtre s'affiche avec :
- ⚠️ Icône d'alerte rouge
- Informations du groupe (nom, code, région)
- **Avertissement si données associées** :
  - Nombre d'écoles
  - Nombre d'élèves
  - Nombre de personnel
- Message d'irréversibilité en rouge

### **Étape 2 : Confirmation**
Deux options :
- **Annuler** : Ferme la fenêtre, rien n'est supprimé
- **Supprimer définitivement** : Supprime le groupe et toutes ses données

### **Étape 3 : Suppression**
- Spinner de chargement pendant la suppression
- Notification de succès ou d'erreur
- Liste rafraîchie automatiquement

**Action** : Cliquez sur **"Supprimer définitivement"** (texte rouge) dans le menu

---

## 📊 Matrice des actions disponibles

| Statut du groupe | Actions disponibles |
|------------------|---------------------|
| **Actif** 🟢 | Voir • Modifier • Désactiver • Suspendre • Supprimer |
| **Inactif** ⚪ | Voir • Modifier • Activer • Suspendre • Supprimer |
| **Suspendu** 🔴 | Voir • Modifier • Activer • Désactiver • Supprimer |

---

## 🎨 Codes couleur

### **Badges de statut**
- 🟢 **Actif** : Badge vert - Groupe opérationnel
- ⚪ **Inactif** : Badge gris - Groupe temporairement désactivé
- 🔴 **Suspendu** : Badge rouge - Groupe bloqué

### **Actions dans le menu**
- 👁️ **Voir détails** : Gris (toujours disponible)
- ✏️ **Modifier** : Gris (toujours disponible)
- ✅ **Activer** : Vert (si inactif/suspendu)
- ❌ **Désactiver** : Orange (si actif)
- 🚫 **Suspendre** : Jaune (si non suspendu)
- 🗑️ **Supprimer** : Rouge (toujours disponible)

---

## 💡 Bonnes pratiques

### **Avant de supprimer un groupe**
1. ✅ Vérifiez les données associées (écoles, élèves, personnel)
2. ✅ Exportez les données importantes si nécessaire
3. ✅ Informez les administrateurs concernés
4. ✅ Assurez-vous que c'est bien la bonne action

### **Gestion des statuts**
- **Désactiver** : Pour une suspension temporaire (vacances, maintenance)
- **Suspendre** : Pour une mesure disciplinaire ou administrative
- **Activer** : Pour remettre en service un groupe

### **En cas d'erreur**
- Si une action échoue, un message d'erreur s'affiche
- Vérifiez votre connexion internet
- Réessayez l'action
- Contactez le support si le problème persiste

---

## 🔔 Notifications

### **Messages de succès** ✅
- "Groupe activé - [Nom] est maintenant actif"
- "Groupe désactivé - [Nom] a été désactivé"
- "Groupe suspendu - [Nom] a été suspendu"
- "Groupe supprimé - [Nom] a été supprimé définitivement"

### **Messages d'erreur** ❌
- "Erreur - Impossible d'activer le groupe"
- "Erreur - Impossible de désactiver le groupe"
- "Erreur - Impossible de suspendre le groupe"
- "Erreur - Impossible de supprimer le groupe"

---

## 📱 Accès aux actions

### **Vue Liste (Tableau)**
1. Trouvez le groupe dans le tableau
2. Cliquez sur le bouton **⋮** (trois points) dans la colonne "Actions"
3. Sélectionnez l'action souhaitée dans le menu

### **Vue Grille (Cards)**
1. Trouvez la carte du groupe
2. Cliquez sur le bouton **⋮** (trois points) en haut à droite de la carte
3. Sélectionnez l'action souhaitée dans le menu

---

## ❓ Questions fréquentes

### **Q : Puis-je annuler une suppression ?**
**R** : Non, la suppression est définitive. C'est pourquoi une confirmation détaillée est demandée.

### **Q : Que se passe-t-il si je supprime un groupe avec des écoles ?**
**R** : Toutes les données associées (écoles, élèves, personnel) seront également supprimées. Un avertissement vous informe avant la suppression.

### **Q : Quelle est la différence entre Désactiver et Suspendre ?**
**R** : 
- **Désactiver** : Suspension temporaire normale (maintenance, vacances)
- **Suspendre** : Mesure disciplinaire ou administrative (problème de paiement, non-conformité)

### **Q : Puis-je activer un groupe suspendu ?**
**R** : Oui, un administrateur peut activer un groupe suspendu à tout moment.

### **Q : Les actions sont-elles enregistrées ?**
**R** : Oui, toutes les actions sont enregistrées dans le journal d'activité avec l'utilisateur, la date et l'heure.

---

## 🆘 Support

**En cas de problème** :
- 📧 Email : support@e-pilot.cg
- 📞 Téléphone : +242 XX XXX XXXX
- 💬 Chat : Disponible dans l'application

---

**Version** : 2.0
**Date** : 31 octobre 2025
**Projet** : E-Pilot Congo 🇨🇬
