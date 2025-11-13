# 🧪 Test des Fonctions d'Export

## ✅ Installation Complète

Les packages suivants ont été installés :
- ✅ `xlsx` (v0.18.5+)
- ✅ `jspdf` (v2.5.1+)
- ✅ `jspdf-autotable` (v3.8.2+)
- ✅ `@types/jspdf` (dev)

## 🎯 Comment Tester

### **1. Démarrer l'application**
```bash
npm run dev
```

### **2. Naviguer vers les inscriptions**
1. Ouvrir l'application
2. Aller dans "Modules" → "Inscriptions"
3. Cliquer sur "Liste des inscriptions"

### **3. Tester Actualiser**
1. Cliquer sur le bouton "Actualiser" (en bas à droite de la card verte)
2. ✅ Vérifier que les données se rechargent
3. ✅ Vérifier le toast de confirmation

### **4. Tester Export CSV**
1. Cliquer sur "Exporter" (en bas à droite de la card verte)
2. Sélectionner "CSV"
3. ✅ Vérifier le téléchargement du fichier `.csv`
4. ✅ Ouvrir dans Excel ou Google Sheets
5. ✅ Vérifier les accents français
6. ✅ Vérifier les 25 colonnes
7. ✅ Vérifier les données (nom, prénom, niveau, frais, etc.)

### **5. Tester Export Excel**
1. Cliquer sur "Exporter"
2. Sélectionner "Excel"
3. ✅ Vérifier le téléchargement du fichier `.xlsx`
4. ✅ Ouvrir dans Microsoft Excel
5. ✅ Vérifier les colonnes auto-dimensionnées
6. ✅ Vérifier les formules de calcul (total, solde)
7. ✅ Vérifier le format des nombres

### **6. Tester Export PDF**
1. Cliquer sur "Exporter"
2. Sélectionner "PDF"
3. ✅ Vérifier le téléchargement du fichier `.pdf`
4. ✅ Ouvrir dans Adobe Reader ou navigateur
5. ✅ Vérifier l'en-tête (titre, date, total)
6. ✅ Vérifier le tableau formaté
7. ✅ Vérifier la mise en page A4 paysage
8. ✅ Vérifier les couleurs (en-tête vert #2A9D8F)

## 📊 Données de Test

### **Colonnes exportées (25)** :
1. N° Inscription
2. Nom
3. Prénom
4. Date de naissance
5. Sexe
6. Niveau demandé
7. Type
8. Année académique
9. Statut
10. Frais inscription
11. Frais scolarité
12. Frais cantine
13. Frais transport
14. Total frais (calculé)
15. Montant payé
16. Solde restant (calculé)
17. Parent 1 - Nom
18. Parent 1 - Téléphone
19. Parent 2 - Nom
20. Parent 2 - Téléphone
21. Téléphone élève
22. Email élève
23. Adresse
24. Ville
25. Date création

## 🐛 Problèmes Potentiels

### **Erreur : "Failed to resolve import xlsx"**
**Solution** : Les packages sont maintenant installés ✅

### **Erreur TypeScript sur jspdf-autotable**
**Solution** : Fichier de types créé dans `src/types/jspdf-autotable.d.ts` ✅

### **Export vide**
**Cause** : Aucune inscription dans la base
**Solution** : Créer au moins une inscription de test

### **Accents mal affichés dans CSV**
**Cause** : Encodage UTF-8
**Solution** : Le BOM UTF-8 est ajouté automatiquement (`\ufeff`)

### **PDF ne s'affiche pas**
**Cause** : Bloqueur de popup
**Solution** : Autoriser les téléchargements dans le navigateur

## 🎨 Personnalisation

### **Changer le nom du fichier**
Dans `InscriptionsListe.tsx` :
```typescript
<ExportMenu
  inscriptions={filteredInscriptions}
  filename="mes_inscriptions" // ← Personnaliser ici
/>
```

### **Ajouter une colonne**
Dans `exportInscriptions.ts`, ajouter dans les 3 fonctions :
```typescript
// CSV
headers.push('Nouvelle Colonne');
rows.map(inscription => [..., inscription.nouveauChamp]);

// Excel
data.map(inscription => ({
  ...data,
  'Nouvelle Colonne': inscription.nouveauChamp
}));

// PDF
tableData.map(inscription => [..., inscription.nouveauChamp]);
```

### **Changer la couleur PDF**
Dans `exportToPDF()` :
```typescript
headStyles: {
  fillColor: [42, 157, 143], // RGB de #2A9D8F
  // Changer ici ↑
}
```

## ✅ Checklist de Test

- [ ] Installation des packages réussie
- [ ] Serveur de dev démarre sans erreur
- [ ] Page inscriptions s'affiche
- [ ] Bouton "Actualiser" fonctionne
- [ ] Menu "Exporter" s'ouvre
- [ ] Export CSV télécharge
- [ ] CSV s'ouvre dans Excel
- [ ] Export Excel télécharge
- [ ] Excel s'ouvre correctement
- [ ] Export PDF télécharge
- [ ] PDF s'affiche correctement
- [ ] Toasts de notification apparaissent
- [ ] Données cohérentes avec la base

## 🚀 Prochaines Étapes

1. **Tester avec données réelles**
2. **Vérifier performance** (>1000 inscriptions)
3. **Tester sur différents navigateurs** (Chrome, Firefox, Safari)
4. **Tester sur mobile** (responsive)
5. **Ajouter tests unitaires** (optionnel)

## 📝 Notes

- Les exports sont générés côté client (pas de serveur)
- Les fichiers sont téléchargés directement
- Pas de limite de taille (sauf mémoire navigateur)
- Format date : `dd/MM/yyyy` (français)
- Format monnaie : `FCFA` (Congo)
- Encodage : UTF-8 avec BOM

---

**Statut** : ✅ Prêt pour les tests !

**Commande de démarrage** :
```bash
npm run dev
```

Bonne chance ! 🎉
