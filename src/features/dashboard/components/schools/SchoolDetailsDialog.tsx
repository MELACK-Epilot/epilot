/**
 * Dialog Détails École - VERSION PROFESSIONNELLE
 * Affichage complet avec utilisateurs assignés et impression PDF
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/features/dashboard/components/UserAvatar';
import { 
  School, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  Users,
  GraduationCap,
  Building2,
  Printer,
  UserCheck,
  Shield,
  Download,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EPILOT_COLORS } from '@/styles/palette';

interface SchoolDetailsDialogProps {
  school: any;
  isOpen: boolean;
  onClose: () => void;
}

export const SchoolDetailsDialog = ({ school, isOpen, onClose }: SchoolDetailsDialogProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [director, setDirector] = useState<any>(null);

  // Charger les utilisateurs de l'école
  useEffect(() => {
    if (school?.id && isOpen) {
      loadSchoolUsers();
    }
  }, [school?.id, isOpen]);

  const loadSchoolUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', school.id)
        .order('role', { ascending: true });

      if (error) throw error;

      setUsers(data || []);
      
      // Trouver le directeur/proviseur
      const dir = (data || []).find((u: any) => ['directeur', 'proviseur'].includes(u.role));
      setDirector(dir || null);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fonction d'impression PDF
  const handlePrint = () => {
    window.print();
    toast.success('Impression lancée');
  };

  // Fonction d'export PDF
  const handleExportPDF = () => {
    toast.info('Export PDF en cours de développement');
  };

  if (!school) return null;

  // Helper pour les niveaux scolaires
  const getEducationLevels = () => {
    const levels = [];
    if (school.has_preschool) levels.push({ label: 'Maternelle', color: 'text-pink-700 bg-pink-50 border-pink-200' });
    if (school.has_primary) levels.push({ label: 'Primaire', color: 'text-blue-700 bg-blue-50 border-blue-200' });
    if (school.has_middle) levels.push({ label: 'Collège', color: 'text-green-700 bg-green-50 border-green-200' });
    if (school.has_high) levels.push({ label: 'Lycée', color: 'text-purple-700 bg-purple-50 border-purple-200' });
    return levels;
  };

  const educationLevels = getEducationLevels();

  const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="p-1.5 bg-gray-50 rounded-lg">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value || 'Non spécifié'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header Moderne avec Background */}
        <div className="relative bg-gradient-to-r from-[#1D3557] to-[#2A9D8F] p-6 pb-8 text-white">
          <div className="flex items-start justify-between gap-6 relative z-10">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="w-24 h-24 rounded-xl bg-white p-1 shadow-xl -mb-12 transform translate-y-2 flex-shrink-0">
                {school.logo_url ? (
                  <img 
                    src={school.logo_url} 
                    alt={school.name} 
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-gray-50 flex items-center justify-center">
                    <School className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Info Principale */}
              <div className="pt-1">
                <DialogTitle className="text-3xl font-bold text-white leading-tight">{school.name}</DialogTitle>
                <DialogDescription className="sr-only">Détails complets de l'établissement {school.name}</DialogDescription>
                <div className="flex items-center gap-3 mt-2 text-blue-100">
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-sm backdrop-blur-sm border border-white/10">
                    {school.code}
                  </span>
                  {school.annee_ouverture && (
                    <span className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-4 h-4 opacity-70" />
                      Depuis {school.annee_ouverture}
                    </span>
                  )}
                </div>
                
                {/* Badges Niveaux */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {educationLevels.map((level) => (
                    <Badge 
                      key={level.label} 
                      variant="secondary" 
                      className="bg-white/20 text-white hover:bg-white/30 border-transparent backdrop-blur-sm"
                    >
                      {level.label}
                    </Badge>
                  ))}
                  {educationLevels.length === 0 && (
                    <Badge variant="outline" className="text-white/70 border-white/30">
                      Aucun niveau spécifié
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mr-12">
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white/10 text-white hover:bg-white/20 border-0 backdrop-blur-sm"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white text-[#1D3557] hover:bg-blue-50 border-0"
                onClick={handleExportPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Badges Status/Type intégrés dans le flux pour éviter les conflits */}
          <div className="absolute bottom-6 right-6 flex gap-2">
            <Badge className={
              school.status === 'active' 
                ? 'bg-green-500/20 text-green-100 border-green-500/30 backdrop-blur-sm' 
                : 'bg-red-500/20 text-red-100 border-red-500/30 backdrop-blur-sm'
            }>
              {school.status === 'active' ? '✅ Active' : '⏸️ Inactive'}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-100 border-blue-500/30 backdrop-blur-sm">
              {school.type_etablissement === 'prive' ? '🏫 Privé' : '🏛️ Public'}
            </Badge>
          </div>
        </div>

        {/* Contenu Principal */}
        <div className="pt-12 px-6 pb-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] data-[state=active]:text-[#2A9D8F] data-[state=active]:shadow-none rounded-none px-6 py-3"
              >
                📋 Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger 
                value="contact" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] data-[state=active]:text-[#2A9D8F] data-[state=active]:shadow-none rounded-none px-6 py-3"
              >
                📞 Contact & Localisation
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] data-[state=active]:text-[#2A9D8F] data-[state=active]:shadow-none rounded-none px-6 py-3"
              >
                👥 Personnel <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">{users.length}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#2A9D8F] data-[state=active]:text-[#2A9D8F] data-[state=active]:shadow-none rounded-none px-6 py-3"
              >
                📊 Statistiques
              </TabsTrigger>
            </TabsList>

            {/* TAB: GÉNÉRAL */}
            <TabsContent value="general" className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne Gauche: Info Clés */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="w-5 h-5 text-[#2A9D8F]" />
                        Identité de l'établissement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoRow icon={School} label="Nom officiel" value={school.name} />
                      <InfoRow icon={Shield} label="Code Établissement" value={school.code} />
                      <InfoRow icon={Calendar} label="Date d'ouverture" value={school.annee_ouverture} />
                      <InfoRow icon={Building2} label="Type" value={school.type_etablissement === 'prive' ? 'Établissement Privé' : 'Établissement Public'} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Info className="w-5 h-5 text-[#2A9D8F]" />
                        Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        {school.description || "Aucune description n'a été fournie pour cet établissement."}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Colonne Droite: Identité Visuelle & Rapide */}
                <div className="space-y-6">
                  {school.couleur_principale && (
                    <Card className="overflow-hidden">
                      <div className="h-20" style={{ backgroundColor: school.couleur_principale }} />
                      <CardContent className="pt-4">
                        <h3 className="font-semibold mb-1">Identité Visuelle</h3>
                        <p className="text-sm text-gray-500 mb-4">Couleur officielle utilisée pour les documents</p>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                          <div 
                            className="w-10 h-10 rounded-lg shadow-sm border"
                            style={{ backgroundColor: school.couleur_principale }}
                          />
                          <div>
                            <p className="font-mono font-bold text-gray-900">{school.couleur_principale}</p>
                            <p className="text-xs text-gray-500">Code HEX</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Niveaux d'enseignement</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      {educationLevels.map((level) => (
                        <div key={level.label} className={`flex items-center gap-3 p-3 rounded-lg border ${level.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-10 ')}`}>
                          <GraduationCap className={`w-5 h-5`} />
                          <span className="font-medium">{level.label}</span>
                        </div>
                      ))}
                      {educationLevels.length === 0 && (
                        <p className="text-sm text-gray-500 italic">Aucun niveau configuré</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB: CONTACT & LOCALISATION */}
            <TabsContent value="contact" className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Directeur */}
                <div className="lg:col-span-1">
                  {director ? (
                    <Card className="border-l-4 border-l-[#2A9D8F] h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">Direction</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center text-center pt-2">
                        <UserAvatar
                          firstName={director.first_name}
                          lastName={director.last_name}
                          avatar={director.avatar}
                          size="xl"
                          status="active"
                          className="w-24 h-24 mb-4 text-2xl"
                        />
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {director.first_name} {director.last_name}
                        </h3>
                        <Badge variant="secondary" className="mb-4 capitalize px-3 py-1">
                          {director.role}
                        </Badge>
                        
                        <div className="w-full space-y-3 mt-2">
                          {director.phone && (
                            <a href={`tel:${director.phone}`} className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#2A9D8F] p-2 hover:bg-gray-50 rounded transition-colors">
                              <Phone className="w-4 h-4" /> {director.phone}
                            </a>
                          )}
                          {director.email && (
                            <a href={`mailto:${director.email}`} className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#2A9D8F] p-2 hover:bg-gray-50 rounded transition-colors">
                              <Mail className="w-4 h-4" /> {director.email}
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="h-full flex items-center justify-center p-6 bg-gray-50 border-dashed">
                      <div className="text-center text-gray-500">
                        <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Aucun directeur assigné</p>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Coordonnées & Localisation */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Phone className="w-5 h-5 text-[#2A9D8F]" />
                        Coordonnées
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoRow icon={Phone} label="Téléphone Principal" value={school.phone} />
                      <InfoRow icon={Phone} label="Téléphone Secondaire" value={school.telephone_fixe || school.telephone_mobile} />
                      <InfoRow icon={Mail} label="Email Contact" value={school.email} />
                      <InfoRow icon={Mail} label="Email Institutionnel" value={school.email_institutionnel} />
                      <div className="md:col-span-2">
                        <InfoRow icon={Globe} label="Site Web" value={school.site_web} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="w-5 h-5 text-[#2A9D8F]" />
                        Localisation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoRow icon={MapPin} label="Adresse Postale" value={school.address} />
                      <InfoRow icon={MapPin} label="Code Postal" value={school.code_postal} />
                      <InfoRow icon={MapPin} label="Ville" value={school.city} />
                      <InfoRow icon={MapPin} label="Commune/Arrondissement" value={school.commune} />
                      <InfoRow icon={MapPin} label="Département" value={school.departement} />
                      <InfoRow icon={MapPin} label="Région" value={school.region} />
                      <InfoRow icon={MapPin} label="Pays" value={school.pays} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB: PERSONNEL */}
            <TabsContent value="users" className="space-y-6 animate-in fade-in-50 duration-300">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#2A9D8F]" />
                    Équipe éducative et administrative
                  </CardTitle>
                  <Badge variant="secondary">{users.length} membres</Badge>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="animate-spin w-8 h-8 border-4 border-[#2A9D8F] border-t-transparent rounded-full mx-auto mb-3"></div>
                      <p>Chargement du personnel...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 font-medium">Aucun personnel assigné à cet établissement</p>
                      <p className="text-sm text-gray-400 mt-1">Ajoutez des utilisateurs depuis la section "Utilisateurs"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-4 p-4 bg-white border rounded-xl hover:shadow-md transition-shadow duration-200 group"
                        >
                          <UserAvatar
                            firstName={user.first_name}
                            lastName={user.last_name}
                            avatar={user.avatar}
                            size="lg"
                            status={user.status}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate group-hover:text-[#2A9D8F] transition-colors">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            {user.phone && <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>}
                          </div>
                          <Badge variant="outline" className="capitalize shrink-0">
                            {user.role === 'directeur' && '👔 Directeur'}
                            {user.role === 'proviseur' && '🎓 Proviseur'}
                            {user.role === 'enseignant' && '👨‍🏫 Enseignant'}
                            {user.role === 'cpe' && '🎯 CPE'}
                            {user.role === 'comptable' && '💰 Comptable'}
                            {user.role === 'surveillant' && '👮 Surveillant'}
                            {!['directeur', 'proviseur', 'enseignant', 'cpe', 'comptable', 'surveillant'].includes(user.role) && user.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: STATISTIQUES */}
            <TabsContent value="stats" className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-purple-900">Élèves inscrits</p>
                      <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-purple-700">
                      {school.nombre_eleves_actuels || school.student_count || 0}
                    </p>
                    <p className="text-xs text-purple-500 mt-1">
                      Sur {school.max_eleves_autorises || 0} places
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-blue-900">Enseignants</p>
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">
                      {school.nombre_enseignants || 0}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      Actifs cette année
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-orange-900">Personnel Admin</p>
                      <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-orange-700">
                      {school.staff_count || 0}
                    </p>
                    <p className="text-xs text-orange-500 mt-1">
                      Administratifs & technique
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-green-900">Classes</p>
                      <div className="p-2 bg-green-100 rounded-lg text-green-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-green-700">
                      {school.nombre_classes || 0}
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      Salles de classe
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* TODO: Ajouter plus de graphiques ici dans le futur */}
              <Card className="border-dashed bg-gray-50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Globe className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900">Statistiques avancées à venir</h3>
                  <p className="text-sm text-gray-500 max-w-md mt-2">
                    Bientôt, vous pourrez consulter ici l'évolution des inscriptions, la répartition par niveau et par genre, ainsi que les taux de réussite.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
