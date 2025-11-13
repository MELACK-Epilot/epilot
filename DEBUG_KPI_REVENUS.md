# 🔍 DEBUG : KPI REVENUS AFFICHE "0K"

## 📋 **Checklist de Débogage**

### **Étape 1 : Vérifier le Port du Serveur**

Le serveur démarre sur le port **3001** (pas 3000).

✅ **Ouvrez** : `http://localhost:3001/dashboard/finances`

⚠️ **PAS** : `http://localhost:3000/dashboard/finances`

---

### **Étape 2 : Vider Complètement le Cache**

1. **Ouvrez DevTools** (F12)
2. **Clic droit** sur le bouton Rafraîchir (à gauche de la barre d'adresse)
3. Sélectionnez **"Vider le cache et actualiser"**

OU

1. **Ctrl + Shift + Delete**
2. Cochez **"Images et fichiers en cache"**
3. Période : **"Tout"**
4. Cliquez sur **"Effacer les données"**

---

### **Étape 3 : Vérifier les Logs dans la Console**

1. **Ouvrez DevTools** (F12)
2. **Onglet Console**
3. Rafraîchissez la page
4. Cherchez le log : **"🔍 DEBUG KPI Revenus:"**

**Résultat attendu** :
```javascript
🔍 DEBUG KPI Revenus: {
  mrr: 25000,
  revenus: 300000,
  financialStats: { mrr: 25000, arr: 300000, ... }
}
```

**Si vous voyez** :
```javascript
🔍 DEBUG KPI Revenus: {
  mrr: 0,
  revenus: 0,
  financialStats: { mrr: 0, ... }
}
```

→ Le problème vient du hook `useFinancialStats`

---

### **Étape 4 : Vérifier la Requête Supabase**

1. **DevTools** (F12)
2. **Onglet Network**
3. Rafraîchissez la page
4. Cherchez la requête vers **"financial_stats"**
5. Cliquez dessus
6. **Onglet Response**

**Résultat attendu** :
```json
[
  {
    "mrr": "25000.00",
    "arr": "300000.00",
    "total_revenue": "0",
    ...
  }
]
```

**Si vous voyez** :
```json
[]
```
OU
```json
{ "error": "..." }
```

→ Problème de permissions RLS ou vue non accessible

---

### **Étape 5 : Vérifier les Permissions RLS**

Exécutez ce script dans Supabase :

```sql
-- Vérifier les policies RLS sur financial_stats
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'financial_stats';

-- Si aucune policy, créer une policy pour Super Admin
CREATE POLICY "Super Admin can view financial_stats"
ON financial_stats
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'super_admin'
  OR
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'super_admin'
);
```

---

### **Étape 6 : Forcer le Rechargement du Hook**

1. **DevTools** (F12)
2. **Onglet Console**
3. Tapez :
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

---

## 🎯 **Solutions par Scénario**

### **Scénario A : MRR = 0 dans les logs**

**Cause** : Le hook ne récupère pas les données

**Solution** :
1. Vérifier que vous êtes connecté en tant que **Super Admin**
2. Vérifier les permissions RLS (Étape 5)
3. Vérifier que la vue `financial_stats` existe

---

### **Scénario B : Pas de log "🔍 DEBUG KPI Revenus"**

**Cause** : Le fichier n'a pas été rechargé

**Solution** :
1. Vérifier que vous êtes sur **http://localhost:3001** (pas 3000)
2. Faire **Ctrl + Shift + R** (rechargement forcé)
3. Vérifier dans DevTools → Sources que le fichier `Finances.tsx` contient le console.log

---

### **Scénario C : Le KPI affiche toujours "0K"**

**Cause** : Cache navigateur tenace

**Solution** :
1. **Mode Navigation Privée** :
   - Ctrl + Shift + N (Chrome)
   - Ctrl + Shift + P (Firefox)
   - Ouvrez `http://localhost:3001/dashboard/finances`

2. **OU Désactiver le cache** :
   - DevTools (F12)
   - Onglet Network
   - Cochez **"Disable cache"**
   - Gardez DevTools ouvert
   - Rafraîchissez

---

## 📊 **Résultat Attendu Final**

Après toutes ces étapes, le KPI devrait afficher :

```
Revenus
300,000
FCFA annuels (MRR × 12)
```

Et dans la console :

```javascript
🔍 DEBUG KPI Revenus: {
  mrr: 25000,
  revenus: 300000,
  financialStats: { mrr: 25000, arr: 300000, ... }
}
```

---

## 🆘 **Si Rien ne Fonctionne**

Envoyez-moi :
1. **Capture d'écran** de la console DevTools (F12)
2. **Capture d'écran** de l'onglet Network → Requête "financial_stats"
3. Le résultat de ce script SQL :
```sql
SELECT * FROM financial_stats;
```
