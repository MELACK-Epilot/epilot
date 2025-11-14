# 🚀 GUIDE DE DÉPLOIEMENT - EDGE FUNCTION SANDBOX

## 🎯 **OBJECTIF**

Automatiser la génération des données sandbox directement depuis l'interface web, sans avoir besoin d'ouvrir un terminal.

---

## ✅ **CE QUI A ÉTÉ CRÉÉ**

### **1. Edge Function Supabase**
```typescript
📁 supabase/functions/generate-sandbox/index.ts

Fonctionnalités:
✅ Génère 5 groupes scolaires
✅ Crée 20 écoles
✅ Génère 500+ utilisateurs
✅ Crée 6,500+ élèves
✅ Crée 200+ classes
✅ Crée 6,500+ inscriptions
✅ Tout marqué avec is_sandbox = true
```

### **2. Interface Mise à Jour**
```typescript
📁 src/features/dashboard/pages/SandboxManager.tsx

Modifications:
✅ Appelle supabase.functions.invoke('generate-sandbox')
✅ Affiche la progression
✅ Fallback sur instructions manuelles si erreur
✅ Rafraîchit les statistiques automatiquement
```

---

## 📋 **DÉPLOIEMENT EN 3 ÉTAPES**

### **Étape 1 : Installer Supabase CLI**

```bash
# Installer Supabase CLI
npm install -g supabase

# Vérifier l'installation
supabase --version
```

### **Étape 2 : Se Connecter à Supabase**

```bash
# Se connecter
supabase login

# Lier le projet
supabase link --project-ref csltuxbanvweyfzqpfap
```

### **Étape 3 : Déployer la Edge Function**

```bash
# Déployer la fonction
supabase functions deploy generate-sandbox

# Vérifier le déploiement
supabase functions list
```

---

## 🔐 **CONFIGURATION DES SECRETS**

La Edge Function a besoin d'accès aux variables d'environnement :

```bash
# Les secrets sont automatiquement disponibles :
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY

# Pas besoin de configuration supplémentaire !
```

---

## 🧪 **TESTER LA FONCTION**

### **Option 1 : Depuis l'Interface**

```
1. Aller sur /dashboard/sandbox
2. Cliquer sur "Générer les Données Sandbox"
3. Attendre 2-3 minutes
4. ✅ Les statistiques se mettent à jour automatiquement !
```

### **Option 2 : Depuis le Terminal**

```bash
# Tester localement
supabase functions serve generate-sandbox

# Appeler la fonction
curl -X POST http://localhost:54321/functions/v1/generate-sandbox \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### **Option 3 : Depuis Supabase Dashboard**

```
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans "Edge Functions"
4. Cliquer sur "generate-sandbox"
5. Cliquer sur "Invoke"
```

---

## 🎨 **FONCTIONNEMENT**

### **Flux Complet**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utilisateur clique sur "Générer les Données Sandbox"     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Interface appelle supabase.functions.invoke()            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Edge Function s'exécute sur Supabase                     │
│    - Crée les groupes scolaires                             │
│    - Crée les écoles                                        │
│    - Crée les utilisateurs                                  │
│    - Crée les élèves                                        │
│    - Crée les classes                                       │
│    - Crée les inscriptions                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Fonction retourne les statistiques                       │
│    {                                                        │
│      school_groups: 5,                                      │
│      schools: 20,                                           │
│      students: 6500,                                        │
│      ...                                                    │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Interface affiche le succès                              │
│    ✅ "Données sandbox générées !"                          │
│    📊 Statistiques mises à jour                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ **AVANTAGES**

### **Par rapport au Script Terminal**

| Critère | Script Terminal | Edge Function |
|---------|----------------|---------------|
| **Facilité** | ❌ Ouvrir terminal | ✅ 1 clic |
| **Vitesse** | ⚠️ 2-3 minutes | ⚡ 2-3 minutes |
| **Automatisation** | ❌ Manuel | ✅ Automatique |
| **Feedback** | ❌ Console | ✅ Interface |
| **Erreurs** | ❌ Difficile à voir | ✅ Toast clair |
| **Stats** | ❌ Manuel refresh | ✅ Auto refresh |

---

## 🔧 **DÉPANNAGE**

### **Erreur : Function not found**

```bash
# Vérifier que la fonction est déployée
supabase functions list

# Redéployer si nécessaire
supabase functions deploy generate-sandbox
```

### **Erreur : Timeout**

```
La fonction a un timeout de 5 minutes max.
Si la génération prend plus de temps, réduire le nombre d'élèves.
```

### **Erreur : Permission denied**

```bash
# Vérifier que vous êtes connecté
supabase login

# Vérifier le lien au projet
supabase link --project-ref csltuxbanvweyfzqpfap
```

### **Fallback Automatique**

```
Si la Edge Function échoue, l'interface affiche automatiquement
les instructions pour la génération manuelle via terminal.

✅ Aucune perte de fonctionnalité !
```

---

## 📊 **MONITORING**

### **Voir les Logs**

```bash
# Logs en temps réel
supabase functions logs generate-sandbox

# Logs des dernières 24h
supabase functions logs generate-sandbox --tail
```

### **Statistiques d'Utilisation**

```
Supabase Dashboard > Edge Functions > generate-sandbox
- Nombre d'invocations
- Durée moyenne
- Taux d'erreur
- Utilisation mémoire
```

---

## 🎯 **RÉSUMÉ**

### **Avant Déploiement**
```
❌ Ouvrir un terminal
❌ Exécuter npm run generate:sandbox
❌ Attendre sans feedback visuel
❌ Rafraîchir manuellement la page
```

### **Après Déploiement**
```
✅ 1 clic sur "Générer les Données Sandbox"
✅ Feedback en temps réel dans l'interface
✅ Statistiques mises à jour automatiquement
✅ Fallback automatique si erreur
```

---

## 🚀 **COMMANDES RAPIDES**

```bash
# Installation
npm install -g supabase

# Connexion
supabase login
supabase link --project-ref csltuxbanvweyfzqpfap

# Déploiement
supabase functions deploy generate-sandbox

# Test local
supabase functions serve generate-sandbox

# Logs
supabase functions logs generate-sandbox --tail
```

---

## 🎉 **CONCLUSION**

**GÉNÉRATION AUTOMATISÉE DEPUIS L'INTERFACE !**

✅ **Edge Function créée** - Prête à déployer  
✅ **Interface mise à jour** - Appelle la fonction  
✅ **Fallback automatique** - Instructions si erreur  
✅ **Feedback en temps réel** - Toast + Stats  
✅ **Monitoring** - Logs disponibles  

**DÉPLOIE LA FONCTION ET PROFITE DE L'AUTOMATISATION ! 🏆🚀✨**

---

**Date** : 14 Janvier 2025  
**Fichier** : `supabase/functions/generate-sandbox/index.ts`  
**Statut** : ✅ PRÊT À DÉPLOYER  
**Commande** : `supabase functions deploy generate-sandbox`
