# ✅ CHECKLIST TEST DASHBOARD ADMIN GROUPE

## 🎯 Tests à Effectuer

### **1. KPIs (4 Cards)**

#### Test 1.1 : Affichage des Données
- [ ] Se connecter en tant qu'Admin Groupe
- [ ] Vérifier que 4 KPIs s'affichent :
  - [ ] **Écoles** : Nombre correct d'écoles du groupe
  - [ ] **Élèves** : Total des élèves de toutes les écoles
  - [ ] **Personnel** : Total du personnel de toutes les écoles
  - [ ] **Utilisateurs Actifs** : Nombre d'utilisateurs actifs

#### Test 1.2 : Tendances
- [ ] Vérifier que chaque KPI affiche un badge de tendance (%)
- [ ] Vérifier l'icône :
  - [ ] TrendingUp (↗) si tendance positive
  - [ ] TrendingDown (↘) si tendance négative
- [ ] Vérifier la couleur du badge (vert/rouge)

#### Test 1.3 : Navigation
- [ ] Cliquer sur "Écoles" → Redirige vers `/dashboard/schools`
- [ ] Cliquer sur "Élèves" → Redirige vers `/dashboard/schools`
- [ ] Cliquer sur "Personnel" → Redirige vers `/dashboard/users`
- [ ] Cliquer sur "Utilisateurs Actifs" → Redirige vers `/dashboard/users`

---

### **2. WelcomeCard**

#### Test 2.1 : Informations Groupe
- [ ] Logo du groupe affiché (ou initiale si pas de logo)
- [ ] Nom du groupe affiché
- [ ] Message "Bonjour {prénom}" affiché
- [ ] Nombre d'écoles correct
- [ ] Nombre d'élèves correct

#### Test 2.2 : Actions Rapides
- [ ] Bouton "Ajouter École" → Redirige vers `/dashboard/schools?action=create`
- [ ] Bouton "Ajouter Utilisateur" → Redirige vers `/dashboard/users?action=create`
- [ ] Bouton "Activité" → Redirige vers `/dashboard/activity-logs`

---

### **3. Tendances (Card Croissance)**

#### Test 3.1 : Affichage Dynamique
- [ ] Si tendance positive (≥ 0%) :
  - [ ] Card verte (`from-[#2A9D8F]/5`)
  - [ ] Icône TrendingUp
  - [ ] Titre "Croissance Positive"
  - [ ] Texte "augmentent de +X%"
- [ ] Si tendance négative (< 0%) :
  - [ ] Card rouge (`from-[#E63946]/5`)
  - [ ] Icône TrendingDown
  - [ ] Titre "Attention Requise"
  - [ ] Texte "diminuent de -X%"

#### Test 3.2 : Données Affichées
- [ ] Pourcentage de tendance correct (calculé)
- [ ] Nombre d'élèves affiché
- [ ] Nombre de personnel affiché

---

### **4. Recommandations (Card Intelligente)**

#### Test 4.1 : Logique Conditionnelle
- [ ] Si < 3 écoles :
  - [ ] Message : "Ajoutez plus d'écoles pour développer votre groupe"
- [ ] Si ratio élèves/staff > 30 :
  - [ ] Message : "Envisagez de recruter plus de personnel (ratio élèves/staff élevé)"
- [ ] Sinon :
  - [ ] Message : "Excellent équilibre ! Continuez à optimiser vos processus"

#### Test 4.2 : Métriques Affichées
- [ ] Nombre d'écoles affiché
- [ ] Ratio élèves/staff calculé et affiché (format : X.X)

---

### **5. Activité Récente**

#### Test 5.1 : Données Filtrées
- [ ] Affiche uniquement les activités du groupe
- [ ] Maximum 10 activités
- [ ] Triées par date (plus récent en premier)
- [ ] Badge "Dernières 24h" affiché

#### Test 5.2 : Affichage
- [ ] Icône appropriée selon le type (School, Users, DollarSign, etc.)
- [ ] Titre de l'activité
- [ ] Description
- [ ] Temps écoulé (ex: "Il y a 2h")
- [ ] Icône CheckCircle si succès

#### Test 5.3 : État Vide
- [ ] Si aucune activité :
  - [ ] Icône Clock
  - [ ] Message "Aucune activité récente"

---

### **6. Alertes**

#### Test 6.1 : Types d'Alertes
- [ ] Paiements en retard (si applicable)
  - [ ] Icône DollarSign
  - [ ] Nombre de paiements
  - [ ] Montant total
  - [ ] Bouton "Voir détails"
- [ ] Utilisateurs inactifs (si applicable)
  - [ ] Icône Users
  - [ ] Nombre d'utilisateurs
  - [ ] Bouton "Gérer"
- [ ] Alertes système (si applicable)
  - [ ] Icône AlertCircle
  - [ ] Titre et message
  - [ ] Bouton "Consulter"

#### Test 6.2 : État Vide
- [ ] Si aucune alerte :
  - [ ] Icône AlertTriangle verte
  - [ ] Message "Tout va bien !"
  - [ ] Badge "0" affiché

---

### **7. Actions Rapides (Grid)**

#### Test 7.1 : Navigation
- [ ] "Gérer Écoles" → `/dashboard/schools`
- [ ] "Gérer Utilisateurs" → `/dashboard/users`
- [ ] "Finances" → `/dashboard/finances`
- [ ] "Rapports" → `/dashboard/reports`
- [ ] "Modules" → `/dashboard/my-modules`
- [ ] "Communication" → `/dashboard/communication`

#### Test 7.2 : Animations
- [ ] Hover : Scale + Shadow
- [ ] Effet de brillance diagonal
- [ ] Barre de progression en bas

---

### **8. Temps Réel**

#### Test 8.1 : Mise à Jour Automatique
- [ ] Ouvrir le dashboard
- [ ] Dans un autre onglet, ajouter une école
- [ ] Vérifier que le KPI "Écoles" se met à jour automatiquement (max 60s)
- [ ] Vérifier les logs console : "📊 [Temps Réel] Mise à jour écoles détectée"

#### Test 8.2 : Utilisateurs
- [ ] Ajouter un utilisateur dans un autre onglet
- [ ] Vérifier que le KPI "Utilisateurs Actifs" se met à jour
- [ ] Vérifier les logs console : "👥 [Temps Réel] Mise à jour utilisateurs détectée"

---

### **9. Performance**

#### Test 9.1 : Chargement Initial
- [ ] Dashboard se charge en < 2 secondes
- [ ] Skeletons affichés pendant le chargement
- [ ] Animations fluides (Framer Motion)

#### Test 9.2 : Cache
- [ ] Naviguer vers une autre page
- [ ] Revenir au dashboard
- [ ] Données affichées instantanément (cache React Query)

---

### **10. Responsive**

#### Test 10.1 : Mobile (< 640px)
- [ ] KPIs en 1 colonne
- [ ] Actions rapides en 1 colonne
- [ ] Texte des boutons masqué (icônes uniquement)
- [ ] WelcomeCard adapté

#### Test 10.2 : Tablet (640px - 1024px)
- [ ] KPIs en 2 colonnes
- [ ] Actions rapides en 2 colonnes
- [ ] Layout optimisé

#### Test 10.3 : Desktop (> 1024px)
- [ ] KPIs en 4 colonnes
- [ ] Actions rapides en 3 colonnes
- [ ] Activité + Alertes côte à côte (2/3 + 1/3)

---

## 🐛 Tests de Régression

### Test R1 : Super Admin
- [ ] Se connecter en tant que Super Admin
- [ ] Vérifier que le dashboard Super Admin s'affiche (pas GroupDashboard)
- [ ] Vérifier les KPIs Super Admin (Groupes Scolaires, MRR, etc.)

### Test R2 : Autres Rôles
- [ ] Se connecter en tant que Directeur
- [ ] Vérifier que le dashboard approprié s'affiche
- [ ] Pas d'erreur console

---

## 🔍 Tests Console

### Logs Attendus
```
🔄 [Admin Groupe] Activation temps réel pour groupe: {groupId}
📊 [Temps Réel] Mise à jour écoles détectée: {payload}
👥 [Temps Réel] Mise à jour utilisateurs détectée: {payload}
🔌 [Admin Groupe] Déconnexion temps réel
```

### Erreurs à Vérifier
- [ ] Aucune erreur TypeScript
- [ ] Aucune erreur 404
- [ ] Aucune erreur Supabase
- [ ] Aucun warning React

---

## 📊 Tests de Données

### Scénario 1 : Nouveau Groupe (0 écoles)
- [ ] KPI "Écoles" = 0
- [ ] KPI "Élèves" = 0
- [ ] KPI "Personnel" = 0
- [ ] Recommandation : "Ajoutez plus d'écoles"

### Scénario 2 : Petit Groupe (1-2 écoles)
- [ ] Données correctes affichées
- [ ] Tendances calculées
- [ ] Recommandation : "Ajoutez plus d'écoles"

### Scénario 3 : Groupe Moyen (3-5 écoles)
- [ ] Données correctes affichées
- [ ] Tendances calculées
- [ ] Recommandation basée sur ratio élèves/staff

### Scénario 4 : Grand Groupe (> 5 écoles)
- [ ] Données correctes affichées
- [ ] Tendances calculées
- [ ] Performance maintenue

---

## ✅ Checklist Finale

- [ ] Tous les tests passent
- [ ] Aucune erreur console
- [ ] Performance optimale
- [ ] Responsive fonctionnel
- [ ] Temps réel opérationnel
- [ ] Données cohérentes
- [ ] Navigation fluide
- [ ] Animations smooth

---

## 🎯 Critères de Validation

| Critère | Objectif | Statut |
|---------|----------|--------|
| **Fonctionnalités** | 100% | ⬜ |
| **Performance** | < 2s chargement | ⬜ |
| **Temps Réel** | < 60s mise à jour | ⬜ |
| **Responsive** | 3 breakpoints | ⬜ |
| **Erreurs** | 0 erreur | ⬜ |
| **UX** | Fluide | ⬜ |

---

**Date** : 11 novembre 2025  
**Version** : 2.0  
**Statut** : ⬜ À TESTER
