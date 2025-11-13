# 🧪 Guide de Test - Paiements & Alertes

**Date**: 29 octobre 2025  
**Objectif**: Tester les nouvelles fonctionnalités du Dashboard Super Admin

---

## 📋 Prérequis

### 1. Base de Données Supabase

Exécuter le script SQL dans Supabase SQL Editor:
```bash
# Fichier à exécuter
SUPABASE_PAYMENTS_ALERTS_SCHEMA.sql
```

Ce script va créer:
- ✅ Table `payments` (paiements)
- ✅ Table `system_alerts` (alertes système)
- ✅ Vue `unread_alerts` (alertes non lues)
- ✅ Vue `payment_stats` (statistiques)
- ✅ Triggers automatiques (alertes)
- ✅ Données de test

### 2. Vérifier la Configuration

```typescript
// Fichier: src/lib/supabase.ts
// Vérifier que les variables d'environnement sont correctes
VITE_SUPABASE_URL=https://csltuxbanvweyfzqpfap.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Tests à Effectuer

### Test 1: Page Paiements

#### Navigation
1. Démarrer l'application: `npm run dev`
2. Se connecter au Dashboard
3. Cliquer sur **"Finances"** dans la sidebar
4. Cliquer sur l'onglet **"Paiements"**

#### Vérifications
- [ ] Les 5 StatCards s'affichent avec animations
- [ ] Le tableau des paiements charge correctement
- [ ] Les badges de statut sont colorés (vert, jaune, rouge, gris)
- [ ] Les dates sont au format français (ex: "28 oct 2025")

#### Filtres
- [ ] **Recherche**: Taper "INV-2025" → Filtrage instantané
- [ ] **Statut**: Sélectionner "Complété" → Affiche uniquement les complétés
- [ ] **Date début**: Sélectionner une date → Filtre par date
- [ ] **Date fin**: Sélectionner une date → Filtre par plage

#### Actions
- [ ] Cliquer sur l'icône 👁️ (Voir détails) → Devrait ouvrir un modal (à implémenter)
- [ ] Cliquer sur l'icône 🔄 (Rembourser) → Devrait marquer comme remboursé

#### Console
```javascript
// Ouvrir la console DevTools (F12)
// Vérifier qu'il n'y a pas d'erreurs
// Les warnings @ts-expect-error sont normaux (tables en cours de création)
```

---

### Test 2: Système d'Alertes

#### Navigation
1. Dans le header, repérer l'icône 🔔 (cloche)
2. Vérifier le badge rouge avec le nombre d'alertes

#### Vérifications
- [ ] Le badge affiche le bon nombre (ex: "3")
- [ ] Le badge pulse (animation)
- [ ] Cliquer sur la cloche → Dropdown s'ouvre

#### Contenu du Dropdown
- [ ] Les alertes s'affichent avec icônes colorées:
  - 🔴 Critical (rouge)
  - 🟡 High (jaune)
  - 🔵 Medium (bleu)
  - 🟢 Low (vert)
- [ ] Les badges de type sont colorés
- [ ] Les dates sont au format français (ex: "29 oct 14:30")
- [ ] Le bouton "Tout marquer comme lu" est visible

#### Actions
- [ ] Hover sur une alerte → Bouton ❌ apparaît
- [ ] Cliquer sur ❌ → Alerte disparaît
- [ ] Cliquer sur "Tout marquer comme lu" → Toutes les alertes disparaissent
- [ ] Badge passe à 0
- [ ] Message "Aucune notification - Vous êtes à jour ! 🎉" s'affiche

#### Refetch Automatique
```javascript
// Attendre 1 minute
// Les alertes devraient se recharger automatiquement
// Vérifier dans l'onglet Network (F12) les requêtes à Supabase
```

---

### Test 3: Navigation Finances

#### Onglets
- [ ] **Vue d'ensemble**: KPIs, graphiques
- [ ] **Plans & Tarifs**: Liste des plans
- [ ] **Abonnements**: Liste des abonnements
- [ ] **Paiements**: Historique des paiements ✨ NOUVEAU

#### Responsive
```bash
# Ouvrir DevTools (F12)
# Activer le mode responsive
# Tester les tailles:
- Mobile (375px)
- Tablet (768px)
- Desktop (1920px)
```

Vérifications:
- [ ] Les onglets s'adaptent (texte réduit sur mobile)
- [ ] Le tableau est scrollable horizontalement sur mobile
- [ ] Les StatCards passent en colonne unique sur mobile

---

## 🐛 Débogage

### Problème: Pas de données

**Cause**: Tables vides ou non créées

**Solution**:
```sql
-- Vérifier les tables dans Supabase
SELECT COUNT(*) FROM payments;
SELECT COUNT(*) FROM system_alerts;

-- Si vide, réexécuter la section "DONNÉES DE TEST" du script SQL
```

### Problème: Erreur "Table does not exist"

**Cause**: Script SQL non exécuté

**Solution**:
1. Aller dans Supabase Dashboard
2. SQL Editor
3. Coller le contenu de `SUPABASE_PAYMENTS_ALERTS_SCHEMA.sql`
4. Exécuter (Run)

### Problème: Compteur d'alertes à 0

**Cause**: Toutes les alertes sont lues ou résolues

**Solution**:
```sql
-- Créer une nouvelle alerte de test
INSERT INTO system_alerts (
  type,
  severity,
  title,
  message,
  action_required
) VALUES (
  'system',
  'high',
  'Test Alert',
  'Ceci est une alerte de test.',
  FALSE
);
```

### Problème: Erreur RLS (Row Level Security)

**Cause**: Politiques RLS trop restrictives

**Solution temporaire (DEV uniquement)**:
```sql
-- Désactiver temporairement RLS
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts DISABLE ROW LEVEL SECURITY;

-- ⚠️ NE PAS FAIRE EN PRODUCTION !
```

---

## 📊 Métriques de Performance

### React Query DevTools

Activer les DevTools (déjà configuré):
```typescript
// Dans App.tsx
<ReactQueryDevtools initialIsOpen={false} />
```

Vérifications:
- [ ] Queries en cache (vert)
- [ ] Stale time respecté (2min pour payments, 30s pour alerts)
- [ ] Refetch automatique fonctionne

### Lighthouse

```bash
# Ouvrir DevTools (F12)
# Onglet Lighthouse
# Générer un rapport

Objectifs:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90
```

---

## ✅ Checklist Complète

### Fonctionnalités
- [ ] Page Paiements affichée
- [ ] Filtres fonctionnels
- [ ] StatCards animées
- [ ] Tableau responsive
- [ ] Système d'alertes dans header
- [ ] Badge compteur animé
- [ ] Dropdown alertes fonctionnel
- [ ] Marquage comme lu fonctionne
- [ ] Refetch automatique actif

### Performance
- [ ] Chargement < 2s
- [ ] Pas de lag lors du scroll
- [ ] Animations fluides (60fps)
- [ ] Pas d'erreurs console
- [ ] React Query cache actif

### Accessibilité
- [ ] Navigation clavier complète
- [ ] ARIA labels présents
- [ ] Contrastes suffisants
- [ ] Focus visible
- [ ] Lecteur d'écran compatible

### Responsive
- [ ] Mobile (375px) ✅
- [ ] Tablet (768px) ✅
- [ ] Desktop (1920px) ✅
- [ ] Ultra-wide (2560px) ✅

---

## 🚀 Prochaines Étapes

### Fonctionnalités Bonus
1. **Export PDF/Excel**
   - Bouton "Exporter" dans la page Paiements
   - Génération PDF avec logo E-Pilot
   - Export Excel avec formules

2. **Graphiques Paiements**
   - Évolution des paiements (Line Chart)
   - Répartition par méthode (Pie Chart)
   - Comparaison mensuelle (Bar Chart)

3. **Notifications Push**
   - Web Push API
   - Notifications navigateur
   - Sons personnalisés

4. **Webhooks**
   - Alertes critiques → Email
   - Paiements échoués → SMS
   - Intégration Slack/Discord

### Optimisations
1. **Pagination**
   - Ajouter pagination au tableau
   - Lazy loading des données
   - Infinite scroll

2. **Cache Avancé**
   - Optimistic updates
   - Prefetching intelligent
   - Background sync

3. **Tests**
   - Tests unitaires (Vitest)
   - Tests E2E (Playwright)
   - Tests d'intégration

---

## 📞 Support

### En cas de problème

1. **Vérifier la console** (F12)
2. **Vérifier Supabase** (tables créées ?)
3. **Vérifier .env.local** (variables correctes ?)
4. **Redémarrer le serveur** (`npm run dev`)

### Ressources
- Documentation Supabase: https://supabase.com/docs
- React Query: https://tanstack.com/query/latest
- Shadcn/UI: https://ui.shadcn.com

---

**Bon test ! 🎉**

Si tout fonctionne, le Dashboard Super Admin est prêt pour la production ! 🚀
