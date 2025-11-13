# 🎨 Guide des Couleurs Officielles E-Pilot

## Palette de Couleurs

### 1. **Institutional Blue** - `#1D3557`
![#1D3557](https://via.placeholder.com/100x30/1D3557/FFFFFF?text=1D3557)

**Utilisation** :
- Couleur principale de la marque
- Titres et textes importants
- Fond du logo
- Navigation principale
- Headers

**Exemples** :
```tsx
// Tailwind
<h1 className="text-[#1D3557]">Titre</h1>
<div className="bg-epilot-institutionalBlue">Contenu</div>

// CSS inline
<div style={{ color: '#1D3557' }}>Texte</div>
```

---

### 2. **Off White** - `#F9F9F9`
![#F9F9F9](https://via.placeholder.com/100x30/F9F9F9/000000?text=F9F9F9)

**Utilisation** :
- Fond principal de l'application
- Cartes et conteneurs
- Texte sur fond sombre
- Lettre "E" du logo

**Exemples** :
```tsx
<div className="bg-[#F9F9F9]">Contenu</div>
<span className="text-epilot-offWhite">Texte clair</span>
```

---

### 3. **Light Blue Gray** - `#DCE3EA`
![#DCE3EA](https://via.placeholder.com/100x30/DCE3EA/000000?text=DCE3EA)

**Utilisation** :
- Bordures subtiles
- Séparateurs
- Fonds secondaires
- États désactivés
- Fond des animations blob

**Exemples** :
```tsx
<div className="border border-[#DCE3EA]">Carte</div>
<div className="bg-epilot-lightBlueGray">Section</div>
```

---

### 4. **Positive Green** - `#2A9D8F` ⭐
![#2A9D8F](https://via.placeholder.com/100x30/2A9D8F/FFFFFF?text=2A9D8F)

**Utilisation** :
- **Couleur primaire d'action**
- Boutons principaux
- Liens cliquables
- États de succès
- Focus des inputs
- Indicateurs positifs

**Exemples** :
```tsx
<Button className="bg-[#2A9D8F] hover:bg-[#1D3557]">
  Se connecter
</Button>
<a className="text-epilot-positiveGreen hover:text-epilot-institutionalBlue">
  Lien
</a>
```

---

### 5. **Republic Gold** - `#E9C46A`
![#E9C46A](https://via.placeholder.com/100x30/E9C46A/000000?text=E9C46A)

**Utilisation** :
- Badges et labels
- Éléments de mise en évidence
- Icônes spéciales
- Accents décoratifs
- Animations blob

**Exemples** :
```tsx
<Badge className="bg-[#E9C46A] text-[#1D3557]">Premium</Badge>
<div className="border-l-4 border-epilot-republicGold">Highlight</div>
```

---

### 6. **Soft Red** - `#E63946`
![#E63946](https://via.placeholder.com/100x30/E63946/FFFFFF?text=E63946)

**Utilisation** :
- Messages d'erreur
- Alertes et avertissements
- Boutons de suppression
- États d'échec
- Lettre "P" du logo

**Exemples** :
```tsx
<p className="text-[#E63946]">⚠️ Erreur de connexion</p>
<div className="bg-[#E63946]/10 border border-[#E63946]/30">
  Message d'erreur
</div>
```

---

## 🎯 Règles d'Utilisation

### Hiérarchie des Couleurs

1. **Primaire** : Institutional Blue (#1D3557)
2. **Action** : Positive Green (#2A9D8F)
3. **Accent** : Republic Gold (#E9C46A)
4. **Erreur** : Soft Red (#E63946)
5. **Neutre** : Light Blue Gray (#DCE3EA), Off White (#F9F9F9)

### Combinaisons Recommandées

#### ✅ Bonnes Combinaisons

```tsx
// Bouton principal
bg-[#2A9D8F] text-white hover:bg-[#1D3557]

// Lien
text-[#2A9D8F] hover:text-[#1D3557]

// Carte
bg-white border-[#DCE3EA]

// Erreur
bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]

// Badge premium
bg-[#E9C46A] text-[#1D3557]
```

#### ❌ Combinaisons à Éviter

- Soft Red + Republic Gold (trop de contraste)
- Institutional Blue + Positive Green en texte (faible lisibilité)
- Off White sur Light Blue Gray (contraste insuffisant)

---

## 📦 Implémentation

### 1. Avec Tailwind CSS

```tsx
// Namespace epilot
<div className="bg-epilot-institutionalBlue text-epilot-offWhite">
  Contenu
</div>

// Valeurs hexadécimales directes
<div className="bg-[#1D3557] text-[#F9F9F9]">
  Contenu
</div>
```

### 2. Avec JavaScript/TypeScript

```typescript
import { epilotColors } from '@/styles/colors';

const styles = {
  backgroundColor: epilotColors.institutionalBlue,
  color: epilotColors.offWhite,
};

<div style={styles}>Contenu</div>
```

### 3. Configuration Tailwind

Les couleurs sont disponibles dans `tailwind.config.js` :

```javascript
colors: {
  epilot: {
    institutionalBlue: '#1D3557',
    offWhite: '#F9F9F9',
    lightBlueGray: '#DCE3EA',
    positiveGreen: '#2A9D8F',
    republicGold: '#E9C46A',
    softRed: '#E63946',
  },
}
```

---

## 🎨 Exemples de Composants

### Bouton Principal

```tsx
<Button className="bg-[#2A9D8F] hover:bg-[#1D3557] text-white">
  Action
</Button>
```

### Carte

```tsx
<div className="bg-white border border-[#DCE3EA] rounded-lg p-6">
  <h3 className="text-[#1D3557] font-bold">Titre</h3>
  <p className="text-gray-600">Description</p>
</div>
```

### Message d'Erreur

```tsx
<div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-lg p-4">
  <p className="text-[#E63946]">⚠️ Une erreur est survenue</p>
</div>
```

### Badge

```tsx
<span className="bg-[#E9C46A] text-[#1D3557] px-3 py-1 rounded-full text-sm font-medium">
  Premium
</span>
```

### Lien

```tsx
<a className="text-[#2A9D8F] hover:text-[#1D3557] font-medium transition-colors">
  En savoir plus
</a>
```

---

## 🌍 Contexte

Ces couleurs représentent l'identité visuelle d'E-Pilot pour la **République du Congo 🇨🇬** :

- **Institutional Blue** : Sérieux et professionnalisme
- **Positive Green** : Croissance et éducation
- **Republic Gold** : Excellence et valeur
- **Soft Red** : Attention et vigilance

---

## 📚 Ressources

- **Fichier de configuration** : `src/styles/colors.ts`
- **Configuration Tailwind** : `tailwind.config.js`
- **Page de connexion** : Exemple complet d'utilisation

---

**Développé avec ❤️ pour E-Pilot - République du Congo 🇨🇬**
