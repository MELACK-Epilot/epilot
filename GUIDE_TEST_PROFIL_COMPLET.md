# 🧪 GUIDE DE TEST COMPLET - PROFIL UTILISATEUR

## 🎯 OBJECTIF
Tester toutes les fonctionnalités du profil utilisateur pour s'assurer que tout fonctionne parfaitement!

---

## ✅ PRÉ-REQUIS

### 1. Vérifier que l'app tourne
```bash
npm run dev
```

### 2. Se connecter
```
Email: vianney@epilot.cg
Mot de passe: [votre mot de passe]
```

### 3. Vérifier les données en BDD
```sql
-- Ouvrir Supabase Dashboard → SQL Editor
-- Vérifier que les tables existent
SELECT COUNT(*) FROM user_preferences;
SELECT COUNT(*) FROM notification_settings;
SELECT COUNT(*) FROM login_history;

-- Résultat attendu: 10, 10, 3
```

---

## 🧪 TESTS À EFFECTUER

### TEST 1: Ouverture du Modal ✅

#### Actions:
1. Clique sur l'avatar (en haut à droite)
2. Menu dropdown s'ouvre
3. Clique "Mon Profil Personnel"

#### Résultat attendu:
```
✅ Modal s'ouvre
✅ 4 onglets visibles: Profil, Préférences, Sécurité, Notifications
✅ Onglet "Profil" actif par défaut
✅ Données chargées (prénom, nom, etc.)
```

#### Si ça ne marche pas:
```
❌ Modal ne s'ouvre pas
   → Vérifier console: erreurs React?
   → Vérifier UserProfileDialog importé dans DashboardLayout

❌ Données vides
   → Vérifier console: erreurs API?
   → Vérifier que les hooks chargent les données
```

---

### TEST 2: Onglet PROFIL 👤

#### Test 2.1: Affichage des Données
```
✅ Photo de profil affichée (ou initiales)
✅ Prénom: "vianney"
✅ Nom: "MELACK"
✅ Email: "vianney@epilot.cg" (grisé)
✅ Rôle: "Administrateur de Groupe" (badge bleu)
✅ Groupe: "LAMARELLE" (grisé)
```

#### Test 2.2: Modification Photo
**Actions:**
1. Clique "Changer la photo"
2. Sélectionne une image (< 5 MB)
3. Preview s'affiche

**Résultat attendu:**
```
✅ Preview photo visible
✅ Bouton "Supprimer" apparaît
✅ Pas d'erreur console
```

#### Test 2.3: Modification Informations
**Actions:**
1. Change prénom: "vianney" → "Vianney Test"
2. Change téléphone: "+242 06 123 45 67"
3. Clique "Enregistrer"

**Résultat attendu:**
```
✅ Toast: "Profil mis à jour avec succès! 🎉"
✅ Modal se ferme
✅ Données sauvegardées en BDD
```

**Vérification BDD:**
```sql
SELECT first_name, phone FROM users 
WHERE email = 'vianney@epilot.cg';

-- Résultat attendu:
-- first_name: "Vianney Test"
-- phone: "+242 06 123 45 67"
```

---

### TEST 3: Onglet PRÉFÉRENCES ⚙️

#### Test 3.1: Affichage Initial
**Actions:**
1. Clique onglet "Préférences"

**Résultat attendu:**
```
✅ Langue: "🇫🇷 Français" sélectionné
✅ Fuseau horaire: "🇨🇬 Brazzaville" sélectionné
✅ Thème: "💻 Système" sélectionné
```

#### Test 3.2: Changer Langue
**Actions:**
1. Change langue: Français → English
2. Clique "Enregistrer"

**Résultat attendu:**
```
✅ Toast: "Profil mis à jour! 🎉"
✅ Interface passe en anglais (si i18n implémenté)
✅ Langue sauvegardée en BDD
```

**Vérification BDD:**
```sql
SELECT language FROM user_preferences 
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');

-- Résultat attendu: "en"
```

#### Test 3.3: Changer Thème
**Actions:**
1. Change thème: Système → Sombre
2. Clique "Enregistrer"

**Résultat attendu:**
```
✅ Toast: "Profil mis à jour! 🎉"
✅ Interface passe en mode sombre (si implémenté)
✅ Thème sauvegardé en BDD
```

**Vérification BDD:**
```sql
SELECT theme FROM user_preferences 
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');

-- Résultat attendu: "dark"
```

---

### TEST 4: Onglet SÉCURITÉ 🔒

#### Test 4.1: Affichage Historique Connexion
**Actions:**
1. Clique onglet "Sécurité"
2. Scroll vers "Historique de connexion"

**Résultat attendu:**
```
✅ 3 entrées visibles:
   - 💻 Windows PC | Brazzaville, Congo | 17/11/2025 à 09:00
   - 📱 iPhone 13 | Brazzaville, Congo | 17/11/2025 à 07:00
   - 💻 Windows PC | Brazzaville, Congo | 16/11/2025 à 14:30
```

**Si pas de données:**
```
❌ Historique vide
   → Vérifier console: erreur API?
   → Vérifier que get_login_history() retourne des données
   → Exécuter:
   
   SELECT * FROM login_history 
   WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg')
   ORDER BY login_at DESC;
```

#### Test 4.2: Activer 2FA
**Actions:**
1. Clique switch "Activer 2FA"
2. Clique "Enregistrer"

**Résultat attendu:**
```
✅ Toast: "2FA activé! 🛡️"
✅ Switch reste activé
✅ Sauvegardé en BDD
```

**Vérification BDD:**
```sql
SELECT two_factor_enabled FROM user_security_settings 
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');

-- Résultat attendu: true
```

---

### TEST 5: Onglet NOTIFICATIONS 🔔

#### Test 5.1: Affichage Initial
**Actions:**
1. Clique onglet "Notifications"

**Résultat attendu:**
```
✅ Notifications générales: ON
✅ Rapport hebdomadaire: ON
✅ Rapport mensuel: ON
✅ Notifications navigateur: ON
✅ Notifications SMS: OFF
```

#### Test 5.2: Modifier Notifications
**Actions:**
1. Désactive "Notifications SMS"
2. Active "Rapport hebdomadaire"
3. Active "Rapport mensuel"
4. Clique "Enregistrer"

**Résultat attendu:**
```
✅ Toast: "Notifications mises à jour! 🔔"
✅ Paramètres sauvegardés
```

**Vérification BDD:**
```sql
SELECT 
  email_weekly_report,
  email_monthly_report,
  sms_enabled
FROM notification_settings 
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');

-- Résultat attendu:
-- email_weekly_report: true
-- email_monthly_report: true
-- sms_enabled: false
```

---

### TEST 6: Recommandation Spéciale 💡

**Actions:**
1. Scroll vers le bas de l'onglet Notifications

**Résultat attendu:**
```
✅ Encadré bleu visible avec message:
   "Pour un admin gérant 600+ écoles, nous recommandons 
    d'activer les rapports hebdomadaires et mensuels..."
```

---

### TEST 7: Fermeture et Réouverture 🔄

#### Test 7.1: Fermer Modal
**Actions:**
1. Clique "Annuler" ou X

**Résultat attendu:**
```
✅ Modal se ferme
✅ Pas d'erreur console
```

#### Test 7.2: Rouvrir Modal
**Actions:**
1. Clique avatar → "Mon Profil Personnel"

**Résultat attendu:**
```
✅ Modal s'ouvre
✅ Données précédemment sauvegardées affichées
✅ Langue: English (si changée)
✅ Thème: Sombre (si changé)
✅ Notifications: selon paramètres sauvegardés
```

---

## 🐛 PROBLÈMES COURANTS

### Problème 1: Modal ne s'ouvre pas
```
Cause possible:
- UserProfileDialog pas importé dans DashboardLayout
- État isProfileDialogOpen pas géré

Solution:
1. Vérifier import dans DashboardLayout.tsx
2. Vérifier useState(isProfileDialogOpen)
3. Vérifier onClick={() => setIsProfileDialogOpen(true)}
```

### Problème 2: Données ne se chargent pas
```
Cause possible:
- Hooks ne retournent pas de données
- Tables vides en BDD
- RPC functions pas créées

Solution:
1. Vérifier console: erreurs API?
2. Vérifier tables en BDD:
   SELECT * FROM user_preferences;
3. Vérifier RPC functions:
   SELECT * FROM pg_proc WHERE proname LIKE '%user_preferences%';
```

### Problème 3: Sauvegarde ne fonctionne pas
```
Cause possible:
- Mutations échouent
- RPC functions retournent erreur
- Permissions Supabase

Solution:
1. Vérifier console: erreur mutation?
2. Tester RPC manuellement:
   SELECT update_user_preferences(
     'user-id',
     'en',
     'Africa/Brazzaville',
     'dark'
   );
3. Vérifier permissions RLS
```

### Problème 4: Historique connexion vide
```
Cause possible:
- Pas de données de test
- RPC get_login_history() échoue

Solution:
1. Créer données de test:
   INSERT INTO login_history (user_id, device_type, location_city)
   VALUES ('user-id', 'Windows PC', 'Brazzaville');
2. Tester RPC:
   SELECT get_login_history('user-id', 10, 0);
```

---

## ✅ CHECKLIST FINALE

### Fonctionnalités
- [ ] Modal s'ouvre
- [ ] 4 onglets visibles
- [ ] Photo de profil fonctionne
- [ ] Modification prénom/nom fonctionne
- [ ] Changement langue fonctionne
- [ ] Changement thème fonctionne
- [ ] Changement timezone fonctionne
- [ ] Historique connexion affiché
- [ ] 2FA activable
- [ ] Notifications modifiables
- [ ] Sauvegarde fonctionne
- [ ] Toast notifications affichés
- [ ] Données persistées en BDD

### Performance
- [ ] Chargement rapide (< 1s)
- [ ] Pas de lag lors du changement d'onglet
- [ ] Sauvegarde rapide (< 2s)
- [ ] Pas d'erreur console

### UX
- [ ] Design moderne
- [ ] Sections colorées
- [ ] Icônes appropriées
- [ ] Messages clairs
- [ ] Feedback immédiat

---

## 🎉 RÉSULTAT ATTENDU

**Si tous les tests passent:**
```
✅ Modal profil 100% fonctionnel
✅ Données chargées depuis BDD
✅ Modifications sauvegardées
✅ Historique connexion réel
✅ UX moderne et professionnelle
✅ PRÊT POUR PRODUCTION!
```

---

## 📞 SUPPORT

**Si problème persistant:**
1. Vérifier console navigateur
2. Vérifier console Supabase (logs)
3. Vérifier tables BDD
4. Vérifier RPC functions
5. Contacter l'équipe dev

---

**Bon test!** 🚀

**Développé avec ❤️ pour E-Pilot Congo-Brazzaville** 🇨🇬
