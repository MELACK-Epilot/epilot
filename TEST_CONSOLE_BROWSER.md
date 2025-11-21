# 🧪 TEST DANS LA CONSOLE DU NAVIGATEUR

**Objectif:** Tester directement les actions dans la console

---

## 📍 ÉTAPE 1: Ouvrir la Console

1. Dans le navigateur, appuyez sur **F12**
2. Allez dans l'onglet **Console**
3. Copiez-collez les tests ci-dessous

---

## 🧪 TEST 1: Vérifier les Alertes Affichées

```javascript
// Compter les alertes
const alerts = document.querySelectorAll('[class*="border-l-2"]');
console.log(`✅ Alertes trouvées: ${alerts.length}`);

// Afficher les détails
alerts.forEach((alert, index) => {
  console.log(`Alerte ${index + 1}:`, {
    texte: alert.textContent.substring(0, 50),
    cliquable: alert.style.cursor === 'pointer' || alert.classList.contains('cursor-pointer')
  });
});
```

**Résultat Attendu:**
```
✅ Alertes trouvées: 7
Alerte 1: {...}
```

**Si 0 alertes:**
→ Problème: Les alertes ne sont pas affichées
→ Vérifier en SQL si les alertes existent

---

## 🧪 TEST 2: Vérifier les Boutons de Suppression

```javascript
// Compter les boutons ❌
const deleteButtons = document.querySelectorAll('button[title="Résoudre et supprimer"]');
console.log(`✅ Boutons suppression: ${deleteButtons.length}`);

// Compter les boutons 👁️
const readButtons = document.querySelectorAll('button[title="Marquer comme lu"]');
console.log(`✅ Boutons "marquer lu": ${readButtons.length}`);
```

**Résultat Attendu:**
```
✅ Boutons suppression: 7
✅ Boutons "marquer lu": 7
```

---

## 🧪 TEST 3: Simuler un Click sur Alerte

```javascript
// Prendre la première alerte
const firstAlert = document.querySelector('[class*="border-l-2"]');

if (firstAlert) {
  console.log('🎯 Test: Click sur première alerte...');
  
  // Vérifier si elle a un handler onClick
  const hasClickHandler = firstAlert.onclick !== null;
  console.log(`Handler onClick présent: ${hasClickHandler}`);
  
  // Simuler le clic
  firstAlert.click();
  
  console.log('✅ Clic exécuté');
  console.log('→ Vérifiez si l\'URL a changé dans la barre d\'adresse');
} else {
  console.log('❌ Aucune alerte trouvée');
}
```

**Résultat Attendu:**
- Navigation vers `/dashboard/subscriptions` ou `/dashboard/payments`
- URL change dans la barre d'adresse

**Si rien ne se passe:**
→ Le handler onClick n'est pas attaché

---

## 🧪 TEST 4: Simuler un Click sur Bouton ❌

```javascript
// Prendre le premier bouton de suppression
const firstDeleteButton = document.querySelector('button[title="Résoudre et supprimer"]');

if (firstDeleteButton) {
  console.log('🎯 Test: Click sur bouton suppression...');
  
  // Simuler le clic
  firstDeleteButton.click();
  
  console.log('✅ Clic exécuté');
  console.log('→ Vérifiez si un toast "Alerte résolue" apparaît');
  console.log('→ Vérifiez si l\'alerte disparaît');
} else {
  console.log('❌ Aucun bouton de suppression trouvé');
}
```

**Résultat Attendu:**
- Toast "Alerte résolue" apparaît
- Alerte disparaît de la liste
- Compteur diminue

---

## 🧪 TEST 5: Vérifier React Query

```javascript
// Vérifier que React Query est chargé
if (window.__REACT_QUERY_DEVTOOLS__) {
  console.log('✅ React Query est chargé');
} else {
  console.log('⚠️ React Query Devtools non détecté (normal en production)');
}

// Vérifier les hooks
console.log('Vérification des hooks...');
```

---

## 🧪 TEST 6: Vérifier les Données des Alertes

```javascript
// Essayer de récupérer les données React
const alertElements = document.querySelectorAll('[class*="border-l-2"]');

alertElements.forEach((el, i) => {
  // Chercher les données dans les attributs ou le contenu
  const title = el.querySelector('h4')?.textContent;
  const hasButton = el.querySelector('button[title*="Renouveler"]') !== null;
  
  console.log(`Alerte ${i + 1}:`, {
    titre: title,
    boutonAction: hasButton
  });
});
```

---

## 📊 INTERPRÉTATION DES RÉSULTATS

### Cas 1: "Alertes trouvées: 0"
**Problème:** Les alertes ne sont pas affichées du tout

**Vérifier en SQL:**
```sql
SELECT COUNT(*) FROM system_alerts WHERE resolved_at IS NULL;
```

**Si 0:** Exécuter le script de création d'alertes
**Si > 0:** Problème de rendu React

---

### Cas 2: "Alertes trouvées: 7" mais Click ne fait rien
**Problème:** Les handlers ne sont pas attachés

**Vérifier:**
1. Le fichier `SystemAlertsWidget.tsx` est bien chargé
2. Les imports sont corrects
3. `useNavigate` est bien importé

---

### Cas 3: Click fonctionne mais pas la suppression
**Problème:** Permissions RLS ou hook de mutation

**Vérifier en SQL:**
```sql
-- Tester manuellement
UPDATE system_alerts
SET resolved_at = NOW()
WHERE id = (SELECT id FROM system_alerts WHERE resolved_at IS NULL LIMIT 1);
```

**Si ça marche en SQL:**
→ Problème de permissions RLS pour l'utilisateur connecté

**Si ça ne marche pas:**
→ Problème de structure de table

---

### Cas 4: Tout fonctionne dans la console
**Problème:** Temporaire ou cache

**Solution:**
1. Vider le cache (Ctrl + Shift + Delete)
2. Recharger (Ctrl + Shift + R)
3. Retester

---

## 🎯 PROCHAINE ÉTAPE

**Exécutez les tests 1, 2, 3 et 4 dans la console**

**Puis partagez-moi:**
1. Combien d'alertes trouvées ?
2. Combien de boutons ?
3. Que se passe-t-il au clic ?
4. Y a-t-il des erreurs rouges ?

**Je vous donnerai la solution exacte !** 🚀
