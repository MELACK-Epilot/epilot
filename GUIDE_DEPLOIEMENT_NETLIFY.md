# 🚀 GUIDE DE DÉPLOIEMENT NETLIFY - E-PILOT

**Date** : 6 novembre 2025  
**Statut** : ✅ PRÊT POUR DÉPLOIEMENT

---

## 📋 FICHIERS CRÉÉS

1. ✅ `netlify.toml` - Configuration Netlify
2. ✅ `GUIDE_DEPLOIEMENT_NETLIFY.md` - Documentation (ce fichier)

---

## 🎯 PRÉREQUIS

### **1. Compte Netlify**
- Créer un compte sur [netlify.com](https://netlify.com)
- Connecter votre compte GitHub

### **2. Variables d'environnement Supabase**
Vous aurez besoin de :
- `VITE_SUPABASE_URL` - URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` - Clé publique Supabase

---

## 🚀 DÉPLOIEMENT EN 3 ÉTAPES

### **ÉTAPE 1 : Préparer le projet**

#### **A. Vérifier package.json**
✅ Déjà configuré :
```json
{
  "scripts": {
    "build": "tsc && vite build"
  }
}
```

#### **B. Tester le build localement**
```bash
npm run build
npm run preview
```

Si ça fonctionne localement, ça fonctionnera sur Netlify ! ✅

---

### **ÉTAPE 2 : Déployer sur Netlify**

#### **Option A : Via l'interface Netlify (RECOMMANDÉ)**

1. **Aller sur** [app.netlify.com/start](https://app.netlify.com/start)

2. **Connecter GitHub** :
   - Cliquer sur "Import from Git"
   - Sélectionner "GitHub"
   - Autoriser Netlify

3. **Sélectionner le repository** :
   - Chercher "e-pilot"
   - Cliquer dessus

4. **Configuration automatique** :
   - Site name : `e-pilot-congo` (ou laissez Netlify générer)
   - Branch : `main`
   - Build command : `npm run build` ✅ (détecté automatiquement)
   - Publish directory : `dist` ✅ (détecté automatiquement)

5. **Ajouter les variables d'environnement** :
   - Cliquer sur "Show advanced"
   - Cliquer sur "New variable"
   - Ajouter :
     ```
     VITE_SUPABASE_URL = https://votre-projet.supabase.co
     VITE_SUPABASE_ANON_KEY = votre-cle-anon
     ```

6. **Déployer** :
   - Cliquer sur "Deploy site"
   - Attendre 2-3 minutes ⏱️
   - ✅ **C'est en ligne !**

#### **Option B : Via CLI Netlify**

```bash
# 1. Installer Netlify CLI
npm install -g netlify-cli

# 2. Se connecter
netlify login

# 3. Initialiser le projet
netlify init

# Suivre les instructions :
# - Create & configure a new site
# - Team: Votre équipe
# - Site name: e-pilot-congo
# - Build command: npm run build
# - Publish directory: dist

# 4. Ajouter les variables d'environnement
netlify env:set VITE_SUPABASE_URL "https://votre-projet.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "votre-cle-anon"

# 5. Déployer
netlify deploy --prod
```

#### **Option C : Drag & Drop (pour test rapide)**

```bash
# 1. Build localement
npm run build

# 2. Aller sur app.netlify.com
# 3. Glisser-déposer le dossier "dist" sur la zone
# ⚠️ Attention : Les variables d'environnement doivent être ajoutées manuellement après
```

---

### **ÉTAPE 3 : Vérifier le déploiement**

#### **A. Tester l'application**
1. Ouvrir l'URL fournie par Netlify (ex: `https://e-pilot-congo.netlify.app`)
2. Vérifier :
   - ✅ Page de connexion s'affiche
   - ✅ Connexion fonctionne
   - ✅ Dashboard se charge
   - ✅ Données Supabase s'affichent

#### **B. Vérifier les logs**
- Aller sur le dashboard Netlify
- Cliquer sur votre site
- Onglet "Deploys" → Cliquer sur le déploiement
- Vérifier les logs de build

---

## ⚙️ CONFIGURATION NETLIFY.TOML

### **Build settings**
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

### **Redirections pour SPA**
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
**Pourquoi ?** React Router nécessite que toutes les routes pointent vers `index.html`

### **Headers de sécurité**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### **Cache des assets**
```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### **Optimisations automatiques**
```toml
[build.processing.css]
  bundle = true
  minify = true

[build.processing.js]
  bundle = true
  minify = true

[build.processing.images]
  compress = true
```

---

## 🔧 RÉSOLUTION DES ERREURS COURANTES

### **Erreur 1 : Build Failed - TypeScript errors**

❌ **Erreur** :
```
Build failed with TypeScript errors
```

✅ **Solution** :
```bash
# Vérifier localement
npm run type-check

# Si erreurs, corriger puis commit
git add .
git commit -m "fix: typescript errors"
git push
```

---

### **Erreur 2 : Environment variables not defined**

❌ **Erreur** :
```
Error: VITE_SUPABASE_URL is not defined
```

✅ **Solution** :
1. Aller sur Netlify Dashboard
2. Site → Site settings → Environment variables
3. Cliquer sur "Add a variable"
4. Ajouter les variables manquantes
5. Redéployer : Site → Deploys → Trigger deploy → Deploy site

---

### **Erreur 3 : 404 on page refresh**

❌ **Problème** : Rafraîchir une page (ex: `/dashboard`) donne 404

✅ **Solution** : Vérifier que `netlify.toml` contient :
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### **Erreur 4 : Supabase connection failed**

❌ **Erreur** :
```
Failed to connect to Supabase
```

✅ **Solution** :
1. Vérifier que les variables d'environnement sont correctes
2. Vérifier que Supabase accepte les requêtes depuis Netlify
3. Redéployer après avoir ajouté les variables

---

### **Erreur 5 : Build command not found**

❌ **Erreur** :
```
npm: command not found
```

✅ **Solution** : Vérifier dans `netlify.toml` :
```toml
[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"
```

---

## 🌍 DOMAINE PERSONNALISÉ

### **Ajouter un domaine**

1. **Acheter un domaine** (ex: e-pilot.cg)

2. **Configurer sur Netlify** :
   - Site → Domain settings → Add custom domain
   - Entrer votre domaine : `e-pilot.cg`
   - Cliquer sur "Verify"

3. **Configurer DNS** :
   
   **Option A : Utiliser Netlify DNS (RECOMMANDÉ)**
   - Netlify vous donnera 4 nameservers
   - Aller chez votre registrar (ex: Namecheap)
   - Remplacer les nameservers par ceux de Netlify
   
   **Option B : DNS externe**
   - Ajouter un enregistrement A :
     ```
     Type: A
     Name: @
     Value: 75.2.60.5
     ```
   - Ajouter un enregistrement CNAME :
     ```
     Type: CNAME
     Name: www
     Value: e-pilot-congo.netlify.app
     ```

4. **Attendre la propagation** (5-30 minutes)

5. **Activer HTTPS** :
   - Netlify active automatiquement HTTPS via Let's Encrypt
   - Aller sur : Domain settings → HTTPS
   - Cliquer sur "Verify DNS configuration"
   - Attendre 1-2 minutes
   - ✅ HTTPS activé !

---

## 📊 MONITORING

### **Analytics Netlify**
- Gratuit sur le plan Pro
- Site → Analytics
- Voir :
  - Nombre de visiteurs
  - Bande passante utilisée
  - Temps de build

### **Logs en temps réel**
```bash
# Via CLI
netlify logs

# Ou sur le dashboard
Site → Deploys → [Dernier déploiement] → Deploy log
```

### **Fonctions serverless (si besoin)**
```bash
# Créer une fonction
mkdir -p netlify/functions
echo "exports.handler = async () => ({ statusCode: 200, body: 'Hello' })" > netlify/functions/hello.js

# Déployer
netlify deploy --prod

# Tester
curl https://e-pilot-congo.netlify.app/.netlify/functions/hello
```

---

## 🔄 DÉPLOIEMENT AUTOMATIQUE

### **Déploiement automatique activé par défaut**

Chaque fois que vous poussez sur GitHub :
- **Branch `main`** → Déploiement en **production**
- **Autres branches** → Déploiement en **preview** (Deploy Preview)

### **Deploy Previews**
- Chaque Pull Request génère une URL de preview
- Parfait pour tester avant de merger
- URL format : `https://deploy-preview-123--e-pilot-congo.netlify.app`

### **Branch deploys**
- Déployer automatiquement d'autres branches
- Site settings → Build & deploy → Branch deploys
- Ajouter les branches à déployer (ex: `develop`, `staging`)

---

## 🎯 CHECKLIST FINALE

Avant de déployer en production :

- [ ] ✅ Build local fonctionne (`npm run build`)
- [ ] ✅ Variables d'environnement prêtes
- [ ] ✅ `netlify.toml` créé
- [ ] ✅ Tests passent localement
- [ ] ✅ Supabase RLS activé
- [ ] ✅ Données de test créées
- [ ] ✅ Documentation à jour

---

## 🎉 RÉSULTAT

Après déploiement, vous aurez :

- ✅ **URL de production** : `https://e-pilot-congo.netlify.app`
- ✅ **HTTPS automatique** (certificat SSL)
- ✅ **CDN global** (temps de chargement rapide partout)
- ✅ **Déploiement automatique** (push → déploiement)
- ✅ **Deploy Previews** (pour tester les PR)
- ✅ **Branch deploys** (staging, develop)
- ✅ **Optimisations automatiques** (minification, compression)
- ✅ **Logs en temps réel**

---

## 🆚 NETLIFY VS VERCEL

| Fonctionnalité | Netlify | Vercel |
|----------------|---------|--------|
| **Build time** | ~2-3 min | ~2-3 min |
| **CDN** | ✅ Global | ✅ Global |
| **HTTPS** | ✅ Auto | ✅ Auto |
| **Deploy Previews** | ✅ Oui | ✅ Oui |
| **Fonctions serverless** | ✅ Oui | ✅ Oui |
| **Analytics gratuit** | ❌ Pro only | ✅ Oui |
| **Formulaires** | ✅ Oui | ❌ Non |
| **Split testing** | ✅ Oui | ❌ Non |
| **Interface** | 🎨 Très claire | 🎨 Moderne |

**Recommandation** : Les deux sont excellents ! Netlify a plus de fonctionnalités, Vercel est plus rapide pour Next.js.

---

## 📚 RESSOURCES

- [Documentation Netlify](https://docs.netlify.com)
- [Vite + Netlify](https://docs.netlify.com/frameworks/vite/)
- [Variables d'environnement](https://docs.netlify.com/environment-variables/overview/)
- [Domaines personnalisés](https://docs.netlify.com/domains-https/custom-domains/)
- [Deploy Previews](https://docs.netlify.com/site-deploys/deploy-previews/)

---

## 🆘 SUPPORT

En cas de problème :

1. **Vérifier les logs** : Dashboard Netlify → Deploys → Deploy log
2. **Tester localement** : `npm run build && npm run preview`
3. **Vérifier les variables** : Site settings → Environment variables
4. **Support Netlify** : [community.netlify.com](https://community.netlify.com)
5. **Status** : [netlifystatus.com](https://netlifystatus.com)

---

## 🚀 COMMANDES UTILES

```bash
# Installer CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Initialiser
netlify init

# Build local
netlify build

# Déployer en draft (test)
netlify deploy

# Déployer en production
netlify deploy --prod

# Voir les logs
netlify logs

# Ouvrir le dashboard
netlify open

# Voir les variables d'environnement
netlify env:list

# Ajouter une variable
netlify env:set KEY "value"

# Lancer en local avec fonctions
netlify dev
```

---

## 🎉 PRÊT À DÉPLOYER !

Suivez les étapes ci-dessus et votre application sera en ligne en quelques minutes !

**Bonne chance !** 🎉

---

## 💡 ASTUCE FINALE

Pour déployer sur **les deux** (Netlify ET Vercel) :
- Netlify : Production principale
- Vercel : Backup / Staging

Les deux configurations coexistent sans problème ! 🚀
