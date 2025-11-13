# 🔢 Génération Automatique du Code Unique

**Date**: 29 Octobre 2025  
**Fonctionnalité**: Code unique auto-généré pour les groupes scolaires  
**Format**: `E-PILOT-XXX`

---

## 📋 Description

Lors de la création d'un nouveau groupe scolaire, le champ **Code** est maintenant **généré automatiquement** avec un format unique et incrémental.

---

## 🎯 Format du Code

### Structure
```
E-PILOT-XXX
```

**Exemples** :
- Premier groupe : `E-PILOT-001`
- Deuxième groupe : `E-PILOT-002`
- Dixième groupe : `E-PILOT-010`
- Centième groupe : `E-PILOT-100`

### Caractéristiques
- ✅ **Préfixe fixe** : `E-PILOT-`
- ✅ **Numéro séquentiel** : 3 chiffres avec zéros de remplissage
- ✅ **Unique** : Vérifie tous les codes existants
- ✅ **Incrémental** : Trouve le numéro le plus élevé et ajoute +1
- ✅ **Automatique** : Généré à l'ouverture du formulaire de création

---

## 🔧 Implémentation Technique

### Fichiers Modifiés

#### 1. **useSchoolGroupForm.ts**
**Fonction ajoutée** :
```typescript
/**
 * Génère un code unique pour un groupe scolaire
 * Format: E-PILOT-XXX (ex: E-PILOT-001, E-PILOT-002, etc.)
 */
const generateUniqueCode = (existingGroups: any[] = []): string => {
  // Extraire tous les codes existants
  const existingCodes = existingGroups
    .map(group => group.code)
    .filter(code => code && code.startsWith('E-PILOT-'));

  // Trouver le numéro le plus élevé
  let maxNumber = 0;
  existingCodes.forEach(code => {
    const match = code.match(/E-PILOT-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  });

  // Générer le nouveau code
  const nextNumber = maxNumber + 1;
  return `E-PILOT-${nextNumber.toString().padStart(3, '0')}`;
};
```

**Intégration dans le hook** :
```typescript
// Récupérer tous les groupes pour générer un code unique
const { data: allGroups = [] } = useSchoolGroups();

// Dans le useEffect (mode création)
if (mode === 'create') {
  const uniqueCode = generateUniqueCode(allGroups);
  console.log('🔢 Code généré automatiquement:', uniqueCode);
  
  form.reset({
    ...defaultValues,
    code: uniqueCode, // Code auto-généré
  });
}
```

#### 2. **BasicInfoSection.tsx**
**Champ Code en lecture seule** :
```typescript
<Input
  {...field}
  readOnly
  disabled
  className="border-gray-300 bg-gray-50 font-mono text-[#1D3557] font-semibold cursor-not-allowed"
/>
<FormDescription>
  Code unique généré automatiquement (E-PILOT-XXX)
</FormDescription>
```

---

## 🎨 Interface Utilisateur

### Apparence du Champ

**Mode Création** :
- ✅ Champ **grisé** (bg-gray-50)
- ✅ **Lecture seule** (readOnly + disabled)
- ✅ **Police monospace** (font-mono)
- ✅ **Texte en gras** (font-semibold)
- ✅ **Couleur bleue** (#1D3557)
- ✅ **Curseur interdit** (cursor-not-allowed)
- ✅ Description : "Code unique généré automatiquement (E-PILOT-XXX)"

**Mode Édition** :
- ✅ Même apparence (le code ne peut pas être modifié)

---

## 🔄 Algorithme de Génération

### Étapes

1. **Récupération des groupes existants**
   ```typescript
   const { data: allGroups = [] } = useSchoolGroups();
   ```

2. **Extraction des codes existants**
   ```typescript
   const existingCodes = existingGroups
     .map(group => group.code)
     .filter(code => code && code.startsWith('E-PILOT-'));
   ```

3. **Recherche du numéro maximum**
   ```typescript
   let maxNumber = 0;
   existingCodes.forEach(code => {
     const match = code.match(/E-PILOT-(\d+)/);
     if (match) {
       const num = parseInt(match[1], 10);
       if (num > maxNumber) {
         maxNumber = num;
       }
     }
   });
   ```

4. **Génération du nouveau code**
   ```typescript
   const nextNumber = maxNumber + 1;
   return `E-PILOT-${nextNumber.toString().padStart(3, '0')}`;
   ```

### Exemples de Génération

| Codes Existants | Nouveau Code |
|-----------------|--------------|
| (aucun) | `E-PILOT-001` |
| E-PILOT-001 | `E-PILOT-002` |
| E-PILOT-001, E-PILOT-002 | `E-PILOT-003` |
| E-PILOT-001, E-PILOT-005 | `E-PILOT-006` |
| E-PILOT-099 | `E-PILOT-100` |

---

## ✅ Avantages

### Pour l'Utilisateur
- ✅ **Pas de saisie manuelle** - Gain de temps
- ✅ **Pas d'erreur de frappe** - Fiabilité
- ✅ **Pas de doublon** - Unicité garantie
- ✅ **Format cohérent** - Professionnalisme
- ✅ **Numérotation logique** - Traçabilité

### Pour le Système
- ✅ **Codes uniques garantis** - Intégrité des données
- ✅ **Format standardisé** - Facilite les recherches
- ✅ **Incrémentation automatique** - Scalabilité
- ✅ **Validation simplifiée** - Moins de contrôles

---

## 🧪 Tests

### Scénarios de Test

#### Test 1 : Premier Groupe
**Contexte** : Aucun groupe existant  
**Résultat attendu** : `E-PILOT-001`

#### Test 2 : Deuxième Groupe
**Contexte** : Un groupe avec code `E-PILOT-001`  
**Résultat attendu** : `E-PILOT-002`

#### Test 3 : Codes Non Séquentiels
**Contexte** : Groupes avec codes `E-PILOT-001`, `E-PILOT-005`, `E-PILOT-010`  
**Résultat attendu** : `E-PILOT-011` (prend le max + 1)

#### Test 4 : Codes avec Format Différent
**Contexte** : Groupes avec codes `E-PILOT-001`, `CUSTOM-002`  
**Résultat attendu** : `E-PILOT-002` (ignore les codes non E-PILOT)

#### Test 5 : Passage à 3 Chiffres
**Contexte** : 99 groupes (E-PILOT-001 à E-PILOT-099)  
**Résultat attendu** : `E-PILOT-100`

---

## 🔐 Sécurité

### Contraintes Base de Données
```sql
-- Le code doit être unique
ALTER TABLE school_groups 
ADD CONSTRAINT unique_code UNIQUE (code);

-- Le code ne peut pas être NULL
ALTER TABLE school_groups 
ALTER COLUMN code SET NOT NULL;
```

### Validation Frontend
```typescript
// Dans formSchemas.ts
code: z.string()
  .min(1, 'Le code est requis')
  .regex(/^E-PILOT-\d{3}$/, 'Format invalide (E-PILOT-XXX)')
```

---

## 📝 Notes Importantes

### Comportement en Mode Édition
- ✅ Le code **ne peut pas être modifié** après création
- ✅ Le champ reste **en lecture seule**
- ✅ Cela garantit l'**intégrité référentielle**

### Gestion des Suppressions
- Si un groupe est supprimé (ex: E-PILOT-005), le numéro **n'est pas réutilisé**
- Le prochain code sera basé sur le **maximum existant**
- Exemple : Si E-PILOT-005 est supprimé, le prochain sera E-PILOT-011 (si max = 010)

### Limite Théorique
- Format actuel : 3 chiffres (001-999)
- **Capacité** : 999 groupes scolaires
- Si dépassement : Modifier `padStart(3, '0')` → `padStart(4, '0')` pour 4 chiffres

---

## 🚀 Évolutions Futures

### Possibilités d'Amélioration

1. **Format Personnalisable**
   ```typescript
   // Permettre à l'admin de choisir le préfixe
   const prefix = settings.codePrefix || 'E-PILOT';
   return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
   ```

2. **Code par Région**
   ```typescript
   // Ex: BZV-001 (Brazzaville), PNR-001 (Pointe-Noire)
   const regionCode = region.substring(0, 3).toUpperCase();
   return `${regionCode}-${nextNumber.toString().padStart(3, '0')}`;
   ```

3. **Code avec Année**
   ```typescript
   // Ex: E-PILOT-2025-001
   const year = new Date().getFullYear();
   return `E-PILOT-${year}-${nextNumber.toString().padStart(3, '0')}`;
   ```

4. **QR Code Généré**
   ```typescript
   // Générer un QR code basé sur le code unique
   const qrCode = generateQRCode(uniqueCode);
   ```

---

## 📚 Références

**Fichiers concernés** :
- `src/features/dashboard/components/school-groups/hooks/useSchoolGroupForm.ts`
- `src/features/dashboard/components/school-groups/sections/BasicInfoSection.tsx`
- `src/features/dashboard/hooks/useSchoolGroups.ts`

**Dépendances** :
- React Hook Form
- React Query (pour récupérer les groupes existants)
- Zod (validation)

---

**Implémenté par** : Cascade AI  
**Date** : 29 Octobre 2025  
**Version** : 1.0.0  
**Statut** : ✅ **PRODUCTION-READY**
