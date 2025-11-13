# 🚀 GUIDE DE DÉPLOIEMENT VERCEL - E-PILOT

**Date** : 6 novembre 2025  
**Statut** : ✅ PRÊT POUR DÉPLOIEMENT

---

## 📋 FICHIERS CRÉÉS

1. ✅ `vercel.json` - Configuration Vercel
2. ✅ `.vercelignore` - Fichiers à ignorer
3. ✅ `GUIDE_DEPLOIEMENT_VERCEL.md` - Documentation (ce fichier)

---

## 🎯 PRÉREQUIS

### **1. Compte Vercel**
- Créer un compte sur [vercel.com](https://vercel.com)
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
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

#### **B. Tester le build localement**
```bash
npm run build
npm run preview
```

Si ça fonctionne localement, ça fonctionnera sur Vercel ! ✅

---

### **ÉTAPE 2 : Déployer sur Vercel**

#### **Option A : Via l'interface Vercel (RECOMMANDÉ)**

1. **Aller sur** [vercel.com/new](https://vercel.com/new)

2. **Importer le projet** :
   - Cliquer sur "Import Git Repository"
   - Sélectionner votre repo GitHub `e-pilot`

3. **Configuration automatique** :
   - Framework Preset : **Vite** (détecté automatiquement)
   - Build Command : `npm run build` (détecté automatiquement)
   - Output Directory : `dist` (détecté automatiquement)

4. **Ajouter les variables d'environnement** :
   - Cliquer sur "Environment Variables"
   - Ajouter :
     ```
     VITE_SUPABASE_URL = https://votre-projet.supabase.co
     VITE_SUPABASE_ANON_KEY = votre-cle-anon
     ```

5. **Déployer** :
   - Cliquer sur "Deploy"
   - Attendre 2-3 minutes ⏱️
   - ✅ **C'est en ligne !**

#### **Option B : Via CLI Vercel**

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel

# 4. Suivre les instructions
# - Link to existing project? No
# - Project name: e-pilot
# - Directory: ./
# - Override settings? No

# 5. Ajouter les variables d'environnement
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# 6. Redéployer avec les variables
vercel --prod
```

---

### **ÉTAPE 3 : Vérifier le déploiement**

#### **A. Tester l'application**
1. Ouvrir l'URL fournie par Vercel (ex: `https://e-pilot.vercel.app`)
2. Vérifier :
   - ✅ Page de connexion s'affiche
   - ✅ Connexion fonctionne
   - ✅ Dashboard se charge
   - ✅ Données Supabase s'affichent

#### **B. Vérifier les logs**
- Aller sur le dashboard Vercel
- Cliquer sur votre projet
- Onglet "Deployments" → Cliquer sur le déploiement
- Vérifier les logs de build

---

## ⚙️ CONFIGURATION VERCEL.JSON

### **Framework détecté**
```json
{
  "framework": "vite"
}
```

### **Rewrites pour SPA**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
**Pourquoi ?** React Router nécessite que toutes les routes pointent vers `index.html`

### **Headers de sécurité**
```json
{
  "headers": [
    {
      "key": "X-Content-Type-Options",
      "value": "nosniff"
    },
    {
      "key": "X-Frame-Options",
      "value": "DENY"
    }
  ]
}
```

### **Cache des assets**
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```
**Pourquoi ?** Les fichiers dans `/assets/` ont des hash, donc peuvent être cachés indéfiniment

---

## 🔧 RÉSOLUTION DES ERREURS COURANTES

### **Erreur 1 : Build Failed - TypeScript errors**

❌ **Erreur** :
```
Error: Build failed with TypeScript errors
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
1. Aller sur Vercel Dashboard
2. Projet → Settings → Environment Variables
3. Ajouter les variables manquantes
4. Redéployer

---

### **Erreur 3 : 404 on page refresh**

❌ **Problème** : Rafraîchir une page (ex: `/dashboard`) donne 404

✅ **Solution** : Vérifier que `vercel.json` contient les rewrites :
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### **Erreur 4 : Supabase connection failed**

❌ **Erreur** :
```
Failed to connect to Supabase
```

✅ **Solution** :
1. Vérifier que les variables d'environnement sont correctes
2. Vérifier que Supabase accepte les requêtes depuis Vercel :
   - Aller sur Supabase Dashboard
   - Settings → API
   - Vérifier que l'URL et la clé sont correctes

---

## 🌍 DOMAINE PERSONNALISÉ (OPTIONNEL)

### **Ajouter un domaine**

1. **Acheter un domaine** (ex: e-pilot.cg)

2. **Configurer sur Vercel** :
   - Projet → Settings → Domains
   - Cliquer sur "Add Domain"
   - Entrer votre domaine : `e-pilot.cg`

3. **Configurer DNS** :
   - Ajouter un enregistrement A :
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     ```
   - Ajouter un enregistrement CNAME :
     ```
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

4. **Attendre la propagation** (5-30 minutes)

5. **Activer HTTPS** (automatique via Let's Encrypt)

---

## 📊 MONITORING

### **Analytics Vercel**
- Gratuit avec tous les plans
- Aller sur : Projet → Analytics
- Voir :
  - Nombre de visiteurs
  - Pages les plus visitées
  - Performance (Core Web Vitals)

### **Logs en temps réel**
```bash
# Via CLI
vercel logs

# Ou sur le dashboard
Projet → Deployments → [Dernier déploiement] → Logs
```

---

## 🔄 DÉPLOIEMENT AUTOMATIQUE

### **Déploiement automatique activé par défaut**

Chaque fois que vous poussez sur GitHub :
- **Branch `main`** → Déploiement en **production**
- **Autres branches** → Déploiement en **preview**

### **Désactiver le déploiement automatique**
1. Projet → Settings → Git
2. Décocher "Production Branch"

---

## 🎯 CHECKLIST FINALE

Avant de déployer en production :

- [ ] ✅ Build local fonctionne (`npm run build`)
- [ ] ✅ Variables d'environnement configurées
- [ ] ✅ `vercel.json` créé
- [ ] ✅ `.vercelignore` créé
- [ ] ✅ Tests passent localement
- [ ] ✅ Supabase RLS activé
- [ ] ✅ Données de test créées
- [ ] ✅ Documentation à jour

---

## 🎉 RÉSULTAT

Après déploiement, vous aurez :

- ✅ **URL de production** : `https://e-pilot.vercel.app`
- ✅ **HTTPS automatique** (certificat SSL)
- ✅ **CDN global** (temps de chargement rapide partout)
- ✅ **Déploiement automatique** (push → déploiement)
- ✅ **Preview deployments** (pour tester avant production)
- ✅ **Analytics intégré**
- ✅ **Logs en temps réel**

---

## 📚 RESSOURCES

- [Documentation Vercel](https://vercel.com/docs)
- [Vite + Vercel](https://vercel.com/docs/frameworks/vite)
- [Variables d'environnement](https://vercel.com/docs/concepts/projects/environment-variables)
- [Domaines personnalisés](https://vercel.com/docs/concepts/projects/custom-domains)

---

## 🆘 SUPPORT

En cas de problème :

1. **Vérifier les logs** : Dashboard Vercel → Deployments → Logs
2. **Tester localement** : `npm run build && npm run preview`
3. **Vérifier les variables** : Dashboard → Settings → Environment Variables
4. **Support Vercel** : [vercel.com/support](https://vercel.com/support)

---

## 🚀 PRÊT À DÉPLOYER !

Suivez les étapes ci-dessus et votre application sera en ligne en quelques minutes !

**Bonne chance !** 🎉
