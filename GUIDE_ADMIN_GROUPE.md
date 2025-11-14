# 📋 Guide Pratique - Admin Groupe : Gestion des Modules et Permissions

## 🎯 Vue d'ensemble

En tant qu'**Admin Groupe**, vous êtes responsable de la gestion des modules et permissions pour tous les utilisateurs de votre établissement scolaire. Ce guide vous explique comment utiliser le nouveau système robuste de permissions.

## 🚀 Démarrage Rapide

### 1. **Assignation Automatique par Rôle**

Le système assigne automatiquement des modules par défaut selon le rôle :

#### **Proviseur** 🏫
- **Modules par défaut :** Dashboard, Classes, Élèves, Personnel, Rapports, Communication
- **Permissions :** Lecture + Écriture + Export (pas de suppression)
- **Accès :** Gestion administrative et pédagogique

#### **Directeur** 👨‍💼
- **Modules par défaut :** Dashboard, Classes, Élèves, Emploi du temps, Notes, Rapports
- **Permissions :** Lecture + Écriture + Export
- **Accès :** Gestion pédagogique

#### **Enseignant** 👩‍🏫
- **Modules par défaut :** Dashboard, Mes Classes, Notes, Emploi du temps, Ressources
- **Permissions :** Lecture + Écriture (limité à ses classes)
- **Accès :** Outils pédagogiques

#### **CPE** 🛡️
- **Modules par défaut :** Dashboard, Élèves, Discipline, Absences, Communication
- **Permissions :** Lecture + Écriture
- **Accès :** Vie scolaire

#### **Comptable** 💰
- **Modules par défaut :** Dashboard, Finances, Factures, Paiements, Rapports financiers
- **Permissions :** Lecture + Écriture + Export
- **Accès :** Gestion financière

## 🔧 Actions Pratiques

### 1. **Assigner des Modules à un Utilisateur**

```sql
-- Via la console Supabase ou l'interface admin
SELECT assign_default_modules_by_role(
  'user-id-here',
  'proviseur',
  'your-school-group-id'
);
```

### 2. **Vérifier les Modules d'un Utilisateur**

1. Allez dans **Dashboard → Gestion des Accès**
2. Recherchez l'utilisateur
3. Cliquez sur **"Voir Permissions"**
4. Consultez la liste des modules assignés

### 3. **Modifier les Permissions d'un Module**

1. Dans **Gestion des Accès**, cliquez sur **"Assigner Modules"**
2. Sélectionnez les modules souhaités
3. Définissez les permissions :
   - ✅ **Lecture** : Voir le contenu
   - ✏️ **Écriture** : Modifier le contenu
   - 🗑️ **Suppression** : Supprimer des éléments
   - 📤 **Export** : Exporter des données
   - ⚙️ **Gestion** : Configuration avancée

### 4. **Dupliquer les Permissions**

Pour gagner du temps :
1. Trouvez un utilisateur avec les bonnes permissions
2. Cliquez sur **"Dupliquer Permissions"**
3. Sélectionnez les utilisateurs cibles
4. Confirmez la duplication

## 📊 Monitoring et Statistiques

### **Tableau de Bord Admin**
- **Utilisateurs avec modules :** Nombre d'utilisateurs ayant au moins un module
- **Modules les plus utilisés :** Statistiques d'accès
- **Dernière assignation :** Suivi des modifications récentes

### **Rapports Disponibles**
- Export des permissions par utilisateur
- Statistiques d'utilisation des modules
- Audit des modifications de permissions

## 🔄 Workflow Recommandé

### **Pour un Nouvel Utilisateur :**

1. **Création** → Le système assigne automatiquement les modules par défaut selon le rôle
2. **Vérification** → Contrôlez que les modules correspondent aux besoins
3. **Ajustement** → Ajoutez ou retirez des modules si nécessaire
4. **Formation** → Informez l'utilisateur des modules disponibles

### **Pour un Changement de Rôle :**

1. **Modification du rôle** → Les modules se mettent à jour automatiquement
2. **Vérification** → Contrôlez les nouveaux accès
3. **Communication** → Prévenez l'utilisateur des changements

## 🛠️ Résolution de Problèmes

### **"Un utilisateur ne voit pas ses modules"**

**Causes possibles :**
- Modules non assignés
- Permissions insuffisantes
- Cache navigateur

**Solutions :**
1. Vérifiez l'assignation dans **Gestion des Accès**
2. Réassignez les modules si nécessaire :
   ```sql
   SELECT reassign_user_modules('user-id-here');
   ```
3. Demandez à l'utilisateur de rafraîchir sa page

### **"Les modules n'apparaissent pas en temps réel"**

**Solution :** Le système utilise Supabase temps réel. Si le problème persiste :
1. Vérifiez la connexion internet
2. Rafraîchissez la page
3. Contactez le support technique

### **"Erreur lors de l'assignation"**

**Vérifications :**
- L'utilisateur existe-t-il ?
- Le groupe scolaire est-il correct ?
- Les modules sont-ils actifs ?

## 📋 Checklist de Déploiement

### **Avant de Commencer :**
- [ ] Fonction SQL `assign_default_modules_by_role` installée
- [ ] Trigger automatique activé sur la table `users`
- [ ] Modules de base créés et actifs
- [ ] Catégories de modules configurées

### **Configuration Initiale :**
- [ ] Créer les utilisateurs avec les bons rôles
- [ ] Vérifier l'assignation automatique
- [ ] Tester l'accès aux modules
- [ ] Former les utilisateurs clés

### **Maintenance Régulière :**
- [ ] Contrôler les statistiques d'utilisation
- [ ] Ajuster les permissions selon les besoins
- [ ] Nettoyer les utilisateurs inactifs
- [ ] Mettre à jour la documentation

## 🎓 Bonnes Pratiques

### **Gestion des Rôles**
- **Principe du moindre privilège :** Donnez uniquement les accès nécessaires
- **Révision régulière :** Contrôlez les permissions trimestriellement
- **Documentation :** Tenez à jour qui a accès à quoi

### **Sécurité**
- **Audit trail :** Toutes les modifications sont tracées
- **Permissions granulaires :** Utilisez les 5 niveaux (lecture, écriture, suppression, export, gestion)
- **Révocation rapide :** En cas de départ, retirez immédiatement les accès

### **Performance**
- **Cache intelligent :** Le système optimise automatiquement les accès
- **Temps réel :** Les changements sont instantanés
- **Monitoring :** Surveillez les performances via les logs

## 🆘 Support et Assistance

### **En Cas de Problème :**

1. **Consultez les logs :** Dashboard → Logs d'activité
2. **Testez avec un utilisateur test :** Utilisez le script de test fourni
3. **Contactez le support :** Avec les détails de l'erreur

### **Script de Test Rapide :**

```javascript
// Dans la console du navigateur
await testPermissionsSystem.runFullSystemTest('your-school-group-id');
```

### **Ressources Utiles :**
- 📚 **Documentation technique :** `SYSTEME_PERMISSIONS_GUIDE.md`
- 🧪 **Scripts de test :** `src/utils/testPermissionsSystem.ts`
- 🗄️ **Fonctions SQL :** `database/functions/assign_default_modules_by_role.sql`

---

## 🎉 Félicitations !

Vous maîtrisez maintenant le système de gestion des modules et permissions. Votre établissement bénéficie d'un système :

- ✅ **Robuste** : Architecture éprouvée avec Zustand + React Query
- ✅ **Automatisé** : Assignation par défaut selon les rôles
- ✅ **Temps réel** : Mises à jour instantanées
- ✅ **Sécurisé** : Permissions granulaires et audit complet
- ✅ **Évolutif** : Support pour 24 rôles différents

**Le système est opérationnel et prêt à servir votre établissement ! 🚀**
