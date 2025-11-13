# 🎓 E-Pilot - Plateforme de Gestion Scolaire

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178c6.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

Plateforme moderne de gestion scolaire pour la République du Congo 🇨🇬

## 🚀 Démarrage Rapide

### Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Installer shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input label checkbox toast

# 3. Installer les dépendances Tailwind
npm install tailwindcss-animate @tailwindcss/forms
npm install -D @types/node

# 4. Configurer l'environnement
cp .env.example .env

# 5. Démarrer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 📋 Fonctionnalités Implémentées

### ✅ Module d'Authentification

- **Page de connexion moderne** avec design inspiré de Google/Notion
- **Validation en temps réel** avec React Hook Form + Zod
- **Gestion d'état global** avec Zustand + persistance localStorage
- **Stockage local** avec IndexedDB (Dexie.js) pour "Se souvenir de moi"
- **Animations fluides** avec Framer Motion
- **Notifications toast** pour feedback utilisateur
- **Mode mock** pour développement sans backend
- **Support PWA** et responsive design

### 🎨 Stack Technologique

- **React 19.0.0** - Framework UI moderne
- **TypeScript 5.6.3** - Typage statique
- **Vite 6.4.1** - Build tool ultra-rapide
- **React Router 7.0.2** - Routing avec lazy loading
- **Zustand 5.0.8** - Gestion d'état légère
- **React Hook Form** - Gestion de formulaires performante
- **Zod** - Validation de schémas TypeScript-first
- **Tailwind CSS 4** - Framework CSS utility-first
- **shadcn/ui** - Composants UI modernes
- **Framer Motion** - Animations fluides
- **Dexie.js** - Wrapper IndexedDB
- **Lucide React** - Icônes modernes

## 📂 Structure du Projet

```
e-pilot/
├── src/
│   ├── features/
│   │   └── auth/                    # Module d'authentification
│   │       ├── components/
│   │       │   └── LoginForm.tsx    # Formulaire de connexion
│   │       ├── pages/
│   │       │   └── LoginPage.tsx    # Page de connexion
│   │       ├── hooks/
│   │       │   └── useLogin.ts      # Hook de connexion
│   │       ├── store/
│   │       │   └── auth.store.ts    # Store Zustand
│   │       ├── types/
│   │       │   └── auth.types.ts    # Types TypeScript
│   │       ├── utils/
│   │       │   └── auth.db.ts       # Persistance IndexedDB
│   │       └── README.md            # Documentation du module
│   ├── App.tsx                      # Composant racine
│   ├── main.tsx                     # Point d'entrée
│   └── index.css                    # Styles globaux
├── public/                          # Assets statiques
├── package.json                     # Dépendances
├── tsconfig.json                    # Configuration TypeScript
├── vite.config.ts                   # Configuration Vite
├── tailwind.config.js               # Configuration Tailwind
├── GUIDE_DEMARRAGE.md              # Guide de démarrage détaillé
└── README.md                        # Ce fichier
```

## 🔐 Authentification

### Identifiants de Test

```
Email: admin@epilot.cg
Mot de passe: admin123
Rôle: Super Admin E-Pilot
```

### Utilisation

1. Accéder à `/login`
2. Entrer les identifiants
3. Cocher "Se souvenir de moi" (optionnel)
4. Cliquer sur "Se connecter"
5. Redirection automatique vers `/dashboard`

### API Mock

Le hook `useLogin` inclut une fonction `loginWithMock()` qui simule une API :
- Délai de 1 seconde pour simuler le réseau
- Validation des identifiants
- Génération de tokens JWT fictifs
- Stockage dans Zustand + IndexedDB

## 🎨 Design

### Couleurs Officielles E-Pilot 🇨🇬

- **Institutional Blue** : `#1D3557` - Couleur principale
- **Off White** : `#F9F9F9` - Fond clair
- **Light Blue Gray** : `#DCE3EA` - Bordures et fonds subtils
- **Positive Green** : `#2A9D8F` - Actions et succès
- **Republic Gold** : `#E9C46A` - Accents et badges
- **Soft Red** : `#E63946` - Erreurs et alertes

Voir le [Guide des Couleurs](./GUIDE_COULEURS.md) pour plus de détails.

### Logo

Logo "EP" bicolore :
- **E** : Off White (#F9F9F9)
- **P** : Soft Red (#E63946)
- **Fond** : Institutional Blue (#1D3557)

## 📱 PWA

L'application est configurée comme Progressive Web App :
- ✅ Installable sur mobile et desktop
- ✅ Fonctionne hors ligne (avec cache)
- ✅ Icônes adaptatives
- ✅ Manifest configuré

## 🧪 Scripts Disponibles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Prévisualisation du build
npm run preview

# Vérification TypeScript
npm run type-check

# Lint
npm run lint
```

## 📖 Documentation

- **[Guide de Démarrage](./GUIDE_DEMARRAGE.md)** - Instructions détaillées
- **[Module Auth](./src/features/auth/README.md)** - Documentation du module d'authentification

## 🔧 Configuration

### Variables d'Environnement

Créer un fichier `.env` à la racine :

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=E-Pilot
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

### Tailwind CSS

Les animations personnalisées sont configurées dans `tailwind.config.js` :
- Animation `blob` pour les effets de fond
- Délais d'animation personnalisés

## 🐛 Résolution des Problèmes

### Les erreurs TypeScript persistent

Les erreurs disparaîtront après l'installation des dépendances :
```bash
npm install
```

### Les composants shadcn/ui sont manquants

Installer les composants nécessaires :
```bash
npx shadcn@latest add button input label checkbox toast
```

### Le serveur ne démarre pas

Vérifier que le port 3000 est libre ou modifier dans `vite.config.ts`.

## 🚧 Roadmap

### Phase 1 : Authentification (✅ Terminé)
- [x] Page de connexion
- [x] Validation de formulaire
- [x] Gestion d'état
- [x] Persistance locale

### Phase 2 : Dashboard (En cours)
- [ ] Tableau de bord principal
- [ ] Statistiques
- [ ] Navigation

### Phase 3 : Gestion des Utilisateurs
- [ ] Liste des utilisateurs
- [ ] Création/Édition
- [ ] Gestion des rôles

### Phase 4 : Groupes Scolaires
- [ ] CRUD groupes scolaires
- [ ] Gestion des abonnements
- [ ] Modules et catégories

## 👥 Hiérarchie des Rôles

1. **Super Admin E-Pilot** - Niveau Plateforme
2. **Administrateur Groupe** - Niveau Groupe Scolaire
3. **Administrateur École** - Niveau École
4. **Utilisateurs** - Enseignants, CPE, Comptables, etc.

## 📄 Licence

Propriété de E-Pilot - République du Congo 🇨🇬

## 🤝 Support

Pour toute question ou assistance :
- Email : support@epilot.cg
- Documentation : Voir les fichiers README dans chaque module

---

**Développé avec ❤️ pour l'éducation au Congo-Brazzaville**
