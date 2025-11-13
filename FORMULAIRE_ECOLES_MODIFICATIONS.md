# 🎯 Modifications Formulaire Écoles - Spécifications

**Date** : 1er novembre 2025  
**Fichier** : SchoolFormDialog.IMPROVED.tsx

---

## ✅ Modifications Demandées

### 1. Logo - Upload vers Supabase Storage

**Avant** : URL manuelle
**Après** : Upload fichier + URL

**Implémentation** :
```typescript
// Upload vers Supabase Storage bucket 'school-logos'
const handleLogoUpload = async (file: File) => {
  const fileName = `${schoolGroupId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('school-logos')
    .upload(fileName, file);
    
  const { data: { publicUrl } } = supabase.storage
    .from('school-logos')
    .getPublicUrl(fileName);
    
  return publicUrl;
};
```

**Interface** :
- Zone d'upload avec drag & drop visuel
- Aperçu de l'image en temps réel
- Validation : images uniquement, max 2 MB
- Formats acceptés : PNG, JPG, SVG
- Bouton X pour supprimer

---

### 2. Ville - Liste Déroulante (Select)

**Avant** : Input texte libre
**Après** : Select avec toutes les villes du Congo-Brazzaville

**Villes par Département** :
```typescript
const VILLES_CONGO = {
  'Brazzaville': ['Brazzaville'],
  'Pointe-Noire': ['Pointe-Noire'],
  'Bouenza': ['Madingou', 'Nkayi', 'Mouyondzi', 'Boko-Songho'],
  'Cuvette': ['Owando', 'Boundji', 'Makoua', 'Okoyo'],
  'Cuvette-Ouest': ['Ewo', 'Kelle', 'Mbomo'],
  'Kouilou': ['Loango', 'Hinda', 'Madingo-Kayes', 'Mvouti'],
  'Lékoumou': ['Sibiti', 'Zanaga', 'Komono', 'Mayéyé'],
  'Likouala': ['Impfondo', 'Epena', 'Dongou', 'Bétou'],
  'Niari': ['Dolisie', 'Mossendjo', 'Divénié', 'Makabana', 'Louvakou'],
  'Plateaux': ['Djambala', 'Gamboma', 'Lekana', 'Mpouya'],
  'Pool': ['Kinkala', 'Mindouli', 'Boko', 'Kindamba', 'Ngabé'],
  'Sangha': ['Ouesso', 'Sembé', 'Souanké', 'Pikounda'],
};
```

**Logique** :
1. Sélectionner d'abord le département
2. Les villes se filtrent automatiquement
3. Si département change, ville se réinitialise

---

### 3. Département - Liste Déroulante (Select)

**Avant** : Input texte libre
**Après** : Select avec les 12 départements du Congo-Brazzaville

**12 Départements** :
```typescript
const DEPARTEMENTS_CONGO = [
  'Brazzaville',
  'Pointe-Noire',
  'Bouenza',
  'Cuvette',
  'Cuvette-Ouest',
  'Kouilou',
  'Lékoumou',
  'Likouala',
  'Niari',
  'Plateaux',
  'Pool',
  'Sangha',
];
```

**Champ requis** : Oui (validation Zod)

---

### 4. Code Postal - Optionnel

**Avant** : Peut-être requis
**Après** : Complètement optionnel

**Validation Zod** :
```typescript
code_postal: z.string().optional()
```

**Label** : "Code postal (optionnel)"

---

### 5. Directeur - SUPPRIMÉ

**Raison** : L'école sera assignée lors de la création des utilisateurs

**Champs supprimés** :
- ❌ Onglet "Directeur" entier
- ❌ directeur_nom_complet
- ❌ directeur_telephone
- ❌ directeur_email
- ❌ directeur_fonction

**Logique** :
- Le champ `admin_id` reste dans la table
- Sera rempli automatiquement lors de la création d'un utilisateur avec rôle "Directeur"
- Assignation via la page Utilisateurs

---

## 📋 Structure Finale du Formulaire

### 4 Onglets (au lieu de 5)

#### Onglet 1 : Général
- Nom (requis)
- Code (requis)
- Type établissement (select)
- Statut (select)
- Année ouverture
- Description

#### Onglet 2 : Apparence
- **Logo (upload + aperçu)**
- **Couleur (picker + prédéfinies)**

#### Onglet 3 : Localisation
- **Département (select - requis)**
- **Ville (select filtré - requis)**
- Adresse
- Commune
- **Code postal (optionnel)**

#### Onglet 4 : Contact
- Téléphone fixe
- Téléphone mobile
- Email institutionnel
- Site web
- **Statistiques** :
  - Nombre d'élèves
  - Nombre d'enseignants
  - Nombre de classes

---

## 🔧 Configuration Supabase Storage

### Créer le bucket 'school-logos'

```sql
-- Dans Supabase Storage
-- 1. Créer le bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-logos', 'school-logos', true);

-- 2. Politique d'accès (lecture publique)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-logos');

-- 3. Politique d'upload (authentifiés uniquement)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'school-logos' 
  AND auth.role() = 'authenticated'
);

-- 4. Politique de suppression (propriétaire uniquement)
CREATE POLICY "Users can delete own logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'school-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 📊 Validation Zod Mise à Jour

```typescript
const schoolSchema = z.object({
  // Général
  name: z.string().min(3, 'Nom requis (min 3 caractères)'),
  code: z.string().min(2, 'Code requis (min 2 caractères)'),
  type_etablissement: z.enum(['public', 'prive', 'confessionnel', 'autre']),
  status: z.enum(['active', 'inactive', 'suspended', 'archived']),
  
  // Apparence
  logo_url: z.string().optional(), // URL après upload
  couleur_principale: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  
  // Localisation
  departement: z.string().min(1, 'Département requis'), // ✅ Requis
  city: z.string().min(1, 'Ville requise'),             // ✅ Requis
  address: z.string().optional(),
  commune: z.string().optional(),
  code_postal: z.string().optional(),                   // ✅ Optionnel
  
  // Contact
  telephone_fixe: z.string().optional(),
  telephone_mobile: z.string().optional(),
  email_institutionnel: z.string().email().optional(),
  site_web: z.string().url().optional(),
  
  // Stats
  nombre_eleves_actuels: z.number().int().min(0),
  nombre_enseignants: z.number().int().min(0),
  nombre_classes: z.number().int().min(0),
  annee_ouverture: z.number().int().min(1900).max(2025),
  
  // Autres
  description: z.string().optional(),
});
```

---

## 🎨 Interface Upload Logo

```tsx
<div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
  <input
    type="file"
    id="logo-upload"
    accept="image/*"
    onChange={handleFileChange}
    className="hidden"
  />
  <label htmlFor="logo-upload" className="cursor-pointer">
    {logoPreview ? (
      <div className="relative">
        <img src={logoPreview} className="max-w-[200px] mx-auto" />
        <Button onClick={removeLogo}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    ) : (
      <div className="text-center">
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
        <p>Cliquez pour sélectionner un logo</p>
        <p className="text-xs">PNG, JPG, SVG (max 2 MB)</p>
      </div>
    )}
  </label>
</div>
```

---

## ✅ Checklist Implémentation

### Backend
- [ ] Créer bucket Supabase 'school-logos'
- [ ] Configurer politiques d'accès
- [ ] Tester upload/lecture/suppression

### Frontend
- [ ] Créer SchoolFormDialog.IMPROVED.tsx
- [ ] Implémenter upload logo
- [ ] Ajouter listes déroulantes (départements/villes)
- [ ] Supprimer onglet Directeur
- [ ] Rendre code postal optionnel
- [ ] Tester validation Zod

### Intégration
- [ ] Remplacer import dans Schools.tsx
- [ ] Tester création école
- [ ] Tester modification école
- [ ] Vérifier upload logo
- [ ] Vérifier sélection ville/département

---

**Formulaire Amélioré : Prêt pour Implémentation !** ✅🚀
