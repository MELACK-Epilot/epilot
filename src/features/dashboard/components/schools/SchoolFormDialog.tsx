/**
 * Dialog de création/modification d'école
 * Pour Administrateur Groupe Scolaire
 */

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  useCreateSchool, 
  useUpdateSchool,
  type School 
} from '../../hooks/useSchools-simple';
import { generateUniqueSchoolCode, validateSchoolCodeUniqueness } from '../../utils/schoolCodeGenerator';

// ============================================================================
// DONNÉES CONGO-BRAZZAVILLE
// ============================================================================

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
] as const;

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

// ============================================================================
// SCHÉMA DE VALIDATION
// ============================================================================

const schoolSchema = z.object({
  // Informations de base
  name: z.string().min(3, 'Nom requis (min 3 caractères)'),
  code: z.string().min(2, 'Code requis (min 2 caractères)'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  type_etablissement: z.enum(['prive', 'public']).default('prive'),
  
  // Niveaux d'enseignement (booléens pour correspondre à la BDD)
  has_preschool: z.boolean().default(false),
  has_primary: z.boolean().default(false),
  has_middle: z.boolean().default(false),
  has_high: z.boolean().default(false),
  
  annee_ouverture: z.string().optional(),
  description: z.string().optional(),
  
  // Logo et apparence
  logo_url: z.string().optional(),
  couleur_principale: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').optional(),
  
  // Localisation
  address: z.string().optional(),
  departement: z.string().min(1, 'Département requis'),
  city: z.string().min(1, 'Ville requise'),
  commune: z.string().optional(),
  region: z.string().optional(),
  pays: z.string().default('Congo'),
  code_postal: z.string().optional(),
  gps_latitude: z.number().optional(),
  gps_longitude: z.number().optional(),
  
  // Contact principal
  phone: z.string().optional(),
  telephone_fixe: z.string().optional(),
  telephone_mobile: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  email_institutionnel: z.string().email('Email invalide').optional().or(z.literal('')),
  site_web: z.union([z.string().url('URL invalide'), z.literal('')]).optional(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

// ============================================================================
// PROPS
// ============================================================================

interface SchoolFormDialogProps {
  isOpen: boolean;
  school?: School | null;
  onClose: () => void;
  schoolGroupId: string; // ID du groupe de l'admin connecté
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function SchoolFormDialog({ 
  isOpen, 
  school, 
  onClose,
  schoolGroupId 
}: SchoolFormDialogProps) {
  const isEditing = !!school;
  const createSchool = useCreateSchool();
  const updateSchool = useUpdateSchool();

  const form = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      code: '',
      status: 'active',
      type_etablissement: 'prive',
      has_preschool: false,
      has_primary: true, // Primaire par défaut
      has_middle: false,
      has_high: false,
      annee_ouverture: '',
      description: '',
      logo_url: '',
      couleur_principale: '#1D3557',
      address: '',
      departement: '',
      city: '',
      commune: '',
      region: '',
      pays: 'Congo',
      code_postal: '',
      phone: '',
      telephone_fixe: '',
      telephone_mobile: '',
      email: '',
      email_institutionnel: '',
      site_web: '',
      gps_latitude: undefined,
      gps_longitude: undefined,
    },
  });

  useEffect(() => {
    form.register('status');
    form.register('type_etablissement');
    form.register('has_preschool');
    form.register('has_primary');
    form.register('has_middle');
    form.register('has_high');
    form.register('pays');
    form.register('region');
  }, [form]);

  // États pour l'upload du logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  // Génération automatique du code basé sur le nom
  const handleGenerateCode = async (schoolName: string) => {
    if (!schoolName.trim() || isEditing) return; // Ne pas générer en mode édition
    
    try {
      setGeneratingCode(true);
      const uniqueCode = await generateUniqueSchoolCode(schoolName, schoolGroupId);
      form.setValue('code', uniqueCode);
      console.log('✅ Code généré automatiquement:', uniqueCode);
    } catch (error) {
      console.error('❌ Erreur génération code:', error);
      toast.error('Erreur lors de la génération du code');
    } finally {
      setGeneratingCode(false);
    }
  };

  // Valeur dérivée pour le département sélectionné (React 19 best practice)
  const selectedDepartement = form.watch('departement');

  // Calcul mémorisé des villes disponibles
  const villesDisponibles = useMemo(() => {
    if (!selectedDepartement) return [];
    return VILLES_CONGO[selectedDepartement] || [];
  }, [selectedDepartement]);

  // Aperçu du logo
  const logoPreview = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile);
    return school?.logo_url || '';
  }, [logoFile, school]);

  // Cleanup des blob URLs
  useEffect(() => {
    return () => {
      if (logoFile && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoFile, logoPreview]);

  // Remplir le formulaire en mode édition
  useEffect(() => {
    if (school) {
      form.reset({
        name: school.name,
        code: school.code,
        status: school.status,
        type_etablissement: (school as any).type_etablissement || 'prive',
        has_preschool: (school as any).has_preschool || false,
        has_primary: (school as any).has_primary || false,
        has_middle: (school as any).has_middle || false,
        has_high: (school as any).has_high || false,
        annee_ouverture: (school as any).annee_ouverture || '',
        description: (school as any).description || '',
        logo_url: school.logo_url || '',
        couleur_principale: (school as any).couleur_principale || '#1D3557',
        address: school.address || '',
        departement: (school as any).departement || '',
        city: (school as any).city || '',
        commune: (school as any).commune || '',
        region: (school as any).region || '',
        pays: (school as any).pays || 'Congo',
        code_postal: (school as any).code_postal || '',
        phone: school.phone || '',
        telephone_fixe: (school as any).telephone_fixe || '',
        telephone_mobile: (school as any).telephone_mobile || '',
        email: school.email || '',
        email_institutionnel: (school as any).email_institutionnel || '',
        site_web: (school as any).site_web || '',
      });
      setLogoFile(null);
    } else {
      form.reset({
        name: '',
        code: '',
        status: 'active',
        type_etablissement: 'prive',
        has_preschool: false,
        has_primary: true,
        has_middle: false,
        has_high: false,
        annee_ouverture: '',
        description: '',
        logo_url: '',
        couleur_principale: '#1D3557',
        address: '',
        departement: '',
        city: '',
        commune: '',
        region: '',
        pays: 'Congo',
        code_postal: '',
        phone: '',
        telephone_fixe: '',
        telephone_mobile: '',
        email: '',
        email_institutionnel: '',
        site_web: '',
      });
      setLogoFile(null);
    }
  }, [school, form]);

  // Gestion du changement de fichier logo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const maxSize = 2 * 1024 * 1024; // 2 MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];

    if (file.size > maxSize) {
      toast.error('Le fichier est trop volumineux (max 2 MB)');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporté (PNG, JPG, SVG, WebP uniquement)');
      return;
    }

    setLogoFile(file);
  };

  // Upload du logo vers Supabase Storage
  const handleLogoUpload = async (): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      setUploadingLogo(true);
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('school-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erreur upload logo:', error);
      toast.error('Erreur lors de l\'upload du logo');
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSubmit = async (data: SchoolFormData) => {
    console.log('🚀 onSubmit appelé avec data:', data);
    console.log('🔑 schoolGroupId:', schoolGroupId);
    
    try {
      // Validation : Au moins un niveau doit être sélectionné
      if (!data.has_preschool && !data.has_primary && !data.has_middle && !data.has_high) {
        toast.error('Veuillez sélectionner au moins un niveau d\'enseignement');
        return;
      }
      
      // Vérifier l'unicité du code avant de continuer
      if (!isEditing) {
        const isCodeUnique = await validateSchoolCodeUniqueness(
          data.code, 
          schoolGroupId
        );
        
        if (!isCodeUnique) {
          // Générer un nouveau code unique
          console.log('⚠️ Code existant, génération d\'un nouveau code...');
          const uniqueCode = await generateUniqueSchoolCode(data.name, schoolGroupId);
          data.code = uniqueCode;
          form.setValue('code', uniqueCode);
          console.log('✅ Nouveau code généré:', uniqueCode);
        }
      }
      // Upload du logo si un nouveau fichier est sélectionné
      let logoUrl = data.logo_url;
      if (logoFile) {
        console.log('📤 Upload du logo...');
        const uploadedUrl = await handleLogoUpload();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
          console.log('✅ Logo uploadé:', uploadedUrl);
        }
      }

      const formData = {
        ...data,
        logo_url: logoUrl,
      };
      
      console.log('📝 FormData préparé:', formData);

      if (isEditing) {
        await updateSchool.mutateAsync({
          id: school.id,
          ...formData,
        });
        toast.success('École mise à jour avec succès');
      } else {
        // Préparer les données pour l'insertion
        const schoolData = {
          // Champs obligatoires
          name: formData.name,
          code: formData.code,
          status: formData.status,
          school_group_id: schoolGroupId,
          
          // Champs optionnels du formulaire
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          logo_url: logoUrl || null,
          couleur_principale: formData.couleur_principale || '#1D3557',
          departement: formData.departement || null,
          city: formData.city || null,
          commune: formData.commune || null,
          code_postal: formData.code_postal || null,
          type_etablissement: formData.type_etablissement || 'prive',
          annee_ouverture: formData.annee_ouverture ? parseInt(formData.annee_ouverture) : null,
          description: formData.description || null,
          telephone_fixe: formData.telephone_fixe || null,
          telephone_mobile: formData.telephone_mobile || null,
          email_institutionnel: formData.email_institutionnel || null,
          site_web: formData.site_web || null,
          
          // Champs avec valeurs par défaut
          pays: formData.pays || 'Congo',
          region: formData.region || null,
          
          // Niveaux d'enseignement (booléens)
          has_preschool: formData.has_preschool || false,
          has_primary: formData.has_primary || false,
          has_middle: formData.has_middle || false,
          has_high: formData.has_high || false,
          
          // Champs système
          admin_id: null, // À assigner lors de la création des utilisateurs
          student_count: 0,
          staff_count: 0,
          nombre_eleves_actuels: 0,
          nombre_enseignants: 0,
          nombre_classes: 0,
        };
        
        console.log('💾 Données à insérer:', schoolData);
        console.log('🔄 Appel de createSchool.mutateAsync...');
        
        await createSchool.mutateAsync(schoolData as any);
        
        console.log('✅ École créée avec succès !');
        toast.success('École créée avec succès');
      }
      
      onClose();
      form.reset();
      setLogoFile(null);
    } catch (error) {
      console.error('❌ ERREUR COMPLÈTE:', error);
      console.error('❌ Message:', (error as any)?.message);
      console.error('❌ Details:', (error as any)?.details);
      console.error('❌ Hint:', (error as any)?.hint);
      console.error('❌ Code:', (error as any)?.code);
      toast.error('Une erreur est survenue', {
        description: (error as any)?.message || 'Erreur inconnue'
      });
    }
  };

  const onSubmitError = (errors: Record<string, any>) => {
    // Extraire seulement les messages d'erreur pour éviter les références circulaires
    const errorMessages = Object.keys(errors).reduce((acc, key) => {
      acc[key] = {
        message: errors[key]?.message,
        type: errors[key]?.type
      };
      return acc;
    }, {} as Record<string, any>);
    
    console.error('⚠️ Erreurs de validation détaillées:', errorMessages);

    const firstKey = Object.keys(errors)[0];
    const firstMessage = firstKey
      ? errors[firstKey]?.message || errors[firstKey]?.type || 'Champ invalide'
      : 'Merci de vérifier les champs obligatoires (Général & Localisation).';

    toast.error('Formulaire incomplet', {
      description: firstMessage,
    });
  };

  const isLoading = createSchool.isPending || updateSchool.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier l\'école' : 'Nouvelle école'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifiez les informations de l\'école'
              : 'Créez une nouvelle école dans votre groupe scolaire'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit, onSubmitError)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="localisation">Localisation</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="apparence">Apparence</TabsTrigger>
            </TabsList>

            {/* ONGLET GÉNÉRAL */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Nom */}
                <div className="col-span-2">
                  <Label htmlFor="name">
                    Nom de l'école <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Ex: École Primaire Saint-Joseph"
                    onBlur={(e) => {
                      // Générer automatiquement le code quand l'utilisateur quitte le champ nom
                      if (e.target.value && !isEditing && !form.getValues('code')) {
                        handleGenerateCode(e.target.value);
                      }
                    }}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Code */}
                <div>
                  <Label htmlFor="code">
                    Code établissement <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      {...form.register('code')}
                      placeholder="Ex: EP-BZV-001"
                      className="flex-1"
                    />
                    {!isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const schoolName = form.getValues('name');
                          if (schoolName) {
                            handleGenerateCode(schoolName);
                          } else {
                            toast.error('Veuillez d\'abord saisir le nom de l\'école');
                          }
                        }}
                        disabled={generatingCode}
                        className="px-3"
                      >
                        {generatingCode ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Auto'
                        )}
                      </Button>
                    )}
                  </div>
                  {form.formState.errors.code && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.code.message}
                    </p>
                  )}
                </div>

                {/* Statut */}
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value as any, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspendue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type établissement */}
                <div>
                  <Label htmlFor="type_etablissement">Type d'établissement</Label>
                  <Select
                    value={form.watch('type_etablissement')}
                    onValueChange={(value) => form.setValue('type_etablissement', value as any, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prive">Privé</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Année d'ouverture */}
                <div>
                  <Label htmlFor="annee_ouverture">Année d'ouverture</Label>
                  <Input
                    id="annee_ouverture"
                    {...form.register('annee_ouverture')}
                    placeholder="Ex: 2010"
                    type="number"
                  />
                </div>

                {/* Niveaux d'enseignement */}
                <div className="col-span-2">
                  <Label className="mb-3 block">
                    Niveaux d'enseignement proposés <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {/* Maternelle */}
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="has_preschool"
                        checked={form.watch('has_preschool')}
                        onCheckedChange={(checked) => 
                          form.setValue('has_preschool', checked as boolean, { shouldValidate: true })
                        }
                      />
                      <Label 
                        htmlFor="has_preschool" 
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        🎓 Maternelle (Préscolaire)
                      </Label>
                    </div>

                    {/* Primaire */}
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="has_primary"
                        checked={form.watch('has_primary')}
                        onCheckedChange={(checked) => 
                          form.setValue('has_primary', checked as boolean, { shouldValidate: true })
                        }
                      />
                      <Label 
                        htmlFor="has_primary" 
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        📚 Primaire
                      </Label>
                    </div>

                    {/* Collège */}
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="has_middle"
                        checked={form.watch('has_middle')}
                        onCheckedChange={(checked) => 
                          form.setValue('has_middle', checked as boolean, { shouldValidate: true })
                        }
                      />
                      <Label 
                        htmlFor="has_middle" 
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        🏫 Collège
                      </Label>
                    </div>

                    {/* Lycée */}
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="has_high"
                        checked={form.watch('has_high')}
                        onCheckedChange={(checked) => 
                          form.setValue('has_high', checked as boolean, { shouldValidate: true })
                        }
                      />
                      <Label 
                        htmlFor="has_high" 
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        🎓 Lycée
                      </Label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Sélectionnez tous les niveaux proposés par votre établissement
                  </p>
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Description de l'école..."
                    className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ONGLET LOCALISATION */}
            <TabsContent value="localisation" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Adresse */}
                <div className="col-span-2">
                  <Label htmlFor="address">Adresse complète</Label>
                  <Input
                    id="address"
                    {...form.register('address')}
                    placeholder="Ex: 123 Avenue de la Paix"
                  />
                </div>

                {/* Département */}
                <div>
                  <Label htmlFor="departement">
                    Département <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.watch('departement')}
                    onValueChange={(value) => {
                      form.setValue('departement', value, { shouldValidate: true, shouldDirty: true });
                      form.setValue('city', '', { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un département" />
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

                {/* Ville */}
                <div>
                  <Label htmlFor="city">
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.watch('city')}
                    onValueChange={(value) => form.setValue('city', value, { shouldValidate: true, shouldDirty: true })}
                    disabled={!selectedDepartement}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une ville" />
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

                {/* Commune */}
                <div>
                  <Label htmlFor="commune">Commune</Label>
                  <Input
                    id="commune"
                    {...form.register('commune')}
                    placeholder="Ex: Poto-Poto"
                  />
                </div>

                {/* Code Postal */}
                <div>
                  <Label htmlFor="code_postal">Code postal (optionnel)</Label>
                  <Input
                    id="code_postal"
                    {...form.register('code_postal')}
                    placeholder="Ex: 00242"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ONGLET CONTACT */}
            <TabsContent value="contact" className="space-y-6 mt-4">
              {/* Section École */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Coordonnées de l'école</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Téléphone principal */}
                  <div>
                    <Label htmlFor="phone">Téléphone principal</Label>
                    <Input
                      id="phone"
                      {...form.register('phone')}
                      placeholder="Ex: +242 06 123 4567"
                    />
                  </div>

                  {/* Téléphone fixe */}
                  <div>
                    <Label htmlFor="telephone_fixe">Téléphone fixe</Label>
                    <Input
                      id="telephone_fixe"
                      {...form.register('telephone_fixe')}
                      placeholder="Ex: +242 22 123 4567"
                    />
                  </div>

                  {/* Téléphone mobile */}
                  <div>
                    <Label htmlFor="telephone_mobile">Téléphone mobile</Label>
                    <Input
                      id="telephone_mobile"
                      {...form.register('telephone_mobile')}
                      placeholder="Ex: +242 06 987 6543"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                      placeholder="Ex: contact@ecole.cg"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Email institutionnel */}
                  <div>
                    <Label htmlFor="email_institutionnel">Email institutionnel</Label>
                    <Input
                      id="email_institutionnel"
                      type="email"
                      {...form.register('email_institutionnel')}
                      placeholder="Ex: admin@ecole.cg"
                    />
                  </div>

                  {/* Site web */}
                  <div>
                    <Label htmlFor="site_web">Site web</Label>
                    <Input
                      id="site_web"
                      type="url"
                      {...form.register('site_web')}
                      placeholder="Ex: https://ecole.cg"
                    />
                  </div>
                </div>
              </div>

              {/* Info Directeur */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">Assignation du Directeur</h4>
                    <p className="text-sm text-blue-700">
                      Le directeur sera assigné après la création de l'école, lors de la création de son compte utilisateur dans la section <strong>Gestion des Utilisateurs</strong>.
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      💡 Ses informations (nom, téléphone, email) seront automatiquement synchronisées avec l'école.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ONGLET APPARENCE */}
            <TabsContent value="apparence" className="space-y-4 mt-4">
              {/* Upload Logo */}
              <div className="space-y-2">
                <Label>Logo de l'école</Label>
                <div className="flex items-start gap-4">
                  {/* Aperçu */}
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <div className="relative w-32 h-32 rounded-lg border-2 border-gray-200 overflow-hidden">
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            form.setValue('logo_url', '');
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Upload */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={uploadingLogo}
                      className="w-full"
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choisir un logo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, SVG ou WebP (max 2 MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Couleur Principale */}
              <div>
                <Label htmlFor="couleur_principale">Couleur principale</Label>
                <div className="flex gap-2">
                  <Input
                    id="couleur_principale"
                    type="color"
                    {...form.register('couleur_principale')}
                    className="w-20 h-10"
                  />
                  <Input
                    value={form.watch('couleur_principale')}
                    onChange={(e) => form.setValue('couleur_principale', e.target.value)}
                    placeholder="#1D3557"
                    className="flex-1"
                  />
                </div>
                {form.formState.errors.couleur_principale && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.couleur_principale.message}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading || uploadingLogo}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || uploadingLogo}
              className="bg-[#1D3557] hover:bg-[#2A9D8F]"
            >
              {(isLoading || uploadingLogo) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Mettre à jour' : 'Créer l\'école'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
