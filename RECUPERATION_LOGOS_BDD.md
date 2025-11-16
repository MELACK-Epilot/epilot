# 🖼️ RÉCUPÉRATION DES LOGOS DEPUIS LA BDD

## ✅ CORRECTION APPLIQUÉE

**Date:** 16 Novembre 2025  
**Problème:** Logos non récupérés - Placeholders affichés  
**Solution:** Récupération depuis la base de données  

---

## 🐛 PROBLÈME

### Symptôme
```
Logo Groupe: "EP" (placeholder)
Logo École: "📚" (placeholder)
```

**Cause:** Les logos n'étaient pas récupérés depuis la BDD dans la query!

---

## ✅ SOLUTION APPLIQUÉE

### 1. Modification de la Query ✅

**Fichier:** `useResourceRequestsOptimized.ts`

#### Avant ❌
```typescript
school:school_id (
  id,
  name
)
// Pas de school_group!
```

#### Après ✅
```typescript
school:school_id (
  id,
  name,
  logo_url  // ✅ Ajouté
),
school_group:school_group_id (  // ✅ Ajouté
  id,
  name,
  logo
)
```

---

### 2. Mise à Jour du Type ✅

**Fichier:** `useResourceRequestsStore.ts`

```typescript
export interface ResourceRequest {
  // ... autres champs
  
  school?: {
    id: string;
    name: string;
    logo_url?: string;  // ✅ Ajouté
  };
  
  school_group?: {  // ✅ Ajouté
    id: string;
    name: string;
    logo?: string;
  };
}
```

---

### 3. Utilisation dans printUtils ✅

**Fichier:** `printUtils.ts`

#### Avant ❌
```typescript
const schoolGroupName = 'Groupe Scolaire'; // Hardcodé
const schoolGroupLogo = '/images/logo/epilot-logo.png'; // Statique
const schoolLogo = '/images/logo/school-placeholder.png'; // Statique
```

#### Après ✅
```typescript
const schoolGroupName = request.school_group?.name || 'Groupe Scolaire';
const schoolGroupLogo = request.school_group?.logo || '/images/logo/epilot-logo.png';
const schoolLogo = request.school?.logo_url || '/images/logo/school-placeholder.png';
```

---

## 📊 STRUCTURE BDD

### Table `schools`
```sql
Column: logo_url
Type: text
```

**Exemple:**
```
logo_url: "/uploads/schools/charles-zackama-logo.png"
```

---

### Table `school_groups`
```sql
Column: logo
Type: text
```

**Exemple:**
```
logo: "/uploads/groups/groupe-scolaire-logo.png"
```

---

## 🔄 FLUX DE DONNÉES

```
1. User clique "Imprimer"
   ↓
2. printRequestWithLogos(request)
   ↓
3. Récupère depuis request:
   - request.school_group?.logo
   - request.school_group?.name
   - request.school?.logo_url
   - request.school?.name
   ↓
4. Affiche dans HTML:
   <img src="${schoolGroupLogo}" />
   <img src="${schoolLogo}" />
   ↓
5. Si image existe → Affiche
   Si erreur → Fallback placeholder
```

---

## 🖼️ AFFICHAGE

### Logo Groupe Scolaire
```html
<img src="${request.school_group?.logo}" 
     alt="Logo E-Pilot" 
     class="logo-image" 
     onerror="this.style.display='none'; 
              this.nextElementSibling.style.display='flex';" />
<div class="logo-placeholder" style="display: none;">EP</div>
```

**Comportement:**
- ✅ Si logo existe → Affiche l'image
- ✅ Si erreur → Masque image, affiche placeholder "EP"

---

### Logo École
```html
<img src="${request.school?.logo_url}" 
     alt="Logo ${schoolName}" 
     class="logo-image" 
     onerror="this.style.display='none'; 
              this.nextElementSibling.style.display='flex';" />
<div class="logo-placeholder" style="display: none;">📚</div>
```

**Comportement:**
- ✅ Si logo existe → Affiche l'image
- ✅ Si erreur → Masque image, affiche placeholder "📚"

---

## ✅ RÉSULTAT

**Maintenant:**
- ✅ Logos récupérés depuis la BDD
- ✅ Nom du groupe affiché correctement
- ✅ Logo du groupe affiché (si existe)
- ✅ Logo de l'école affiché (si existe)
- ✅ Fallback sur placeholders si erreur
- ✅ Données complètes dans le document

**Les vrais logos sont maintenant affichés!** 🖼️✨

---

## 🧪 TEST

### Vérifier les Données
```typescript
console.log('School Group:', request.school_group);
// { id: '...', name: 'Groupe Scolaire', logo: '/uploads/...' }

console.log('School:', request.school);
// { id: '...', name: 'Charles Zackama', logo_url: '/uploads/...' }
```

### Vérifier l'Affichage
```
1. Actualiser la page
2. Ouvrir une demande
3. Cliquer "Imprimer"
4. Vérifier les logos en haut
   - Gauche: Logo du groupe
   - Droite: Logo de l'école
```

---

**Développé avec ❤️ pour E-Pilot Congo**  
**Version:** 3.3 Logos depuis BDD  
**Date:** 16 Novembre 2025  
**Statut:** 🟢 Logos Récupérés
