# 🖼️ Guide d'Utilisation des Images - E-Pilot

## 📁 Structure des Dossiers

```
public/
├── images/
│   ├── logo/              # Logos de l'application
│   ├── illustrations/     # Illustrations et graphiques
│   ├── backgrounds/       # Images de fond
│   ├── icons/            # Icônes personnalisées
│   └── avatars/          # Photos de profil par défaut
```

---

## 🎨 1. Ajouter une Image

### **Méthode 1 : Dans public/ (Recommandé)**

**Avantages** :
- ✅ Pas de bundling (chargement direct)
- ✅ URL simple et propre
- ✅ Idéal pour images statiques
- ✅ Meilleure performance

**Étapes** :
1. Copie ton image dans `public/images/`
2. Utilise le chemin absolu dans ton code

```tsx
// Exemple
<img src="/images/logo/logo.svg" alt="Logo" />
<img src="/images/illustrations/hero.png" alt="Hero" />
```

---

### **Méthode 2 : Dans src/assets/ (Import)**

**Avantages** :
- ✅ Optimisation automatique par Vite
- ✅ Hash dans le nom (cache busting)
- ✅ Idéal pour images dynamiques

**Étapes** :
1. Crée `src/assets/images/`
2. Importe l'image dans ton composant

```tsx
import heroImage from '@/assets/images/hero.png';

<img src={heroImage} alt="Hero" />
```

---

## 🚀 2. Utilisation dans la Page de Connexion

### **Exemple 1 : Image de Fond**

```tsx
// Dans LoginPage.tsx
const BrandingSection = () => (
  <div className="relative overflow-hidden">
    {/* Image de fond */}
    <img 
      src="/images/backgrounds/login-bg.jpg" 
      alt=""
      className="absolute inset-0 w-full h-full object-cover opacity-10"
    />
    
    {/* Contenu par-dessus */}
    <div className="relative z-10">
      {/* Ton contenu */}
    </div>
  </div>
);
```

---

### **Exemple 2 : Illustration Décorative**

```tsx
// Illustration moderne
<div className="relative">
  <img 
    src="/images/illustrations/login-pattern.svg" 
    alt=""
    className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
  />
</div>
```

---

### **Exemple 3 : Logo Personnalisé**

```tsx
// Logo avec image
<div className="flex items-center gap-3">
  <img 
    src="/images/logo/logo.svg" 
    alt="E-Pilot Logo"
    className="w-12 h-12"
  />
  <h1>E-Pilot</h1>
</div>
```

---

## 🎯 3. Optimisation des Images

### **Formats Recommandés**

| Type | Format | Utilisation |
|------|--------|-------------|
| **Logo** | SVG | Vectoriel, scalable |
| **Illustrations** | SVG, PNG | Graphiques |
| **Photos** | WebP, JPG | Images réalistes |
| **Icônes** | SVG | Petites tailles |
| **Fond** | WebP, JPG | Grandes images |

---

### **Compression**

Avant d'ajouter une image :
1. **Compresse-la** : TinyPNG, Squoosh
2. **Convertis en WebP** : Meilleure compression
3. **Responsive** : Plusieurs tailles si nécessaire

---

## 📦 4. Images Lazy Loading

Pour les images non critiques :

```tsx
<img 
  src="/images/hero.jpg" 
  alt="Hero"
  loading="lazy"  // Lazy loading natif
  className="w-full h-auto"
/>
```

---

## 🎨 5. Exemples Pratiques

### **Background Pattern**

```tsx
<div 
  className="absolute inset-0"
  style={{
    backgroundImage: 'url(/images/patterns/dots.svg)',
    backgroundSize: '30px 30px',
    opacity: 0.05
  }}
/>
```

---

### **Image avec Placeholder**

```tsx
import { useState } from 'react';

const ImageWithPlaceholder = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img 
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};
```

---

### **Image Responsive**

```tsx
<picture>
  <source 
    srcSet="/images/hero-mobile.webp" 
    media="(max-width: 768px)" 
  />
  <source 
    srcSet="/images/hero-desktop.webp" 
    media="(min-width: 769px)" 
  />
  <img 
    src="/images/hero-desktop.jpg" 
    alt="Hero"
    className="w-full h-auto"
  />
</picture>
```

---

## 🔧 6. Configuration Vite (Optionnel)

Pour optimiser les images importées :

```js
// vite.config.ts
export default {
  build: {
    assetsInlineLimit: 4096, // Images < 4kb en base64
  },
  plugins: [
    // Plugin d'optimisation d'images (optionnel)
  ]
}
```

---

## 📋 7. Checklist Images

Avant d'ajouter une image :

- [ ] Compressée (< 200KB idéalement)
- [ ] Format adapté (SVG, WebP, JPG)
- [ ] Nom descriptif (kebab-case)
- [ ] Alt text descriptif
- [ ] Lazy loading si non critique
- [ ] Responsive si nécessaire

---

## 🎯 8. Où Placer Quoi ?

| Type d'Image | Emplacement | Exemple |
|--------------|-------------|---------|
| Logo | `public/images/logo/` | logo.svg |
| Illustration | `public/images/illustrations/` | login-hero.svg |
| Background | `public/images/backgrounds/` | pattern.png |
| Icône | `public/images/icons/` | custom-icon.svg |
| Avatar | `public/images/avatars/` | default-avatar.png |
| Photo | `public/images/photos/` | team-photo.jpg |

---

## 💡 Conseils Pro

1. **Utilise SVG** pour logos et icônes (scalable)
2. **WebP** pour photos (meilleure compression)
3. **Lazy loading** pour images below the fold
4. **CDN** pour images volumineuses (optionnel)
5. **Alt text** toujours descriptif (SEO + accessibilité)

---

## 🚀 Exemple Complet pour Login

```tsx
// LoginPage.tsx
const BrandingSection = () => (
  <div className="relative overflow-hidden bg-[#1D3557]">
    {/* Pattern de fond */}
    <img 
      src="/images/illustrations/login-pattern.svg"
      alt=""
      className="absolute inset-0 w-full h-full opacity-10"
    />
    
    {/* Logo */}
    <div className="relative z-10 p-12">
      <img 
        src="/images/logo/logo-white.svg"
        alt="E-Pilot Logo"
        className="w-16 h-16 mb-8"
      />
      
      {/* Illustration */}
      <img 
        src="/images/illustrations/education-hero.svg"
        alt="Gestion éducative"
        className="w-full max-w-md mx-auto"
        loading="lazy"
      />
    </div>
  </div>
);
```

---

**Développé avec ❤️ pour E-Pilot - République du Congo 🇨🇬**
