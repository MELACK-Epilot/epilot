# 🔍 Diagnostic : Bouton "➕ Créer" ne fonctionne pas

**Date** : 4 novembre 2025  
**Problème** : Après remplissage du formulaire, cliquer sur "➕ Créer" ne fait rien

---

## 🎯 Causes possibles

### 1. ❌ Validation Zod échoue silencieusement

**Symptôme** : Le formulaire ne se soumet pas, aucun message d'erreur

**Causes** :
- Champ obligatoire vide
- Format invalide (email, téléphone, mot de passe)
- Groupe scolaire non sélectionné pour admin_groupe

### 2. ❌ Erreur JavaScript dans la console

**Symptôme** : Erreur bloquante non visible

**Causes** :
- Erreur dans `onSubmit()`
- Erreur dans `useCreateUser`
- Erreur Supabase

### 3. ❌ État du formulaire invalide

**Symptôme** : `form.formState.isValid = false`

**Causes** :
- Erreurs de validation non affichées
- Champs requis non remplis

---

## 🧪 Tests de diagnostic

### Test 1 : Vérifier la console (F12)

**Ouvrir la console** et chercher :

```javascript
// Logs attendus au click :
🔘 Bouton Créer cliqué
📋 État du formulaire: {
  isValid: true/false,
  errors: {...},
  values: {...}
}

// Si onSubmit est appelé :
🚀 onSubmit appelé avec les valeurs: {...}
📋 Mode: create
👤 User: null
📤 Données à soumettre (création): {...}
```

**Si aucun log** → Le click n'est pas détecté  
**Si logs mais pas de soumission** → Validation échoue  
**Si erreur rouge** → Bug JavaScript

---

### Test 2 : Vérifier les erreurs de validation

**Dans la console, taper** :

```javascript
// Récupérer l'état du formulaire
const form = document.querySelector('form');
console.log('Erreurs:', form);
```

**Ou chercher visuellement** :
- Messages d'erreur en rouge sous les champs
- Champs avec bordure rouge

---

### Test 3 : Données minimales requises

**Pour créer un Admin Groupe**, remplir EXACTEMENT :

| Champ | Valeur | Format |
|-------|--------|--------|
| **Prénom** | Test | 2+ caractères, lettres uniquement |
| **Nom** | AdminGroupe | 2+ caractères, lettres uniquement |
| **Email** | test.admin@epilot.cg | Format email, .cg ou .com |
| **Téléphone** | 069698620 | 9 chiffres (le +242 est auto) |
| **Genre** | (laisser vide) | Optionnel |
| **Date naissance** | (laisser vide) | Optionnel |
| **Rôle** | Administrateur de Groupe Scolaire | ⚠️ OBLIGATOIRE |
| **Groupe Scolaire** | [SÉLECTIONNER UN GROUPE] | ⚠️ OBLIGATOIRE pour admin_groupe |
| **Mot de passe** | Test@1234 | 8+ car, 1 maj, 1 min, 1 chiffre, 1 spécial |
| **Email bienvenue** | ☑ Coché | Optionnel |

---

### Test 4 : Vérifier qu'un groupe existe

**Si le dropdown "Groupe Scolaire" est vide** :

```sql
-- Dans Supabase SQL Editor
SELECT id, name, code FROM school_groups LIMIT 5;
```

**Si aucun résultat** → Créer un groupe d'abord :
1. Aller sur `/dashboard/school-groups`
2. Créer un groupe scolaire
3. Revenir sur `/dashboard/users`

---

## 🔧 Solutions selon le diagnostic

### Solution 1 : Groupe scolaire manquant

**Problème** : Le champ "Groupe Scolaire" est vide ou non sélectionné

**Validation Zod** :
```typescript
.refine((data) => {
  if (data.role === 'admin_groupe') {
    return data.schoolGroupId && data.schoolGroupId.length > 0;
  }
  return true;
}, {
  message: 'Le groupe scolaire est obligatoire pour un Administrateur de Groupe',
  path: ['schoolGroupId'],
})
```

**Solution** :
1. Sélectionner un groupe dans le dropdown
2. Si le dropdown est vide, créer un groupe d'abord

---

### Solution 2 : Format du téléphone invalide

**Problème** : Le téléphone ne respecte pas le format

**Validation Zod** :
```typescript
.refine((val) => /^\+242[0-9]{9}$/.test(val), {
  message: 'Format invalide. Exemples valides: +242069698620 ou 069698620',
})
```

**Solution** :
- Saisir **9 chiffres** uniquement : `069698620`
- Le `+242` est ajouté automatiquement

---

### Solution 3 : Mot de passe faible

**Problème** : Le mot de passe ne respecte pas les règles

**Validation Zod** :
```typescript
.min(8, 'Minimum 8 caractères')
.regex(/[A-Z]/, 'Au moins une majuscule')
.regex(/[a-z]/, 'Au moins une minuscule')
.regex(/[0-9]/, 'Au moins un chiffre')
.regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial')
```

**Solution** :
- Utiliser : `Test@1234` (8 car, 1 maj, 1 min, 1 chiffre, 1 spécial)

---

### Solution 4 : Email invalide

**Problème** : L'email ne se termine pas par .cg ou .com

**Validation Zod** :
```typescript
.refine((email) => email.endsWith('.cg') || email.endsWith('.com'), {
  message: 'Email doit se terminer par .cg ou .com',
})
```

**Solution** :
- Utiliser : `test.admin@epilot.cg` ou `test.admin@epilot.com`

---

### Solution 5 : Prénom/Nom invalide

**Problème** : Contient des chiffres ou caractères spéciaux

**Validation Zod** :
```typescript
.regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le prénom ne peut contenir que des lettres')
```

**Solution** :
- Utiliser uniquement des lettres : `Test`, `AdminGroupe`
- Pas de chiffres : ❌ `Test123`
- Pas de caractères spéciaux : ❌ `Test@Admin`

---

## 🐛 Bugs potentiels identifiés

### Bug 1 : Validation mode="onBlur"

**Code actuel** :
```typescript
const form = useForm({
  resolver: zodResolver(createUserSchema),
  defaultValues,
  mode: 'onBlur',  // ⚠️ Validation au blur
});
```

**Problème** : Si un champ n'a jamais été "blur", il n'est pas validé

**Solution temporaire** : Changer en `mode: 'onChange'`

```typescript
const form = useForm({
  resolver: zodResolver(createUserSchema),
  defaultValues,
  mode: 'onChange',  // ✅ Validation en temps réel
});
```

---

### Bug 2 : schoolGroupId vide par défaut

**Code actuel** :
```typescript
defaultValues: {
  schoolGroupId: '',  // ⚠️ Chaîne vide
}
```

**Problème** : Zod considère `''` comme valide pour `.optional()`

**Solution** : Forcer `undefined` si vide

```typescript
.refine((val) => !val || val.length > 0, {
  message: 'Veuillez sélectionner un groupe scolaire',
})
```

**Déjà corrigé** ✅ (ligne 107)

---

## 📋 Checklist de débogage

Avant de créer un utilisateur, vérifier :

### Prérequis
- [ ] Le serveur dev tourne (`npm run dev`)
- [ ] Supabase est accessible
- [ ] Au moins 1 groupe scolaire existe
- [ ] La console (F12) est ouverte

### Formulaire
- [ ] Tous les champs obligatoires sont remplis
- [ ] Aucun message d'erreur rouge visible
- [ ] Le dropdown "Groupe Scolaire" contient des options
- [ ] Un groupe est sélectionné (pour admin_groupe)
- [ ] Le mot de passe respecte les règles

### Console
- [ ] Aucune erreur rouge
- [ ] Les logs du bouton apparaissent au click
- [ ] `isValid: true` dans les logs
- [ ] `errors: {}` (objet vide)

---

## 🧪 Script de test automatique

**Copier-coller dans la console (F12)** :

```javascript
// Test 1 : Vérifier l'état du formulaire
const formElement = document.querySelector('form');
if (formElement) {
  console.log('✅ Formulaire trouvé');
  
  // Récupérer tous les inputs
  const inputs = formElement.querySelectorAll('input, select, textarea');
  console.log('📋 Nombre de champs:', inputs.length);
  
  // Vérifier les champs vides
  const emptyFields = Array.from(inputs).filter(input => {
    return input.hasAttribute('required') && !input.value;
  });
  
  if (emptyFields.length > 0) {
    console.warn('⚠️ Champs obligatoires vides:', emptyFields.length);
    emptyFields.forEach(field => {
      console.log('  -', field.name || field.id);
    });
  } else {
    console.log('✅ Tous les champs obligatoires sont remplis');
  }
} else {
  console.error('❌ Formulaire non trouvé');
}

// Test 2 : Vérifier le bouton submit
const submitButton = document.querySelector('button[type="submit"]');
if (submitButton) {
  console.log('✅ Bouton submit trouvé');
  console.log('   Texte:', submitButton.textContent);
  console.log('   Désactivé:', submitButton.disabled);
} else {
  console.error('❌ Bouton submit non trouvé');
}

// Test 3 : Vérifier les groupes scolaires
const groupSelect = document.querySelector('select[name="schoolGroupId"]');
if (groupSelect) {
  const options = groupSelect.querySelectorAll('option');
  console.log('📋 Groupes scolaires disponibles:', options.length - 1);
  if (options.length <= 1) {
    console.warn('⚠️ Aucun groupe scolaire disponible !');
    console.log('   → Créez un groupe d\'abord sur /dashboard/school-groups');
  }
}
```

---

## 🎯 Procédure de test complète

### Étape 1 : Préparer l'environnement

```bash
# Terminal 1 : Lancer le serveur
npm run dev

# Terminal 2 : Vérifier Supabase
# Ouvrir : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap
```

### Étape 2 : Créer un groupe scolaire (si nécessaire)

1. Aller sur `http://localhost:3000/dashboard/school-groups`
2. Cliquer sur "Nouveau groupe"
3. Remplir :
   - Nom : Groupe Test
   - Code : GT001
   - Type : Privé
4. Cliquer sur "Créer"

### Étape 3 : Ouvrir le formulaire utilisateur

1. Aller sur `http://localhost:3000/dashboard/users`
2. Ouvrir la console (F12)
3. Cliquer sur "Nouvel utilisateur"

### Étape 4 : Remplir le formulaire

```
Prénom : Test
Nom : AdminGroupe
Email : test.admin@epilot.cg
Téléphone : 069698620
Rôle : Administrateur de Groupe Scolaire
Groupe Scolaire : [SÉLECTIONNER "Groupe Test"]
Mot de passe : Test@1234
```

### Étape 5 : Cliquer sur "➕ Créer"

**Observer dans la console** :

```javascript
// Logs attendus :
🔘 Bouton Créer cliqué
📋 État du formulaire: {
  isValid: true,
  errors: {},
  values: {
    firstName: "Test",
    lastName: "AdminGroupe",
    email: "test.admin@epilot.cg",
    phone: "+242069698620",
    role: "admin_groupe",
    schoolGroupId: "uuid-du-groupe",
    password: "Test@1234",
    sendWelcomeEmail: true
  }
}
🚀 onSubmit appelé avec les valeurs: {...}
📤 Données à soumettre (création): {...}
```

**Si ça fonctionne** :
- ✅ Toast vert : "Utilisateur créé avec succès"
- ✅ Dialog se ferme
- ✅ Utilisateur apparaît dans la liste

**Si ça ne fonctionne pas** :
- ❌ Pas de logs → Problème de click
- ❌ `isValid: false` → Erreurs de validation
- ❌ Erreur rouge → Bug JavaScript

---

## 📞 Que faire si ça ne fonctionne toujours pas ?

**Partage-moi** :

1. **Capture d'écran** du formulaire rempli
2. **Logs de la console** (F12) après avoir cliqué sur "Créer"
3. **Valeurs saisies** dans chaque champ
4. **Résultat de la requête SQL** :
   ```sql
   SELECT COUNT(*) FROM school_groups;
   ```

Je pourrai alors identifier le problème exact !

---

## 🎉 Si ça fonctionne

**Félicitations !** Le formulaire est opérationnel.

**Prochaines étapes** :
1. Tester la création d'un Super Admin
2. Tester la modification d'un utilisateur
3. Tester la suppression d'un utilisateur
4. Vérifier que les données sont correctes en base

---

**Teste maintenant et dis-moi ce qui se passe !** 🚀
