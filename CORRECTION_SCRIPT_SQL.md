# ✅ CORRECTION: Script SQL

**Date:** 20 novembre 2025  
**Fichier:** `20251120_setup_complete_alerts.sql`  
**Erreur:** Syntax error at `RAISE NOTICE`

---

## ❌ PROBLÈME

### Erreur SQL
```
ERROR: 42601: syntax error at or near "RAISE"
LINE 18: RAISE NOTICE '✅ Nettoyage terminé';
```

### Cause
`RAISE NOTICE` ne peut pas être utilisé directement en dehors d'un bloc `DO $$`.

---

## ✅ SOLUTION

### Avant (Incorrect)
```sql
DELETE FROM system_alerts;
DROP TRIGGER IF EXISTS school_without_director_alert ON schools;

RAISE NOTICE '✅ Nettoyage terminé';  -- ❌ ERREUR
```

### Après (Correct)
```sql
DELETE FROM system_alerts;
DROP TRIGGER IF EXISTS school_without_director_alert ON schools;

DO $$
BEGIN
  RAISE NOTICE '✅ Nettoyage terminé';  -- ✅ CORRECT
END $$;
```

---

## 🔧 CORRECTIONS APPLIQUÉES

### 1. Ligne 18-20 (Nettoyage)
```sql
DO $$
BEGIN
  RAISE NOTICE '✅ Nettoyage terminé';
END $$;
```

### 2. Ligne 84-87 (RLS)
```sql
DO $$
BEGIN
  RAISE NOTICE '✅ RLS configuré';
END $$;
```

### 3. Ligne 175-178 (Alertes insérées)
```sql
DO $$
BEGIN
  RAISE NOTICE '✅ 7 alertes insérées';
END $$;
```

---

## ✅ SCRIPT CORRIGÉ

Le fichier `20251120_setup_complete_alerts.sql` est maintenant **prêt à être exécuté**.

### Exécution
1. Ouvrir Supabase Studio > SQL Editor
2. Copier-coller le contenu du fichier
3. Cliquer "Run"

### Résultat Attendu
```
✅ Nettoyage terminé
✅ Colonnes vérifiées/ajoutées
✅ RLS configuré
✅ 7 alertes insérées
===========================================
CONFIGURATION TERMINÉE !
===========================================
Total alertes: 7
Critiques: 2
Erreurs: 2
Avertissements: 2
Informations: 1
Avec action: 6
===========================================
✅ TOUT EST CORRECT !
```

---

## 🎯 PROCHAINE ÉTAPE

**Exécutez le script maintenant !**

Le script est corrigé et prêt à fonctionner. 🚀
