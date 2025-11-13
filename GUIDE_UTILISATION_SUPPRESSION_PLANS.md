# 📖 GUIDE - Comment Supprimer Définitivement un Plan

**Date** : 9 novembre 2025, 22:20

---

## 🎯 ÉTAPES POUR VOIR LE BOUTON DE SUPPRESSION

### **Étape 1 : Aller sur la Page Plans**

```
Navigation : Dashboard > Finances > Plans & Tarifs
```

---

### **Étape 2 : Cliquer sur "Plans Archivés"**

**Position** : En haut de la page, à côté des autres boutons

```
┌────────────────────────────────────────────────────────┐
│ Plans & Tarification                                   │
│                                                        │
│ [📦 Plans Archivés (2)] [⬇️ Exporter] [+ Nouveau]    │ ← Cliquez ici
└────────────────────────────────────────────────────────┘
```

**⚠️ IMPORTANT** : Le bouton de suppression n'apparaît QUE sur les plans archivés !

---

### **Étape 3 : Voir les Plans Archivés**

Après avoir cliqué sur "Plans Archivés", vous verrez :

```
┌─────────────────────────────────────┐
│ [📦 Archivé]                        │ ← Badge gris
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Icon]            [❌ Inactif]  │ │ ← Header gris
│ │ Plan Premium Old                │ │
│ │ 40,000 FCFA/mois                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Prix : 40,000 FCFA/mois             │
│ Écoles : 5                          │
│ Élèves : 500                        │
│                                     │
│ [🔄 Restaurer] [🗑️]                │ ← BOUTONS ICI
└─────────────────────────────────────┘
   ↑ Opacité 60%
```

---

### **Étape 4 : Cliquer sur le Bouton 🗑️**

**Boutons disponibles sur un plan archivé** :

1. **[🔄 Restaurer]** - Bouton vert, pleine largeur
2. **[🗑️]** - Bouton rouge, icône poubelle ← **CLIQUEZ ICI**

---

### **Étape 5 : Le Popup S'Ouvre**

```
┌────────────────────────────────────────────┐
│ 🗑️ Supprimer le Plan                      │ ← Header rouge
│ Action irréversible et définitive         │
├────────────────────────────────────────────┤
│                                            │
│ ⚠️ ATTENTION : Suppression Définitive     │
│ Cette action est IRRÉVERSIBLE.            │
│                                            │
│ Plan à supprimer                           │
│ Nom : Premium Old                          │
│ Prix : 40,000 FCFA                         │
│                                            │
│ Pour confirmer, tapez SUPPRIMER :         │
│ [___________________________]              │
│                                            │
│ [Annuler] [🗑️ Supprimer Définitivement]  │
└────────────────────────────────────────────┘
```

---

## 🔍 VÉRIFICATIONS

### **1. Vérifiez que vous êtes Super Admin**

Le bouton de suppression n'apparaît que pour les **Super Admins**.

```typescript
// Vérification dans le code
{isSuperAdmin && (
  <div className="p-4 bg-gray-50 border-t flex gap-2 mt-auto">
    {/* Boutons ici */}
  </div>
)}
```

---

### **2. Vérifiez que vous êtes sur "Plans Archivés"**

Le bouton n'apparaît QUE sur les plans archivés, pas sur les plans actifs.

**Plans Actifs** :
```
[✏️ Modifier] [🗑️ Archiver]
```

**Plans Archivés** :
```
[🔄 Restaurer] [🗑️ Supprimer] ← Suppression définitive
```

---

### **3. Vérifiez qu'il y a des plans archivés**

Si vous n'avez aucun plan archivé, vous ne verrez rien.

**Pour archiver un plan** :
1. Allez sur "Plans Actifs"
2. Cliquez sur l'icône 🗑️ (Archiver)
3. Confirmez l'archivage
4. Le plan passe dans "Plans Archivés"

---

## 🎯 DIFFÉRENCE ENTRE ARCHIVER ET SUPPRIMER

### **Archiver** (Plans Actifs)

```
Bouton : [🗑️] (icône Archive)
Action : is_active = false
Résultat : Plan archivé (réversible)
Restauration : Possible via "Restaurer"
```

### **Supprimer Définitivement** (Plans Archivés)

```
Bouton : [🗑️] (icône Trash2)
Action : DELETE FROM subscription_plans
Résultat : Plan supprimé (irréversible)
Restauration : IMPOSSIBLE
```

---

## 🐛 DÉPANNAGE

### **Problème 1 : Je ne vois pas le bouton "Plans Archivés"**

**Solution** : Vérifiez que vous avez au moins un plan archivé.

```sql
-- Vérifier dans la base de données
SELECT COUNT(*) 
FROM subscription_plans 
WHERE is_active = false;
```

Si le résultat est 0, vous n'avez aucun plan archivé.

---

### **Problème 2 : Le bouton 🗑️ n'apparaît pas**

**Vérifications** :
1. ✅ Êtes-vous Super Admin ?
2. ✅ Êtes-vous sur "Plans Archivés" ?
3. ✅ Le plan est-il bien archivé (opacité 60%, badge "Archivé") ?

---

### **Problème 3 : Le popup ne s'ouvre pas**

**Solution** : Vérifiez la console du navigateur (F12) pour voir les erreurs.

**Erreurs possibles** :
- Import manquant
- Composant non trouvé
- Erreur de syntaxe

---

## 📸 CAPTURES D'ÉCRAN (Description)

### **Vue Plans Actifs**

```
┌─────────────────────────────────────┐
│ [👑 Populaire]                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Icon]            [✅ Actif]    │ │ ← Couleurs vives
│ │ Plan Premium                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [✏️ Modifier] [🗑️ Archiver]        │ ← Archiver (pas supprimer)
└─────────────────────────────────────┘
```

### **Vue Plans Archivés**

```
┌─────────────────────────────────────┐
│ [📦 Archivé]                        │ ← Badge gris
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Icon]            [❌ Inactif]  │ │ ← Grayscale
│ │ Plan Premium Old                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [🔄 Restaurer] [🗑️]                │ ← Supprimer définitivement
└─────────────────────────────────────┘
   ↑ Opacité 60%
```

---

## ✅ CHECKLIST

Avant de chercher le bouton de suppression :

- [ ] Je suis connecté en tant que **Super Admin**
- [ ] J'ai cliqué sur **"Plans Archivés"** en haut de la page
- [ ] Je vois au moins un plan avec le badge **"Archivé"** gris
- [ ] Le plan a une **opacité de 60%** et un header en **niveaux de gris**
- [ ] Je vois deux boutons : **"Restaurer"** (vert) et **🗑️** (rouge)

---

## 🎯 RÉSUMÉ RAPIDE

**Pour supprimer définitivement un plan** :

1. **Allez sur** : Dashboard > Finances > Plans & Tarifs
2. **Cliquez sur** : "Plans Archivés" (en haut)
3. **Trouvez** : Le plan archivé (opacité 60%, badge "Archivé")
4. **Cliquez sur** : L'icône 🗑️ (bouton rouge à droite)
5. **Tapez** : "SUPPRIMER" dans le champ
6. **Cliquez sur** : "Supprimer Définitivement"

---

## 📞 AIDE SUPPLÉMENTAIRE

Si vous ne voyez toujours pas le bouton :

1. **Vérifiez votre rôle** : Vous devez être Super Admin
2. **Archivez un plan** : Si vous n'avez aucun plan archivé
3. **Rafraîchissez la page** : Ctrl + F5
4. **Vérifiez la console** : F12 pour voir les erreurs

**Le bouton de suppression est bien présent dans le code !** 🎉
