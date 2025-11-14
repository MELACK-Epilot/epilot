# 🧪 ENVIRONNEMENT SANDBOX E-PILOT

## 🎯 **QU'EST-CE QUE C'EST ?**

L'environnement **Sandbox** est un espace isolé avec des **données fictives** permettant au Super Admin de :

- ✅ Développer de nouveaux modules
- ✅ Tester les fonctionnalités
- ✅ Valider l'UX et les performances
- ✅ Former les clients
- ✅ Créer des démos

**SANS AFFECTER LES DONNÉES DE PRODUCTION** 🔒

---

## 📦 **CONTENU**

### **5 Groupes Scolaires Fictifs**

1. **Excellence Education Network** (Grand réseau - 2500 élèves)
2. **Avenir Éducation** (Réseau moyen - 1200 élèves)
3. **Savoir Plus** (Petit réseau - 600 élèves)
4. **Horizon Académie** (International - 1800 élèves)
5. **Étoile du Savoir** (Rural - 400 élèves)

### **Données Complètes**

- 📊 **20 écoles** (primaire, collège, lycée, maternelle)
- 👥 **500+ utilisateurs** (tous les rôles)
- 👨‍🎓 **6,500+ élèves** (tous les niveaux)
- 📚 **200+ classes**
- 📝 **6,500+ inscriptions**
- 📊 **50,000+ notes** (optionnel)

---

## 🚀 **DÉMARRAGE RAPIDE**

### **1. Installation**

```bash
# Installer les dépendances
npm install --save-dev @faker-js/faker tsx
```

### **2. Migration SQL**

```bash
# Exécuter dans Supabase SQL Editor
supabase/migrations/20250114_sandbox_environment.sql
```

### **3. Génération des Données**

```bash
# Générer toutes les données sandbox
npm run generate:sandbox
```

### **4. Accès**

```
URL: /dashboard/sandbox
Rôle requis: Super Admin
```

---

## 📖 **DOCUMENTATION**

### **Guides Complets**

- 📘 [Architecture Sandbox](./ARCHITECTURE_SANDBOX_SUPER_ADMIN.md)
- 📗 [Implémentation Complète](./IMPLEMENTATION_SANDBOX_COMPLETE.md)
- 📙 [Guide d'Utilisation](./GUIDE_UTILISATION_SANDBOX.md)

### **Fichiers Créés**

```
📁 supabase/migrations/
  └── 20250114_sandbox_environment.sql

📁 src/scripts/
  └── generate-sandbox-data.ts

📁 src/hooks/
  └── useIsSandbox.ts

📁 src/components/
  └── SandboxBadge.tsx

📁 src/features/dashboard/pages/
  └── SandboxManager.tsx
```

---

## 🛠️ **COMMANDES**

```bash
# Générer les données sandbox
npm run generate:sandbox

# Nettoyer les données sandbox (via SQL)
SELECT delete_sandbox_data();

# Compter les données sandbox
SELECT * FROM count_sandbox_data();
```

---

## 🔐 **SÉCURITÉ**

### **Isolation Totale**

- ✅ Marqueur `is_sandbox = true` sur toutes les données
- ✅ Policies RLS : seul le Super Admin peut voir
- ✅ Badge visuel 🧪 SANDBOX partout
- ✅ Séparation claire prod/sandbox

### **Permissions**

```sql
-- Seul le Super Admin peut accéder
CREATE POLICY "Super admin can access sandbox data"
ON school_groups
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN is_sandbox = TRUE THEN
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
      )
    ELSE TRUE
  END
);
```

---

## 📊 **STATISTIQUES**

### **Données Générées**

| Entité | Quantité |
|--------|----------|
| Groupes Scolaires | 5 |
| Écoles | 20 |
| Utilisateurs | 500+ |
| Élèves | 6,500+ |
| Classes | 200+ |
| Inscriptions | 6,500+ |
| Notes | 50,000+ |

### **Répartition**

```
Excellence Education Network: 2,500 élèves (5 écoles)
Avenir Éducation:            1,200 élèves (4 écoles)
Savoir Plus:                   600 élèves (3 écoles)
Horizon Académie:            1,800 élèves (5 écoles)
Étoile du Savoir:              400 élèves (3 écoles)
```

---

## 🎯 **CAS D'USAGE**

### **1. Développer un Module**

```bash
# 1. Générer les données
npm run generate:sandbox

# 2. Développer le module
# 3. Tester avec les données sandbox
# 4. Valider et déployer
# 5. Nettoyer
```

### **2. Tester la Scalabilité**

```bash
# Tester avec "Excellence Education Network"
# - 2500 élèves
# - 5 écoles
# - 170 enseignants
# - Mesurer les performances
```

### **3. Former un Client**

```bash
# 1. Générer les données
# 2. Préparer la démo
# 3. Montrer les fonctionnalités
# 4. Laisser le client tester
# 5. Nettoyer après
```

---

## ⚠️ **BONNES PRATIQUES**

### **✅ À FAIRE**

- Générer les données avant de développer
- Tester avec différents groupes (grand, moyen, petit)
- Vérifier les performances
- Valider l'UX
- Nettoyer après les tests

### **❌ À NE PAS FAIRE**

- Mélanger sandbox et production
- Supprimer les données sandbox en production
- Partager les accès avec les clients
- Oublier de nettoyer
- Utiliser pour des données réelles

---

## 🧹 **NETTOYAGE**

### **Via Interface**

```
Dashboard > Sandbox > Supprimer les Données
```

### **Via SQL**

```sql
SELECT delete_sandbox_data();
```

---

## 🎉 **RÉSULTAT**

✅ **Environnement de développement complet**  
✅ **Données réalistes et variées**  
✅ **Isolation totale**  
✅ **Génération automatisée**  
✅ **Interface de gestion**  
✅ **Nettoyage facile**  

**DÉVELOPPEZ EN TOUTE SÉCURITÉ ! 🏆🧪✨**

---

## 📞 **SUPPORT**

Pour toute question :
- 📧 Email: support@e-pilot.cg
- 📖 Documentation: [docs.e-pilot.cg](https://docs.e-pilot.cg)
- 💬 Slack: #sandbox-support

---

**Dernière mise à jour** : 14 Janvier 2025  
**Version** : 1.0.0  
**Auteur** : Équipe E-Pilot
