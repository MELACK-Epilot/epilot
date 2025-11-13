# 📋 GUIDE D'INSTALLATION - SYSTÈME D'ALERTES V2

## 🎯 Installation en 4 étapes simples

Le système a été découpé en 4 parties pour faciliter l'exécution et le débogage.

---

## ✅ ÉTAPE 1 : Créer la table

**Fichier** : `database/PART1_DROP_AND_CREATE_TABLE.sql`

**Ce que ça fait** :
- Supprime l'ancienne table et fonctions
- Crée la nouvelle table `system_alerts`
- Crée les 7 index pour la performance
- Crée le trigger `updated_at`

**Exécution** :
1. Ouvrir Supabase SQL Editor
2. Copier le contenu de `PART1_DROP_AND_CREATE_TABLE.sql`
3. Coller et exécuter (Run)
4. Vérifier le message : ✅ PARTIE 1/4 : Table créée avec succès

---

## ✅ ÉTAPE 2 : Configurer la sécurité et fonctions de base

**Fichier** : `database/PART2_RLS_AND_FUNCTIONS.sql`

**Ce que ça fait** :
- Configure RLS (4 policies)
- Crée `create_system_alert()`
- Crée `auto_resolve_alerts()`
- Crée `cleanup_old_alerts()`

**Exécution** :
1. Copier le contenu de `PART2_RLS_AND_FUNCTIONS.sql`
2. Coller et exécuter
3. Vérifier le message : ✅ PARTIE 2/4 : RLS et fonctions de base créées

---

## ✅ ÉTAPE 3 : Créer les fonctions de vérification

**Fichier** : `database/PART3_CHECK_FUNCTIONS.sql`

**Ce que ça fait** :
- Crée `check_subscription_alerts()`
- Crée `check_user_alerts()`
- Crée `check_school_alerts()`
- Crée `check_all_alerts()`

**Exécution** :
1. Copier le contenu de `PART3_CHECK_FUNCTIONS.sql`
2. Coller et exécuter
3. Vérifier le message : ✅ PARTIE 3/4 : Fonctions de vérification créées

---

## ✅ ÉTAPE 4 : Créer les vues et générer les alertes

**Fichier** : `database/PART4_VIEWS_AND_INIT.sql`

**Ce que ça fait** :
- Crée la vue `unread_alerts`
- Crée la vue `alert_stats_by_group`
- Crée la vue `alert_summary`
- **Génère automatiquement les alertes réelles**
- Affiche le résumé

**Exécution** :
1. Copier le contenu de `PART4_VIEWS_AND_INIT.sql`
2. Coller et exécuter
3. Vérifier le message : ✅ PARTIE 4/4 : Vues créées et alertes générées !
4. Voir le nombre d'alertes actives

---

## 🎉 C'EST TERMINÉ !

Après ces 4 étapes, votre système d'alertes est **100% opérationnel** !

### **Vérifier que tout fonctionne**

```sql
-- Voir les alertes générées
SELECT * FROM public.system_alerts ORDER BY created_at DESC LIMIT 10;

-- Voir le résumé
SELECT * FROM public.alert_summary;

-- Voir les statistiques par groupe
SELECT * FROM public.alert_stats_by_group;
```

---

## 🔄 Générer de nouvelles alertes

```sql
-- Exécuter la vérification manuelle
SELECT * FROM public.check_all_alerts();
```

---

## 🎨 Interface

Les alertes s'affichent automatiquement dans le widget `SystemAlertsWidget` :
- ✅ Filtres par sévérité
- ✅ Recherche
- ✅ Bouton rafraîchir
- ✅ Résolution (bouton X)

---

## 📊 Résultat attendu

Après l'étape 4, vous devriez voir :

```
alert_type    | count
--------------+-------
subscriptions | X
users         | X
schools       | X
```

Et le résumé :
```
total_alerts | critical | error | warning | info | unread | active
-------------+----------+-------+---------+------+--------+--------
X            | X        | X     | X       | X    | X      | X
```

---

## ❌ En cas d'erreur

### **Erreur de colonne manquante**

Si vous voyez une erreur comme `column "xxx" does not exist`, c'est que la structure de votre table est différente.

**Solution** : Vérifiez la structure de vos tables :
```sql
-- Vérifier la table users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';
```

### **Recommencer depuis le début**

Si vous voulez tout recommencer :
1. Exécutez seulement la partie "NETTOYAGE" de PART1
2. Puis réexécutez les 4 parties dans l'ordre

---

## 🏆 Félicitations !

Vous avez maintenant un système d'alertes **niveau mondial** ! 🌟
