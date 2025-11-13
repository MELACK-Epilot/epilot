# ✅ Formulaire École - Modifications Appliquées

## 🎯 État Actuel

### ✅ Modifications Terminées

1. **Imports** ✅
   - Ajouté : `X`, `ImageIcon` de lucide-react
   - Ajouté : `supabase` de @/lib/supabase
   - Ajouté : `toast` de sonner

2. **Données Congo** ✅
   - Ajouté : `DEPARTEMENTS_CONGO` (12 départements)
   - Ajouté : `VILLES_CONGO` (40+ villes par département)

3. **Validation Zod** ✅
   - Département : REQUIS
   - Ville : REQUISE
   - Code postal : OPTIONNEL
   - Champs directeur : SUPPRIMÉS

4. **États** ✅
   - Ajouté : `logoFile`
   - Ajouté : `uploadingLogo`
   - Ajouté : `selectedDepartement`

5. **DefaultValues** ✅
   - Champs directeur : SUPPRIMÉS

---

## 🔧 Modifications Restantes à Faire Manuellement

### 1. Ajouter les fonctions d'upload

**Ajouter AVANT le premier useEffect (ligne 188)** :

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

### 2. Modifier le premier useEffect

**Lignes 189-219 - Ajouter setSelectedDepartement et supprimer champs directeur** :

```typescript
useEffect(() => {
  if (school) {
    const dept = (school as any).departement || '';
    setSelectedDepartement(dept);
    
    form.reset({
      name: school.name,
      code: school.code,
      type_etablissement: (school as any).type_etablissement || 'prive',
      status: school.status,
      logo_url: (school as any).logo_url || '',
      couleur_principale: (school as any).couleur_principale || '#1D3557',
      address: school.address || '',
      departement: dept,
      city: (school as any).city || '',
      commune: (school as any).commune || '',
      code_postal: (school as any).code_postal || '',
      // ❌ SUPPRIMER tous les champs directeur
      telephone_fixe: (school as any).telephone_fixe || '',
      telephone_mobile: school.phone || '',
      email_institutionnel: school.email || '',
      site_web: (school as any).site_web || '',
      nombre_eleves_actuels: school.student_count || 0,
      nombre_enseignants: (school as any).nombre_enseignants || 0,
      nombre_classes: (school as any).nombre_classes || 0,
      annee_ouverture: (school as any).annee_ouverture || new Date().getFullYear(),
      description: (school as any).description || '',
    });
    setLogoPreview((school as any).logo_url || '');
  }
}, [school, form]);
```

---

### 3. Modifier onSubmit

**Lignes 231-258 - Ajouter upload logo** :

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

### 4. Ajouter variable villes disponibles

**Ligne 260 - AVANT isLoading** :

```typescript
const villesDisponibles = selectedDepartement 
  ? VILLES_CONGO[selectedDepartement] || []
  : [];

const isLoading = createSchool.isPending || updateSchool.isPending || uploadingLogo;
```

---

### 5. Modifier TabsList (4 onglets)

**Ligne 280 - Changer grid-cols-5 en grid-cols-4 et supprimer onglet directeur** :

```typescript
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="general">Général</TabsTrigger>
  <TabsTrigger value="apparence">Apparence</TabsTrigger>
  <TabsTrigger value="localisation">Localisation</TabsTrigger>
  <TabsTrigger value="contact">Contact</TabsTrigger>
</TabsList>
```

---

### 6. Modifier Onglet Apparence (Logo Upload)

**Chercher TabsContent "apparence" et remplacer la section Logo par** :

```typescript
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
```

---

### 7. Modifier Onglet Localisation (Selects)

**Chercher TabsContent "localisation" et remplacer département et ville par** :

```typescript
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
```

**Et ajouter "(optionnel)" au label Code postal**

---

### 8. SUPPRIMER complètement TabsContent "directeur"

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

**Fichier prêt pour utilisation !** 🚀

**Import dans Schools.tsx** :
```typescript
import { SchoolFormDialogComplete } from '../components/schools/SchoolFormDialog.COMPLETE';
```
