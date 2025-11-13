# ✅ TODO - PROCHAINES ÉTAPES E-PILOT CONGO

**Dernière mise à jour** : 2 Novembre 2025  
**Statut actuel** : 95% Production Ready

---

## 🔴 URGENT (À faire maintenant - 1 heure)

### Configuration Supabase

- [ ] **Créer utilisateur de test dans Supabase Auth Dashboard** (5 min)
  - Email : `admin@epilot.cg`
  - Password : `admin123`
  - Auto Confirm User : ✅ Coché
  - Guide : `GUIDE_INSTALLATION_RAPIDE.md` Section 1A

- [ ] **Exécuter migration 1 : Table profiles** (5 min)
  ```sql
  -- Dans Supabase SQL Editor
  \i database/migrations/001_add_profiles_table.sql
  ```
  - Vérifier : "Success. No rows returned"

- [ ] **Exécuter migration 2 : Profil super admin** (5 min)
  ```sql
  -- Dans Supabase SQL Editor
  \i database/migrations/002_create_test_user.sql
  ```
  - Vérifier : Message "Profil super admin créé/mis à jour"

- [ ] **Vérifier profil créé** (2 min)
  ```sql
  SELECT * FROM profiles WHERE email = 'admin@epilot.cg';
  ```
  - Doit retourner 1 ligne avec role = 'super_admin'

- [ ] **Exécuter tests RLS** (15 min)
  ```sql
  -- Dans Supabase SQL Editor
  \i database/test-rls.sql
  ```
  - Vérifier tous les tests passent
  - Guide : `database/test-rls.sql` Section 10

### Configuration Locale

- [ ] **Copier .env.example vers .env.local** (1 min)
  ```bash
  cp .env.example .env.local
  ```

- [ ] **Récupérer clés Supabase** (3 min)
  - Aller dans : Settings > API
  - Copier : Project URL
  - Copier : anon public key

- [ ] **Remplir .env.local** (2 min)
  ```env
  VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### Tests Application

- [ ] **Démarrer serveur de développement** (1 min)
  ```bash
  npm run dev
  ```
  - Vérifier : "✅ Variables d'environnement validées avec succès"

- [ ] **Tester connexion** (3 min)
  - Aller sur : http://localhost:5173/login
  - Email : `admin@epilot.cg`
  - Password : `admin123`
  - Cliquer : "Accéder au système"
  - Vérifier : Redirection vers /dashboard

- [ ] **Tester navigation** (5 min)
  - [ ] Page Groupes Scolaires
  - [ ] Page Utilisateurs
  - [ ] Page Plans
  - [ ] Page Catégories
  - [ ] Déconnexion

- [ ] **Vérifier ErrorBoundary** (2 min)
  - Provoquer une erreur (modifier temporairement un composant)
  - Vérifier : UI ErrorBoundary s'affiche
  - Vérifier : Bouton "Recharger" fonctionne

---

## 🟠 IMPORTANT (Cette semaine - 8 heures)

### Données de Test

- [ ] **Créer 1 groupe scolaire de test** (10 min)
  - Nom : "Groupe Scolaire Test Congo"
  - Région : Brazzaville
  - Plan : Premium

- [ ] **Créer 2 écoles de test** (20 min)
  - École 1 : "École Primaire Test"
  - École 2 : "Collège Test"
  - Associer au groupe créé

- [ ] **Créer 5 utilisateurs de test** (30 min)
  - 1 Admin Groupe
  - 2 Enseignants
  - 1 CPE
  - 1 Comptable

- [ ] **Créer données élèves de test** (30 min)
  - 20 élèves répartis dans les 2 écoles
  - Différents niveaux

### Tests Fonctionnels

- [ ] **Tester CRUD Groupes Scolaires** (30 min)
  - [ ] Créer
  - [ ] Lire/Afficher
  - [ ] Modifier
  - [ ] Supprimer
  - [ ] Export CSV

- [ ] **Tester CRUD Écoles** (30 min)
  - [ ] Créer avec upload logo
  - [ ] Lire/Afficher
  - [ ] Modifier
  - [ ] Supprimer
  - [ ] Filtres

- [ ] **Tester CRUD Utilisateurs** (30 min)
  - [ ] Créer avec upload avatar
  - [ ] Lire/Afficher
  - [ ] Modifier
  - [ ] Supprimer
  - [ ] Filtres par rôle

- [ ] **Tester Permissions RLS** (1 heure)
  - [ ] Super Admin voit tout
  - [ ] Admin Groupe voit uniquement son groupe
  - [ ] Enseignant voit uniquement son école
  - [ ] Tentative accès non autorisé = erreur

### Documentation

- [ ] **Créer guide utilisateur** (2 heures)
  - [ ] Guide Super Admin
  - [ ] Guide Admin Groupe
  - [ ] Guide Enseignant

- [ ] **Documenter API** (1 heure)
  - [ ] Endpoints Supabase utilisés
  - [ ] Schéma de données
  - [ ] Exemples de requêtes

- [ ] **Créer FAQ** (1 heure)
  - [ ] Questions fréquentes
  - [ ] Solutions problèmes courants
  - [ ] Tutoriels vidéo (optionnel)

---

## 🟡 RECOMMANDÉ (Ce mois-ci - 40 heures)

### Tests Automatisés (2-3 jours)

- [ ] **Installer Vitest + React Testing Library** (1 heure)
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
  ```

- [ ] **Configurer Vitest** (1 heure)
  - Créer `vitest.config.ts`
  - Créer `src/test/setup.ts`
  - Ajouter scripts dans `package.json`

- [ ] **Écrire tests unitaires** (8 heures)
  - [ ] Tests hooks auth (useLogin, useAuth)
  - [ ] Tests hooks dashboard (usePlans, useQuotas)
  - [ ] Tests composants (ErrorBoundary, ProtectedRoute)
  - [ ] Tests utils (validateEnv, colors)
  - **Objectif** : 50+ tests, 80% couverture

- [ ] **Écrire tests E2E avec Playwright** (8 heures)
  - [ ] Test connexion/déconnexion
  - [ ] Test navigation dashboard
  - [ ] Test CRUD Groupes Scolaires
  - [ ] Test CRUD Utilisateurs
  - [ ] Test permissions par rôle
  - **Objectif** : 10+ scénarios E2E

### CI/CD Pipeline (1 jour)

- [ ] **Configurer GitHub Actions** (2 heures)
  - Créer `.github/workflows/ci.yml`
  - Jobs : lint, type-check, test, build

- [ ] **Configurer déploiement automatique** (2 heures)
  - Vercel ou Netlify
  - Preview deployments pour PRs
  - Production deployment sur main

- [ ] **Configurer notifications** (1 heure)
  - Slack ou Discord
  - Notifications build failed/success

### Monitoring & Logs (1 jour)

- [ ] **Intégrer Sentry** (2 heures)
  ```bash
  npm install @sentry/react
  ```
  - Configurer DSN
  - Ajouter dans ErrorBoundary
  - Tester capture d'erreurs

- [ ] **Configurer Google Analytics** (1 heure)
  ```bash
  npm install react-ga4
  ```
  - Ajouter tracking ID
  - Tracker pages vues
  - Tracker événements

- [ ] **Configurer Supabase Logs** (1 heure)
  - Activer logs dans Dashboard
  - Configurer alertes requêtes lentes
  - Configurer alertes erreurs

### Performance (1 semaine)

- [ ] **Optimiser bundle** (1 jour)
  - [ ] Analyser bundle avec `vite-bundle-visualizer`
  - [ ] Lazy loading des routes secondaires
  - [ ] Tree-shaking des librairies
  - [ ] Compression gzip/brotli
  - **Objectif** : < 200KB gzipped

- [ ] **Optimiser images** (1 jour)
  - [ ] Lazy loading images
  - [ ] Format WebP
  - [ ] Responsive images (srcset)
  - [ ] Compression automatique

- [ ] **Implémenter PWA** (2 jours)
  - [ ] Service Worker
  - [ ] Manifest.json
  - [ ] Cache stratégies
  - [ ] Mode hors-ligne
  - [ ] Install prompt

- [ ] **Optimiser React Query** (1 jour)
  - [ ] Ajuster staleTime/cacheTime
  - [ ] Prefetching intelligent
  - [ ] Optimistic updates
  - [ ] Pagination infinie

---

## 🔵 OPTIONNEL (Ce trimestre - 80 heures)

### Fonctionnalités Avancées

- [ ] **Export PDF** (1 semaine)
  - [ ] Installer jspdf + jspdf-autotable
  - [ ] Templates PDF (relevés, bulletins, factures)
  - [ ] Génération côté client
  - [ ] Aperçu avant téléchargement

- [ ] **Mobile Money API** (2 semaines)
  - [ ] Intégration Airtel Money
  - [ ] Intégration MTN Mobile Money
  - [ ] Webhook paiements
  - [ ] Réconciliation automatique

- [ ] **Notifications Temps Réel** (1 semaine)
  - [ ] WebSocket Supabase Realtime
  - [ ] Notifications push
  - [ ] Notifications email
  - [ ] Notifications SMS

- [ ] **Dashboard Prédictif** (2 semaines)
  - [ ] Modèle ML pour prévisions
  - [ ] Graphiques prédictifs
  - [ ] Alertes intelligentes
  - [ ] Recommandations automatiques

### Multi-langue

- [ ] **Internationalisation (i18n)** (1 semaine)
  - [ ] Installer react-i18next
  - [ ] Traductions FR (complet)
  - [ ] Traductions EN (partiel)
  - [ ] Traductions Lingala (optionnel)
  - [ ] Sélecteur de langue

### Dark Mode

- [ ] **Implémenter Dark Mode** (1 semaine)
  - [ ] Palette de couleurs dark
  - [ ] Toggle dark/light
  - [ ] Persistance préférence
  - [ ] Respect prefers-color-scheme

### Mobile App

- [ ] **Application Mobile** (2 mois)
  - [ ] React Native ou Capacitor
  - [ ] UI adaptée mobile
  - [ ] Notifications push natives
  - [ ] Mode hors-ligne
  - [ ] Publication App Store + Play Store

---

## 📊 SUIVI DE PROGRESSION

### Urgent (1 heure)
- [ ] 0/15 tâches complétées
- **Deadline** : Aujourd'hui
- **Bloquant** : Oui

### Important (8 heures)
- [ ] 0/15 tâches complétées
- **Deadline** : Cette semaine
- **Bloquant** : Non

### Recommandé (40 heures)
- [ ] 0/20 tâches complétées
- **Deadline** : Ce mois-ci
- **Bloquant** : Non

### Optionnel (80 heures)
- [ ] 0/12 tâches complétées
- **Deadline** : Ce trimestre
- **Bloquant** : Non

---

## 🎯 OBJECTIFS PAR PÉRIODE

### Semaine 1 (Actuelle)
- ✅ Améliorations critiques implémentées
- ⏳ Configuration Supabase
- ⏳ Tests connexion
- ⏳ Données de test

### Semaine 2
- Tests fonctionnels complets
- Documentation utilisateur
- Tests RLS validés

### Semaine 3-4
- Tests automatisés (unitaires + E2E)
- CI/CD pipeline
- Monitoring Sentry

### Mois 2
- Optimisations performance
- PWA
- Export PDF

### Mois 3
- Mobile Money API
- Notifications temps réel
- Dashboard prédictif

---

## 📝 NOTES

### Priorités
1. 🔴 **Urgent** : Nécessaire pour production
2. 🟠 **Important** : Améliore qualité
3. 🟡 **Recommandé** : Améliore expérience
4. 🔵 **Optionnel** : Fonctionnalités bonus

### Dépendances
- Urgent → Important → Recommandé → Optionnel
- Ne pas passer à l'étape suivante sans compléter l'étape précédente

### Estimation Temps Total
- Urgent : 1 heure
- Important : 8 heures
- Recommandé : 40 heures
- Optionnel : 80 heures
- **Total** : ~130 heures (~3 semaines à temps plein)

---

## 🔗 RESSOURCES

### Documentation
- Guide Installation : `GUIDE_INSTALLATION_RAPIDE.md`
- Guide Améliorations : `AMELIORATIONS_IMPLEMENTEES.md`
- Résumé Final : `RESUME_FINAL_AMELIORATIONS.md`
- Changelog : `CHANGELOG_AMELIORATIONS.md`

### Outils
- Supabase Dashboard : https://app.supabase.com
- Vitest : https://vitest.dev
- Playwright : https://playwright.dev
- Sentry : https://sentry.io

### Support
- Email : support@epilot.cg
- Documentation : `/docs`
- Issues : GitHub Issues

---

**Dernière mise à jour** : 2 Novembre 2025  
**Prochaine révision** : 9 Novembre 2025  
**Responsable** : Équipe E-Pilot Congo
