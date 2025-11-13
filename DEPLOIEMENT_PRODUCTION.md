# 🚀 Guide de Déploiement en Production

**Projet**: E-Pilot Congo - Dashboard Super Admin  
**Date**: 29 octobre 2025  
**Version**: 1.0.0

---

## 📋 Checklist Pré-Déploiement

### 1. Base de Données Supabase

#### Exécuter le Script SQL
```bash
# Fichier à exécuter dans Supabase SQL Editor
SUPABASE_PAYMENTS_ALERTS_SCHEMA.sql
```

#### Vérifications
```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('payments', 'system_alerts');

-- Vérifier les vues
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('unread_alerts', 'payment_stats');

-- Vérifier les données de test
SELECT COUNT(*) FROM payments;
SELECT COUNT(*) FROM system_alerts;
```

#### Résultat Attendu
- ✅ 2 tables créées (payments, system_alerts)
- ✅ 2 vues créées (unread_alerts, payment_stats)
- ✅ 3 paiements de test
- ✅ 3 alertes de test

---

### 2. Variables d'Environnement

#### Fichier `.env.local` (Développement)
```bash
VITE_SUPABASE_URL=https://csltuxbanvweyfzqpfap.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Fichier `.env.production` (Production)
```bash
# À créer pour la production
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_production
```

#### Vérification
```bash
# Tester la connexion
npm run dev

# Ouvrir la console (F12)
# Vérifier qu'il n'y a pas d'erreurs de connexion Supabase
```

---

### 3. Tests Locaux

#### Démarrer le Serveur
```bash
npm run dev
```

#### Tests Fonctionnels
- [ ] **Page Paiements**: Affichage, filtres, actions
- [ ] **Système d'alertes**: Badge, dropdown, marquage
- [ ] **Navigation**: Tous les onglets Finances
- [ ] **Responsive**: Mobile, tablet, desktop
- [ ] **Performance**: Chargement < 2s

#### Tests Techniques
```bash
# Build de production
npm run build

# Preview du build
npm run preview

# Vérifier la taille du bundle
ls -lh dist/assets/*.js
```

#### Résultat Attendu
- ✅ Build sans erreurs
- ✅ Bundle < 500KB (gzipped)
- ✅ Pas d'erreurs console
- ✅ Lighthouse Score > 90

---

### 4. Optimisations Finales

#### Supprimer les Données de Test (Production)
```sql
-- ⚠️ UNIQUEMENT EN PRODUCTION
-- Supprimer les données de test
DELETE FROM payments WHERE invoice_number LIKE 'INV-2025-%';
DELETE FROM system_alerts WHERE title LIKE '%test%' OR title LIKE '%Test%';
```

#### Activer RLS (Production)
```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('payments', 'system_alerts');

-- Si rowsecurity = false, activer RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
```

#### Configurer les Politiques RLS
```sql
-- Vérifier les politiques existantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('payments', 'system_alerts');

-- Si aucune politique, créer celles du script SQL
-- (voir SUPABASE_PAYMENTS_ALERTS_SCHEMA.sql section 8)
```

---

## 🚀 Déploiement

### Option 1: Vercel (Recommandé)

#### Installation
```bash
npm install -g vercel
```

#### Configuration
```bash
# Se connecter à Vercel
vercel login

# Initialiser le projet
vercel

# Configurer les variables d'environnement
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

#### Déploiement
```bash
# Déploiement de production
vercel --prod
```

#### Vérifications
- [ ] URL de production accessible
- [ ] Variables d'environnement correctes
- [ ] Pas d'erreurs console
- [ ] Toutes les fonctionnalités opérationnelles

---

### Option 2: Netlify

#### Installation
```bash
npm install -g netlify-cli
```

#### Configuration
```bash
# Se connecter à Netlify
netlify login

# Initialiser le projet
netlify init

# Configurer les variables d'environnement
netlify env:set VITE_SUPABASE_URL "https://..."
netlify env:set VITE_SUPABASE_ANON_KEY "eyJ..."
```

#### Déploiement
```bash
# Build local
npm run build

# Déploiement
netlify deploy --prod --dir=dist
```

---

### Option 3: Serveur VPS (Ubuntu)

#### Prérequis
```bash
# Installer Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer Nginx
sudo apt-get install -y nginx

# Installer PM2
sudo npm install -g pm2
```

#### Configuration
```bash
# Cloner le projet
git clone https://github.com/votre-repo/e-pilot.git
cd e-pilot

# Installer les dépendances
npm install

# Créer .env.production
nano .env.production
# Coller les variables d'environnement

# Build
npm run build
```

#### Nginx
```nginx
# /etc/nginx/sites-available/epilot
server {
    listen 80;
    server_name epilot.cg www.epilot.cg;

    root /var/www/epilot/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache statique
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Activation
```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/epilot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL avec Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d epilot.cg -d www.epilot.cg
```

---

## 📊 Monitoring Post-Déploiement

### 1. Supabase Dashboard

#### Métriques à Surveiller
- **Database**: Nombre de connexions, requêtes/sec
- **Storage**: Utilisation du stockage
- **Auth**: Nombre d'utilisateurs actifs
- **API**: Requêtes/min, erreurs

#### Alertes à Configurer
```sql
-- Créer des alertes pour:
- Paiements échoués > 10/jour
- Alertes critiques non résolues > 5
- Temps de réponse > 2s
- Erreurs 500 > 1%
```

---

### 2. Application Monitoring

#### Google Analytics
```typescript
// src/lib/analytics.ts
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

export const trackEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({ category, action, label });
};
```

#### Sentry (Erreurs)
```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

---

### 3. Performance Monitoring

#### Lighthouse CI
```bash
npm install -g @lhci/cli

# Configuration
lhci autorun --config=lighthouserc.json
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["https://epilot.cg"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }]
      }
    }
  }
}
```

---

## 🔒 Sécurité

### 1. Supabase RLS

#### Vérifier les Politiques
```sql
-- Lister toutes les politiques
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Tester une politique
SET ROLE authenticated;
SELECT * FROM payments LIMIT 1;
RESET ROLE;
```

#### Politiques Recommandées
```sql
-- Super Admin: Accès total
CREATE POLICY "super_admin_all" ON payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin Groupe: Ses groupes uniquement
CREATE POLICY "admin_groupe_own" ON payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN school_groups sg ON s.school_group_id = sg.id
      JOIN users u ON u.school_group_id = sg.id
      WHERE s.id = payments.subscription_id
      AND u.id = auth.uid()
      AND u.role = 'admin_groupe'
    )
  );
```

---

### 2. Variables d'Environnement

#### Ne JAMAIS Commiter
```bash
# .gitignore
.env
.env.local
.env.production
.env.*.local
```

#### Utiliser des Secrets
```bash
# Vercel
vercel env add VITE_SUPABASE_ANON_KEY production

# Netlify
netlify env:set VITE_SUPABASE_ANON_KEY "xxx" --context production

# GitHub Actions
# Settings > Secrets > Actions > New repository secret
```

---

### 3. Headers de Sécurité

#### Nginx
```nginx
# /etc/nginx/sites-available/epilot
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

#### Vercel (vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## ✅ Checklist Finale

### Pré-Déploiement
- [ ] Script SQL exécuté dans Supabase
- [ ] Tables et vues créées
- [ ] Données de test insérées (dev) ou supprimées (prod)
- [ ] RLS activé et politiques configurées
- [ ] Variables d'environnement configurées
- [ ] Build de production réussi
- [ ] Tests locaux passés

### Déploiement
- [ ] Plateforme choisie (Vercel/Netlify/VPS)
- [ ] Déploiement effectué
- [ ] URL de production accessible
- [ ] SSL/HTTPS activé
- [ ] Variables d'environnement en production
- [ ] Pas d'erreurs console

### Post-Déploiement
- [ ] Monitoring configuré (Analytics, Sentry)
- [ ] Alertes configurées (Supabase, Application)
- [ ] Performance vérifiée (Lighthouse > 90)
- [ ] Sécurité vérifiée (Headers, RLS)
- [ ] Documentation à jour
- [ ] Équipe formée

---

## 🎉 Félicitations !

Votre Dashboard Super Admin E-Pilot Congo est maintenant **EN PRODUCTION** ! 🚀

### Prochaines Étapes
1. **Surveiller** les métriques (24-48h)
2. **Collecter** les retours utilisateurs
3. **Corriger** les bugs éventuels
4. **Optimiser** selon les données réelles
5. **Itérer** sur les fonctionnalités

---

**Bon déploiement ! 🎊**

---

**Auteur**: Cascade AI  
**Projet**: E-Pilot Congo  
**Version**: 1.0.0  
**Date**: 29 octobre 2025
