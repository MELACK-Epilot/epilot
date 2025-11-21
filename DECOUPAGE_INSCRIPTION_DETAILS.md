# 🧩 DÉCOUPAGE: InscriptionDetails.tsx

**Date:** 20 novembre 2025  
**Fichier:** `InscriptionDetails.tsx`  
**Taille actuelle:** 700+ lignes ❌  
**Limite:** 350 lignes MAX  
**Action:** Découpage obligatoire

---

## 📊 ANALYSE

### Problème
- **Fichier trop volumineux:** 700+ lignes (200% de la limite)
- **Responsabilités multiples:** 6 sections + logique + formatage
- **Maintenabilité:** Difficile à tester et modifier
- **Réutilisabilité:** Code dupliqué entre sections

---

## 🎯 PLAN DE DÉCOUPAGE

### Structure Proposée

```
src/features/modules/inscriptions/
├── pages/
│   └── InscriptionDetails.tsx              # 150 lignes ✅ (Composition)
│
├── components/
│   └── details/
│       ├── InscriptionDetailsHeader.tsx    # 80 lignes ✅
│       ├── InscriptionEleveCard.tsx        # 60 lignes ✅
│       ├── InscriptionScolaireCard.tsx     # 70 lignes ✅
│       ├── InscriptionParentsCard.tsx      # 100 lignes ✅
│       ├── InscriptionFinanciereCard.tsx   # 80 lignes ✅
│       └── InscriptionGestionCard.tsx      # 70 lignes ✅
│
├── hooks/
│   └── useInscriptionActions.ts            # 80 lignes ✅
│
└── utils/
    └── inscription-formatters.ts           # 40 lignes ✅
```

---

## 📦 FICHIERS À CRÉER

### 1. ✅ inscription-formatters.ts (40 lignes)
**Créé:** Oui  
**Fonctions:**
- `formatMontant(montant: number): string`
- `formatDateLong(date: string): string`
- `formatDateTime(date: string): string`
- `getStatusConfig(status: string): { label, className }`
- `formatTypeInscription(type: string): string`
- `formatGenre(genre: 'M' | 'F'): string`
- `formatBoolean(value: boolean): string`

---

### 2. ⚠️ useInscriptionActions.ts (80 lignes)
**Créé:** Oui (avec erreurs à corriger)  
**Exports:**
```typescript
{
  isValidating: boolean;
  isRejecting: boolean;
  handleValidate: () => Promise<void>;
  handleReject: () => Promise<void>;
  handleEdit: () => void;
  handleDelete: () => void;
  handlePrint: () => void;
  handleExport: () => void;
}
```

**À corriger:**
- Vérifier la signature des hooks de mutations
- Adapter les paramètres selon les hooks existants

---

### 3. ❌ InscriptionDetailsHeader.tsx (80 lignes)
**À créer**

**Props:**
```typescript
interface InscriptionDetailsHeaderProps {
  inscription: Inscription;
  isValidating: boolean;
  isRejecting: boolean;
  onValidate: () => void;
  onReject: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onExport: () => void;
  onDelete: () => void;
  onBack: () => void;
}
```

**Contenu:**
- Bouton retour
- Nom de l'élève + Badge statut
- N° inscription + Année académique
- Boutons d'action (conditionnels selon statut)

---

### 4. ❌ InscriptionEleveCard.tsx (60 lignes)
**À créer**

**Props:**
```typescript
interface InscriptionEleveCardProps {
  inscription: Inscription;
}
```

**Contenu:**
- Card "👤 Informations Élève"
- 9 champs: prénom, nom, postnom, date naissance, lieu, genre, nationalité, téléphone, email

---

### 5. ❌ InscriptionScolaireCard.tsx (70 lignes)
**À créer**

**Props:**
```typescript
interface InscriptionScolaireCardProps {
  inscription: Inscription;
}
```

**Contenu:**
- Card "🎓 Informations Scolaires"
- 10+ champs: niveau, type, année, série, filière, option, redoublant, affecté, etc.

---

### 6. ❌ InscriptionParentsCard.tsx (100 lignes)
**À créer**

**Props:**
```typescript
interface InscriptionParentsCardProps {
  inscription: Inscription;
}
```

**Contenu:**
- Card "👨‍👩‍👧 Informations Parents / Tuteurs"
- 3 sous-sections: Parent 1, Parent 2, Tuteur
- Adresse commune

---

### 7. ❌ InscriptionFinanciereCard.tsx (80 lignes)
**À créer**

**Props:**
```typescript
interface InscriptionFinanciereCardProps {
  inscription: Inscription;
}
```

**Contenu:**
- Card "💰 Informations Financières"
- 11 champs: frais inscription, scolarité, cantine, transport, montant payé, solde, mode paiement, etc.

---

### 8. ❌ InscriptionGestionCard.tsx (70 lignes)
**À créer**

**Props:**
```typescript
interface InscriptionGestionCardProps {
  inscription: Inscription;
}
```

**Contenu:**
- Card "📋 Informations de Gestion"
- Statut, dates (soumission, création, validation), motif refus, observations, notes internes

---

### 9. ❌ InscriptionDetails.tsx (150 lignes) - REFACTORISÉ
**À modifier**

**Structure:**
```tsx
export const InscriptionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Hook de données
  const { data: inscription, isLoading, isError, refetch } = useInscription(id);
  
  // Hook d'actions
  const actions = useInscriptionActions({
    inscriptionId: id || '',
    onSuccess: refetch,
  });

  // États de chargement et d'erreur
  if (isLoading) return <LoadingSkeleton />;
  if (isError || !inscription) return <ErrorState />;

  // Composition des composants
  return (
    <div className="space-y-6 p-6">
      <InscriptionDetailsHeader
        inscription={inscription}
        {...actions}
        onBack={() => navigate(-1)}
      />
      
      <InscriptionEleveCard inscription={inscription} />
      <InscriptionScolaireCard inscription={inscription} />
      <InscriptionParentsCard inscription={inscription} />
      <InscriptionFinanciereCard inscription={inscription} />
      <InscriptionGestionCard inscription={inscription} />
    </div>
  );
};
```

---

## 📋 CHECKLIST DE DÉCOUPAGE

### Fichiers Créés
- [x] ✅ `inscription-formatters.ts` (40 lignes)
- [x] ⚠️ `useInscriptionActions.ts` (80 lignes - à corriger)
- [ ] ❌ `InscriptionDetailsHeader.tsx` (80 lignes)
- [ ] ❌ `InscriptionEleveCard.tsx` (60 lignes)
- [ ] ❌ `InscriptionScolaireCard.tsx` (70 lignes)
- [ ] ❌ `InscriptionParentsCard.tsx` (100 lignes)
- [ ] ❌ `InscriptionFinanciereCard.tsx` (80 lignes)
- [ ] ❌ `InscriptionGestionCard.tsx` (70 lignes)
- [ ] ❌ `InscriptionDetails.tsx` refactorisé (150 lignes)

### Tests
- [ ] Chaque composant testé individuellement
- [ ] Navigation fonctionne
- [ ] Actions fonctionnent
- [ ] Formatage correct
- [ ] Pas de régression

---

## 🎯 BÉNÉFICES ATTENDUS

### Avant
- ❌ 1 fichier de 700 lignes
- ❌ Difficile à maintenir
- ❌ Difficile à tester
- ❌ Code dupliqué
- ❌ Responsabilités mélangées

### Après
- ✅ 9 fichiers < 100 lignes chacun
- ✅ Facile à maintenir
- ✅ Facile à tester
- ✅ Code réutilisable
- ✅ Responsabilités séparées
- ✅ Composition claire

---

## 📊 STATISTIQUES

### Avant Découpage
- **Fichiers:** 1
- **Lignes totales:** 700+
- **Responsabilités:** 8 (tout mélangé)
- **Testabilité:** Faible
- **Réutilisabilité:** Faible

### Après Découpage
- **Fichiers:** 9
- **Lignes par fichier:** 40-100 (moyenne: 70)
- **Lignes totales:** ~630 (optimisé grâce à la réutilisation)
- **Responsabilités:** 1 par fichier
- **Testabilité:** Élevée
- **Réutilisabilité:** Élevée

---

## 🚀 PROCHAINES ÉTAPES

### Priorité 1: Créer les Composants Cards
1. `InscriptionEleveCard.tsx`
2. `InscriptionScolaireCard.tsx`
3. `InscriptionParentsCard.tsx`
4. `InscriptionFinanciereCard.tsx`
5. `InscriptionGestionCard.tsx`

### Priorité 2: Créer le Header
6. `InscriptionDetailsHeader.tsx`

### Priorité 3: Corriger le Hook
7. Corriger `useInscriptionActions.ts` (signatures des mutations)

### Priorité 4: Refactoriser la Page
8. Refactoriser `InscriptionDetails.tsx` (composition)

### Priorité 5: Tests
9. Tester chaque composant
10. Tester l'intégration

---

## ⏱️ TEMPS ESTIMÉ

- **Création des Cards:** 2 heures (5 cards × 25 min)
- **Création du Header:** 30 minutes
- **Correction du Hook:** 15 minutes
- **Refactorisation Page:** 30 minutes
- **Tests:** 1 heure

**Total:** ~4-5 heures

---

## 💡 RECOMMANDATION

**Voulez-vous que je continue le découpage maintenant ?**

Options:
1. ✅ **Oui, continue** → Je crée tous les composants
2. ⏸️ **Plus tard** → Je laisse le plan pour référence
3. 🎯 **Priorité spécifique** → Je crée d'abord un composant spécifique

**Le découpage est essentiel pour la maintenabilité du code !** 🚀
