/**
 * Dialog de création/modification d'école - VERSION COMPLÈTE
 * Formulaire en paysage avec tous les champs de la table schools
 * Inclut : Logo, Couleur, Localisation complète, Directeur, etc.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, School, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  useCreateSchool, 
  useUpdateSchool,
  type School as SchoolType 
} from '../../hooks/useSchools-simple';

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

// ============================================================================
// SCHÉMA DE VALIDATION COMPLET
// ============================================================================

const schoolSchema = z.object({
  // Informations de base
  name: z.string().min(3, 'Nom requis (min 3 caractères)'),
  code: z.string().min(2, 'Code requis (min 2 caractères)'),
  type_etablissement: z.enum(['public', 'prive', 'confessionnel', 'autre']).default('prive'),
  status: z.enum(['active', 'inactive', 'suspended', 'archived']).default('active'),
  
  // Apparence
  logo_url: z.string().url('URL invalide').optional().or(z.literal('')),
  couleur_principale: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format couleur invalide (#RRGGBB)').optional().or(z.literal('')),
  
  // Localisation
  address: z.string().optional(),
  departement: z.string().min(1, 'Département requis'),
  city: z.string().min(1, 'Ville requise'),
  commune: z.string().optional(),
  code_postal: z.string().optional(),
  
  // Contacts
  telephone_fixe: z.string().optional(),
  telephone_mobile: z.string().optional(),
  email_institutionnel: z.string().email('Email invalide').optional().or(z.literal('')),
  site_web: z.string().url('URL invalide').optional().or(z.literal('')),
  
  // Données administratives
  nombre_eleves_actuels: z.number().int().min(0).default(0),
  nombre_enseignants: z.number().int().min(0).default(0),
  nombre_classes: z.number().int().min(0).default(0),
  annee_ouverture: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  
  // Autres
  description: z.string().optional(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

// ============================================================================
// PROPS
// ============================================================================

interface SchoolFormDialogProps {
  isOpen: boolean;
  school?: SchoolType | null;
  onClose: () => void;
  schoolGroupId: string;
}

// ============================================================================
// COULEURS PRÉDÉFINIES
// ============================================================================

const COULEURS_PREDEFINIES = [
  { nom: 'Bleu E-Pilot', hex: '#1D3557' },
  { nom: 'Vert E-Pilot', hex: '#2A9D8F' },
  { nom: 'Or E-Pilot', hex: '#E9C46A' },
  { nom: 'Rouge', hex: '#E63946' },
  { nom: 'Bleu Ciel', hex: '#3B82F6' },
  { nom: 'Vert Forêt', hex: '#10B981' },
  { nom: 'Violet', hex: '#8B5CF6' },
  { nom: 'Orange', hex: '#F59E0B' },
  { nom: 'Rose', hex: '#EC4899' },
  { nom: 'Indigo', hex: '#6366F1' },
];

// ============================================================================
// COMPOSANT
// ============================================================================

export function SchoolFormDialogComplete({ 
  isOpen, 
  school, 
  onClose,
  schoolGroupId 
}: SchoolFormDialogProps) {
  const isEditing = !!school;
  const createSchool = useCreateSchool();
  const updateSchool = useUpdateSchool();
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedDepartement, setSelectedDepartement] = useState<string>('');

  const form = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      code: '',
      type_etablissement: 'prive',
      status: 'active',
      logo_url: '',
      couleur_principale: '#1D3557',
      address: '',
      departement: '',
      city: '',
      commune: '',
      code_postal: '',
      telephone_fixe: '',
      telephone_mobile: '',
      email_institutionnel: '',
      site_web: '',
      nombre_eleves_actuels: 0,
      nombre_enseignants: 0,
      nombre_classes: 0,
      annee_ouverture: new Date().getFullYear(),
      description: '',
    },
  });

  // Remplir le formulaire en mode édition
  useEffect(() => {
    if (school) {
      form.reset({
        name: school.name,
        code: school.code,
        type_etablissement: (school as any).type_etablissement || 'prive',
        status: school.status,
        logo_url: (school as any).logo_url || '',
        couleur_principale: (school as any).couleur_principale || '#1D3557',
        address: school.address || '',
        city: (school as any).city || '',
        commune: (school as any).commune || '',
        departement: (school as any).departement || '',
        code_postal: (school as any).code_postal || '',
        directeur_nom_complet: (school as any).directeur_nom_complet || '',
        directeur_telephone: (school as any).directeur_telephone || '',
        directeur_email: (school as any).directeur_email || '',
        directeur_fonction: (school as any).directeur_fonction || 'Directeur',
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

  // Mettre à jour l'aperçu du logo
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'logo_url' && value.logo_url) {
        setLogoPreview(value.logo_url);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: SchoolFormData) => {
    try {
      if (isEditing) {
        await updateSchool.mutateAsync({
          id: school.id,
          ...data,
          phone: data.telephone_mobile,
          email: data.email_institutionnel,
          student_count: data.nombre_eleves_actuels,
        } as any);
      } else {
        await createSchool.mutateAsync({
          ...data,
          school_group_id: schoolGroupId,
          admin_id: '',
          phone: data.telephone_mobile,
          email: data.email_institutionnel,
          student_count: data.nombre_eleves_actuels,
          staff_count: data.nombre_enseignants,
        } as any);
      }
      
      onClose();
      form.reset();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const isLoading = createSchool.isPending || updateSchool.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="w-5 h-5 text-[#2A9D8F]" />
            {isEditing ? 'Modifier l\'école' : 'Nouvelle école'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifiez les informations de l\'école'
              : 'Créez une nouvelle école dans votre groupe scolaire'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="apparence">Apparence</TabsTrigger>
              <TabsTrigger value="localisation">Localisation</TabsTrigger>
              <TabsTrigger value="directeur">Directeur</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* ONGLET 1 : GÉNÉRAL */}
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
                  <Input
                    id="code"
                    {...form.register('code')}
                    placeholder="Ex: EP-BZV-001"
                  />
                  {form.formState.errors.code && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.code.message}
                    </p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <Label htmlFor="type_etablissement">Type d'établissement</Label>
                  <Select
                    value={form.watch('type_etablissement')}
                    onValueChange={(value) => form.setValue('type_etablissement', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prive">Privé</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="confessionnel">Confessionnel</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Statut */}
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspendue</SelectItem>
                      <SelectItem value="archived">Archivée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Année ouverture */}
                <div>
                  <Label htmlFor="annee_ouverture">Année d'ouverture</Label>
                  <Input
                    id="annee_ouverture"
                    type="number"
                    {...form.register('annee_ouverture', { valueAsNumber: true })}
                    placeholder="2024"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Présentation de l'école..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ONGLET 2 : APPARENCE */}
            <TabsContent value="apparence" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Logo */}
                <div className="space-y-3">
                  <Label htmlFor="logo_url">Logo de l'école</Label>
                  <Input
                    id="logo_url"
                    {...form.register('logo_url')}
                    placeholder="https://exemple.com/logo.png"
                  />
                  {form.formState.errors.logo_url && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.logo_url.message}
                    </p>
                  )}
                  
                  {/* Aperçu du logo */}
                  {logoPreview && (
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed">
                      <img 
                        src={logoPreview} 
                        alt="Aperçu logo" 
                        className="max-w-[200px] max-h-[200px] object-contain"
                        onError={() => setLogoPreview('')}
                      />
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    💡 Formats acceptés : PNG, JPG, SVG (max 2 MB)
                  </p>
                </div>

                {/* Couleur */}
                <div className="space-y-3">
                  <Label htmlFor="couleur_principale">Couleur principale</Label>
                  
                  {/* Sélecteur de couleur */}
                  <div className="flex gap-2">
                    <Input
                      id="couleur_principale"
                      {...form.register('couleur_principale')}
                      placeholder="#1D3557"
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={form.watch('couleur_principale') || '#1D3557'}
                      onChange={(e) => form.setValue('couleur_principale', e.target.value)}
                      className="w-16 h-10 rounded border cursor-pointer"
                    />
                  </div>
                  
                  {form.formState.errors.couleur_principale && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.couleur_principale.message}
                    </p>
                  )}

                  {/* Couleurs prédéfinies */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Couleurs prédéfinies</p>
                    <div className="grid grid-cols-5 gap-2">
                      {COULEURS_PREDEFINIES.map((couleur) => (
                        <button
                          key={couleur.hex}
                          type="button"
                          onClick={() => form.setValue('couleur_principale', couleur.hex)}
                          className="group relative"
                          title={couleur.nom}
                        >
                          <div
                            className="w-full h-12 rounded-lg border-2 hover:border-gray-400 transition-all cursor-pointer"
                            style={{ 
                              backgroundColor: couleur.hex,
                              borderColor: form.watch('couleur_principale') === couleur.hex ? '#2A9D8F' : '#e5e7eb'
                            }}
                          />
                          <p className="text-xs text-center mt-1 text-gray-600 group-hover:text-gray-900">
                            {couleur.nom}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aperçu de la couleur */}
                  <div className="p-4 rounded-lg border-2" style={{ backgroundColor: form.watch('couleur_principale') + '20', borderColor: form.watch('couleur_principale') }}>
                    <p className="text-sm font-medium" style={{ color: form.watch('couleur_principale') }}>
                      Aperçu de la couleur sélectionnée
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Cette couleur sera utilisée pour différencier l'école dans l'interface
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ONGLET 3 : LOCALISATION */}
            <TabsContent value="localisation" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Adresse */}
                <div className="col-span-2">
                  <Label htmlFor="address">Adresse complète</Label>
                  <Input
                    id="address"
                    {...form.register('address')}
                    placeholder="123 Avenue de la Paix"
                  />
                </div>

                {/* Ville */}
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    {...form.register('city')}
                    placeholder="Brazzaville"
                  />
                </div>

                {/* Commune */}
                <div>
                  <Label htmlFor="commune">Commune/Arrondissement</Label>
                  <Input
                    id="commune"
                    {...form.register('commune')}
                    placeholder="Bacongo"
                  />
                </div>

                {/* Département */}
                <div>
                  <Label htmlFor="departement">Département/Région</Label>
                  <Input
                    id="departement"
                    {...form.register('departement')}
                    placeholder="Brazzaville"
                  />
                </div>

                {/* Code postal */}
                <div>
                  <Label htmlFor="code_postal">Code postal</Label>
                  <Input
                    id="code_postal"
                    {...form.register('code_postal')}
                    placeholder="00242"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ONGLET 4 : DIRECTEUR */}
            <TabsContent value="directeur" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Nom complet */}
                <div className="col-span-2">
                  <Label htmlFor="directeur_nom_complet">Nom complet du directeur</Label>
                  <Input
                    id="directeur_nom_complet"
                    {...form.register('directeur_nom_complet')}
                    placeholder="Jean Dupont"
                  />
                </div>

                {/* Fonction */}
                <div>
                  <Label htmlFor="directeur_fonction">Fonction</Label>
                  <Select
                    value={form.watch('directeur_fonction')}
                    onValueChange={(value) => form.setValue('directeur_fonction', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Directeur">Directeur</SelectItem>
                      <SelectItem value="Proviseur">Proviseur</SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                      <SelectItem value="Responsable">Responsable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Téléphone */}
                <div>
                  <Label htmlFor="directeur_telephone">Téléphone</Label>
                  <Input
                    id="directeur_telephone"
                    {...form.register('directeur_telephone')}
                    placeholder="+242 06 123 4567"
                  />
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <Label htmlFor="directeur_email">Email</Label>
                  <Input
                    id="directeur_email"
                    type="email"
                    {...form.register('directeur_email')}
                    placeholder="directeur@ecole.cg"
                  />
                  {form.formState.errors.directeur_email && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.directeur_email.message}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ONGLET 5 : CONTACT */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Téléphone fixe */}
                <div>
                  <Label htmlFor="telephone_fixe">Téléphone fixe</Label>
                  <Input
                    id="telephone_fixe"
                    {...form.register('telephone_fixe')}
                    placeholder="+242 22 123 4567"
                  />
                </div>

                {/* Téléphone mobile */}
                <div>
                  <Label htmlFor="telephone_mobile">Téléphone mobile</Label>
                  <Input
                    id="telephone_mobile"
                    {...form.register('telephone_mobile')}
                    placeholder="+242 06 123 4567"
                  />
                </div>

                {/* Email institutionnel */}
                <div>
                  <Label htmlFor="email_institutionnel">Email institutionnel</Label>
                  <Input
                    id="email_institutionnel"
                    type="email"
                    {...form.register('email_institutionnel')}
                    placeholder="contact@ecole.cg"
                  />
                  {form.formState.errors.email_institutionnel && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.email_institutionnel.message}
                    </p>
                  )}
                </div>

                {/* Site web */}
                <div>
                  <Label htmlFor="site_web">Site web</Label>
                  <Input
                    id="site_web"
                    {...form.register('site_web')}
                    placeholder="https://www.ecole.cg"
                  />
                  {form.formState.errors.site_web && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.site_web.message}
                    </p>
                  )}
                </div>

                {/* Statistiques */}
                <div className="col-span-2 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900 mb-3">Statistiques</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nombre_eleves_actuels">Nombre d'élèves</Label>
                      <Input
                        id="nombre_eleves_actuels"
                        type="number"
                        {...form.register('nombre_eleves_actuels', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="nombre_enseignants">Nombre d'enseignants</Label>
                      <Input
                        id="nombre_enseignants"
                        type="number"
                        {...form.register('nombre_enseignants', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="nombre_classes">Nombre de classes</Label>
                      <Input
                        id="nombre_classes"
                        type="number"
                        {...form.register('nombre_classes', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-[#2A9D8F] to-[#1D8A7E] hover:from-[#1D8A7E] hover:to-[#2A9D8F]"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Mettre à jour' : 'Créer l\'école'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
