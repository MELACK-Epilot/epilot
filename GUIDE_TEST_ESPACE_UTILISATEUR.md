# 🧪 GUIDE DE TEST - Espace Utilisateur École

## 🎯 Objectif
Tester l'espace utilisateur école nouvellement créé pour vérifier son bon fonctionnement.

---

## 🚀 Démarrage Rapide

### 1. Lancer l'Application
```bash
npm run dev
```

### 2. Se Connecter
1. Aller sur `http://localhost:5173/login`
2. Se connecter avec un compte utilisateur école (enseignant, CPE, comptable, etc.)
3. **Important** : Ne PAS utiliser `super_admin` ou `admin_groupe`

### 3. Accéder à l'Espace Utilisateur
Après connexion, naviguer vers : `http://localhost:5173/user`

---

## ✅ Checklist de Test

### 🎨 Layout & Navigation

#### Sidebar
- [ ] La sidebar s'affiche correctement
- [ ] Le logo E-Pilot est visible
- [ ] Les informations utilisateur (nom, rôle, avatar) sont affichées
- [ ] Les items de navigation sont adaptés au rôle
- [ ] Le bouton toggle (collapse/expand) fonctionne
- [ ] L'item actif est surligné en vert (#2A9D8F)
- [ ] Le bouton déconnexion est présent et fonctionne

#### Header
- [ ] Le header est sticky (reste en haut au scroll)
- [ ] Le bouton menu (mobile) fonctionne
- [ ] La barre de recherche est visible (desktop)
- [ ] Le badge notifications affiche un compteur
- [ ] Les infos utilisateur sont affichées (desktop)

#### Responsive
- [ ] Desktop (>1024px) : Sidebar visible, 3 colonnes widgets
- [ ] Tablet (768-1024px) : Sidebar collapsible, 2 colonnes
- [ ] Mobile (<768px) : Menu hamburger, 1 colonne

---

### 📊 Dashboard Personnalisé

#### Widgets Enseignant
Si connecté en tant qu'**enseignant** :
- [ ] Widget "Mes Classes" (4 classes)
- [ ] Widget "Élèves" (120 total)
- [ ] Widget "Emploi du temps" (5 cours)
- [ ] Widget "Notifications" (3 nouvelles)
- [ ] Widget "Notes à saisir" (12 devoirs)
- [ ] Widget "Taux de réussite" (85%)

#### Widgets CPE
Si connecté en tant que **CPE** :
- [ ] Widget "Élèves suivis" (250 total)
- [ ] Widget "Absences" (8 aujourd'hui)
- [ ] Widget "Emploi du temps"
- [ ] Widget "Notifications" (3 nouvelles)
- [ ] Widget "Retards" (5 cette semaine)
- [ ] Widget "Comportement" (92% positif)

#### Widgets Comptable
Si connecté en tant que **comptable** :
- [ ] Widget "Paiements reçus" (45 ce mois)
- [ ] Widget "En attente" (12 à traiter)
- [ ] Widget "Emploi du temps"
- [ ] Widget "Notifications" (3 nouvelles)

#### Sections Communes
- [ ] Welcome banner avec nom utilisateur
- [ ] Animations Framer Motion (stagger effect)
- [ ] Section "Actions rapides" adaptée au rôle
- [ ] Section "Activité récente" avec 3 items

---

### 👤 Page Profil

Navigation : `/user/profile`

- [ ] Avatar avec initiales (gradient bleu-vert)
- [ ] Nom complet affiché
- [ ] Rôle affiché (capitalisé)
- [ ] Email affiché
- [ ] Téléphone affiché
- [ ] Localisation affichée
- [ ] Date d'inscription affichée
- [ ] Bouton "Modifier" présent
- [ ] Card "Informations complémentaires" visible
- [ ] Statut affiché
- [ ] ID utilisateur affiché (format UUID)

---

### 📅 Page Emploi du Temps

Navigation : `/user/schedule`

- [ ] Titre "Mon Emploi du Temps" avec icône
- [ ] Grille hebdomadaire (Lundi-Vendredi)
- [ ] Horaires (08:00-16:00)
- [ ] Tableau responsive
- [ ] Cellules vides avec "-"
- [ ] Message "En cours de développement"

---

### 🔔 Page Notifications

Navigation : `/user/notifications`

- [ ] Message "Notifications - En développement" affiché

---

### ⚙️ Page Paramètres

Navigation : `/user/settings`

- [ ] Message "Paramètres - En développement" affiché

---

## 🎨 Tests Visuels

### Couleurs E-Pilot
- [ ] Bleu principal (#1D3557) utilisé
- [ ] Vert action (#2A9D8F) pour boutons et highlights
- [ ] Gradients corrects sur avatar et widgets

### Animations
- [ ] Stagger effect sur les widgets (délai 0.1s)
- [ ] Hover scale (1.02) sur les cards
- [ ] Transitions fluides (300ms)
- [ ] Animations Framer Motion sans saccades

### Typography
- [ ] Titres lisibles et hiérarchisés
- [ ] Textes gris pour les descriptions
- [ ] Font weights appropriés (semibold pour titres)

---

## 🔐 Tests de Sécurité

### Protection par Rôle
- [ ] `super_admin` ne peut PAS accéder à `/user`
- [ ] `admin_groupe` ne peut PAS accéder à `/user`
- [ ] `enseignant` PEUT accéder à `/user`
- [ ] `cpe` PEUT accéder à `/user`
- [ ] `comptable` PEUT accéder à `/user`
- [ ] Redirection vers `/login` si non authentifié

### Déconnexion
- [ ] Bouton déconnexion fonctionne
- [ ] Redirection vers `/login` après déconnexion
- [ ] Session supprimée (vérifier localStorage)

---

## 📱 Tests Responsive

### Desktop (>1024px)
- [ ] Sidebar 256px (ouverte)
- [ ] Sidebar 80px (fermée)
- [ ] Grid 3 colonnes widgets
- [ ] Barre recherche visible
- [ ] Info utilisateur complète

### Tablet (768-1024px)
- [ ] Grid 2 colonnes widgets
- [ ] Sidebar collapsible
- [ ] Navigation adaptée

### Mobile (<768px)
- [ ] Grid 1 colonne widgets
- [ ] Menu hamburger
- [ ] Header compact
- [ ] Touch-friendly (boutons >44px)

---

## 🐛 Tests d'Erreurs

### Erreurs Réseau
- [ ] Message d'erreur si API Supabase down
- [ ] Skeleton loaders pendant chargement
- [ ] Retry automatique (React Query)

### Erreurs Auth
- [ ] Redirection si token expiré
- [ ] Message d'erreur si utilisateur non trouvé

### Erreurs TypeScript
- [ ] Aucune erreur dans la console
- [ ] Aucun warning TypeScript

---

## 📊 Tests de Performance

### Lighthouse
- [ ] Performance : >90
- [ ] Accessibility : >90
- [ ] Best Practices : >90
- [ ] SEO : >90

### Métriques
- [ ] First Contentful Paint : <1.5s
- [ ] Time to Interactive : <3s
- [ ] Cumulative Layout Shift : <0.1

---

## 🎯 Scénarios Utilisateur

### Scénario 1 : Enseignant - Journée Type
1. Se connecter
2. Voir dashboard avec widgets
3. Cliquer "Mes Classes"
4. Consulter emploi du temps
5. Vérifier notifications
6. Se déconnecter

### Scénario 2 : CPE - Gestion Absences
1. Se connecter
2. Voir widget "Absences"
3. Consulter liste élèves
4. Vérifier emploi du temps
5. Se déconnecter

### Scénario 3 : Comptable - Vérification Paiements
1. Se connecter
2. Voir widget "Paiements reçus"
3. Consulter "En attente"
4. Accéder profil
5. Se déconnecter

---

## 🔧 Dépannage

### Problème : Sidebar ne s'affiche pas
**Solution** : Vérifier que `UserSpaceLayout` est bien importé dans `App.tsx`

### Problème : Widgets vides
**Solution** : Vérifier que `useCurrentUser()` retourne bien les données

### Problème : Erreur TypeScript
**Solution** : Le cast `as any` dans `useCurrentUser.ts` résout les erreurs de types Supabase

### Problème : Redirection vers login
**Solution** : Vérifier que l'utilisateur a un rôle autorisé (pas `super_admin` ou `admin_groupe`)

---

## ✅ Validation Finale

### Avant de Valider
- [ ] Tous les tests passent
- [ ] Aucune erreur console
- [ ] Responsive parfait
- [ ] Animations fluides
- [ ] Performance optimale

### Prêt pour Production
- [ ] Documentation complète
- [ ] Code commenté
- [ ] Tests unitaires (à venir)
- [ ] Validation UX

---

## 📝 Rapport de Test

**Date** : _______________  
**Testeur** : _______________  
**Rôle testé** : _______________

**Résultat Global** :
- [ ] ✅ Tous les tests passent
- [ ] ⚠️ Quelques problèmes mineurs
- [ ] ❌ Problèmes bloquants

**Commentaires** :
_____________________________________
_____________________________________
_____________________________________

---

## 🎉 Conclusion

Si tous les tests passent, l'**Espace Utilisateur École** est prêt pour :
- ✅ Démonstration client
- ✅ Tests utilisateurs
- ✅ Développement Phase 2
- ✅ Déploiement production

**Bon test !** 🚀🇨🇬
