# ⚡ INSTRUCTIONS RAPIDES - CORRECTION MODULES & CATÉGORIES

**Problème** : Les KPI affichent 0 modules et 0 catégories

---

## ✅ SOLUTION EN 3 ÉTAPES (2 MINUTES)

### **ÉTAPE 1 : Ouvrir Supabase**
```
1. Aller sur supabase.com
2. Ouvrir votre projet E-Pilot
3. Cliquer sur "SQL Editor" dans le menu de gauche
```

### **ÉTAPE 2 : Exécuter le script**
```
1. Copier TOUT le contenu du fichier : database/FIX_MODULES_SIMPLE.sql
2. Coller dans l'éditeur SQL
3. Cliquer sur "Run" (ou Ctrl+Enter)
4. Attendre 2-3 secondes
```

### **ÉTAPE 3 : Vérifier le résultat**

Vous devriez voir en bas de l'écran :

**Vérification finale** :
```
groupe                  | plan    | modules_disponibles | categories_disponibles
------------------------|---------|---------------------|------------------------
L'INTELIGENCE SELESTE  | Gratuit | 15                  | 5
```

**Si les nombres sont > 0** → ✅ **C'EST CORRIGÉ !**

---

## 🔄 RAFRAÎCHIR L'APPLICATION

1. Retourner sur l'application E-Pilot
2. Appuyer sur **F5** pour rafraîchir la page
3. Vérifier les KPI :
   - **Modules Disponibles : 15** ✅
   - **Catégories Métiers : 5** ✅
4. Les modules doivent maintenant s'afficher dans la liste

---

## ❌ SI ERREUR "column status does not exist"

**C'est déjà corrigé !** Utilisez le fichier `FIX_MODULES_SIMPLE.sql` au lieu de `FIX_MODULES_CATEGORIES_GRATUIT.sql`.

---

## 🆘 SI ÇA NE FONCTIONNE TOUJOURS PAS

**Vérifier dans la console** (F12) :

Logs attendus :
```
📋 Plan ID: [uuid]
📦 Modules du plan trouvés: 15
✅ Modules disponibles: 15
```

Si vous voyez :
```
📦 Modules du plan trouvés: 0
```

→ Réexécuter le script `FIX_MODULES_SIMPLE.sql`

---

**Temps total** : 2 minutes ⏱️  
**Fichier à utiliser** : `database/FIX_MODULES_SIMPLE.sql` ✅
