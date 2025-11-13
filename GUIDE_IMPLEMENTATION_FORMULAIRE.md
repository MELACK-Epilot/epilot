# 🚀 Guide d'Implémentation - Formulaire École Amélioré

## ✅ Base de Données - TERMINÉ

- [x] Bucket `school-logos` créé
- [x] Champ `couleur_principale` ajouté
- [x] Scripts SQL exécutés

---

## 📝 Modifications à Appliquer au Formulaire

### Fichier à Modifier
`src/features/dashboard/components/schools/SchoolFormDialog.COMPLETE.tsx`

---

### MODIFICATION 1 : Ajouter les imports Supabase

**Ligne 30 - Après les imports Lucide** :

```typescript
import { X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
```

---

### MODIFICATION 2 : Ajouter les données Congo

**Ligne 36 - Avant le schéma de validation** :

```typescript
// ============================================================================
// DONNÉES CONGO-BRAZZAVILLE
// ============================================================================

// 12 Départements du Congo-Brazzaville
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

// Villes par département
const VILLES_CONGO: Record<string, string[]> = {
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

---

### MODIFICATION 3 : Modifier le schéma Zod

**Remplacer les lignes 52-63 (Localisation + Directeur)** :

```typescript
// Localisation
address: z.string().optional(),
departement: z.string().min(1, 'Département requis'), // ✅ REQUIS
city: z.string().min(1, 'Ville requise'),             // ✅ REQUIS
commune: z.string().optional(),
code_postal: z.string().optional(),                   // ✅ OPTIONNEL

// ❌ SUPPRIMER TOUTES LES LIGNES DIRECTEUR (59-63)
```

---

### MODIFICATION 4 : Ajouter les états pour upload

**Dans le composant, après la ligne 110 (après les hooks)** :

```typescript
const [logoFile, setLogoFile] = useState<File | null>(null);
const [logoPreview, setLogoPreview] = useState<string>('');
const [uploadingLogo, setUploadingLogo] = useState(false);
const [selectedDepartement, setSelectedDepartement] = useState<string>('');
```

---

### MODIFICATION 5 : Ajouter la fonction d'upload

**Après les états, avant useEffect** :

```typescript
// Upload logo vers Supabase Storage
const handleLogoUpload = async (file: File) => {
  if (!file) return null;

  setUploadingLogo(true);
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${schoolGroupId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('school-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('school-logos')
      .getPublicUrl(fileName);

    toast.success('Logo uploadé avec succès');
    return publicUrl;
  } catch (error: any) {
    console.error('Erreur upload logo:', error);
    toast.error('Erreur lors de l\'upload du logo');
    return null;
  } finally {
    setUploadingLogo(false);
  }
};

// Gérer la sélection du fichier
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    toast.error('Veuillez sélectionner une image');
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    toast.error('L\'image ne doit pas dépasser 2 MB');
    return;
  }

  setLogoFile(file);
  
  const reader = new FileReader();
  reader.onloadend = () => {
    setLogoPreview(reader.result as string);
  };
  reader.readAsDataURL(file);
};
```

---

### MODIFICATION 6 : Modifier useEffect pour département

**Dans useEffect, ajouter** :

```typescript
if (school) {
  const dept = (school as any).departement || '';
  setSelectedDepartement(dept);
  
  // ... reste du code existant
  setLogoPreview((school as any).logo_url || '');
}
```

---

### MODIFICATION 7 : Modifier onSubmit pour upload

**Remplacer la fonction onSubmit** :

```typescript
const onSubmit = async (data: SchoolFormData) => {
  try {
    let logoUrl = data.logo_url;

    // Upload du logo si un fichier est sélectionné
    if (logoFile) {
      const uploadedUrl = await handleLogoUpload(logoFile);
      if (uploadedUrl) {
        logoUrl = uploadedUrl;
      }
    }

    if (isEditing) {
      await updateSchool.mutateAsync({
        id: school.id,
        ...data,
        logo_url: logoUrl,
        phone: data.telephone_mobile,
        email: data.email_institutionnel,
        student_count: data.nombre_eleves_actuels,
      } as any);
    } else {
      await createSchool.mutateAsync({
        ...data,
        logo_url: logoUrl,
        school_group_id: schoolGroupId,
        admin_id: '', // Sera assigné via utilisateurs
        phone: data.telephone_mobile,
        email: data.email_institutionnel,
        student_count: data.nombre_eleves_actuels,
        staff_count: data.nombre_enseignants,
      } as any);
    }
    
    onClose();
    form.reset();
    setLogoFile(null);
    setLogoPreview('');
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

---

### MODIFICATION 8 : Ajouter variable villes disponibles

**Avant le return** :

```typescript
const villesDisponibles = selectedDepartement 
  ? VILLES_CONGO[selectedDepartement] || []
  : [];
```

---

### MODIFICATION 9 : Modifier TabsList (4 onglets au lieu de 5)

**Remplacer la ligne TabsList** :

```typescript
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="general">Général</TabsTrigger>
  <TabsTrigger value="apparence">Apparence</TabsTrigger>
  <TabsTrigger value="localisation">Localisation</TabsTrigger>
  <TabsTrigger value="contact">Contact</TabsTrigger>
</TabsList>
```

---

### MODIFICATION 10 : Modifier Onglet Apparence (Logo Upload)

**Remplacer tout le contenu de TabsContent "apparence"** :

```typescript
<TabsContent value="apparence" className="space-y-4 mt-4">
  <div className="grid grid-cols-2 gap-6">
    {/* Logo - Upload */}
    <div className="space-y-3">
      <Label>Logo de l'école</Label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2A9D8F] transition-colors">
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
              <img 
                src={logoPreview} 
                alt="Aperçu logo" 
                className="max-w-[200px] max-h-[200px] object-contain mx-auto"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-0 right-0"
                onClick={(e) => {
                  e.preventDefault();
                  setLogoFile(null);
                  setLogoPreview('');
                  form.setValue('logo_url', '');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-12 h-12 text-gray-400" />
              <p className="text-sm text-gray-600">
                Cliquez pour sélectionner un logo
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, SVG (max 2 MB)
              </p>
            </div>
          )}
        </label>
      </div>
      
      {uploadingLogo && (
        <div className="flex items-center gap-2 text-sm text-[#2A9D8F]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Upload en cours...
        </div>
      )}
    </div>

    {/* Couleur - Reste identique */}
  </div>
</TabsContent>
```

---

### MODIFICATION 11 : Modifier Onglet Localisation (Selects)

**Remplacer le contenu de TabsContent "localisation"** :

```typescript
<TabsContent value="localisation" className="space-y-4 mt-4">
  <div className="grid grid-cols-2 gap-4">
    {/* Département - SELECT */}
    <div>
      <Label htmlFor="departement">
        Département <span className="text-red-500">*</span>
      </Label>
      <Select
        value={form.watch('departement')}
        onValueChange={(value) => {
          form.setValue('departement', value);
          setSelectedDepartement(value);
          form.setValue('city', ''); // Reset ville
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionnez un département" />
        </SelectTrigger>
        <SelectContent>
          {DEPARTEMENTS_CONGO.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {form.formState.errors.departement && (
        <p className="text-sm text-red-500 mt-1">
          {form.formState.errors.departement.message}
        </p>
      )}
    </div>

    {/* Ville - SELECT FILTRÉ */}
    <div>
      <Label htmlFor="city">
        Ville <span className="text-red-500">*</span>
      </Label>
      <Select
        value={form.watch('city')}
        onValueChange={(value) => form.setValue('city', value)}
        disabled={!selectedDepartement}
      >
        <SelectTrigger>
          <SelectValue placeholder={selectedDepartement ? "Sélectionnez une ville" : "Sélectionnez d'abord un département"} />
        </SelectTrigger>
        <SelectContent>
          {villesDisponibles.map((ville) => (
            <SelectItem key={ville} value={ville}>
              {ville}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {form.formState.errors.city && (
        <p className="text-sm text-red-500 mt-1">
          {form.formState.errors.city.message}
        </p>
      )}
    </div>

    {/* Adresse, Commune, Code postal - Reste identique */}
    {/* Code postal avec label "(optionnel)" */}
  </div>
</TabsContent>
```

---

### MODIFICATION 12 : SUPPRIMER l'onglet Directeur

**Supprimer complètement TabsContent "directeur"**

---

## ✅ Résultat Final

Après ces modifications, le formulaire aura :

- ✅ Upload logo vers Supabase Storage
- ✅ Select département (12 départements)
- ✅ Select ville filtré (40+ villes)
- ✅ Code postal optionnel
- ✅ Pas d'onglet directeur
- ✅ 4 onglets au lieu de 5

---

**Fichier prêt pour modification !** 🚀
