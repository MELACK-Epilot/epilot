/**
 * Dialog Détails École - VERSION PROFESSIONNELLE
 * Affichage complet avec utilisateurs assignés et impression PDF
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

  const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-5 h-5 text-[#2A9D8F] mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || 'Non spécifié'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {school.logo_url ? (
                <img 
                  src={school.logo_url} 
                  alt={school.name} 
                  className="w-20 h-20 rounded-xl object-cover border-2 shadow-lg" 
                  style={{ borderColor: school.couleur_principale || '#2A9D8F' }}
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg"
                  style={{
                    background: school.couleur_principale 
                      ? `linear-gradient(135deg, ${school.couleur_principale}, ${school.couleur_principale}dd)`
                      : 'linear-gradient(135deg, #1D3557, #2A9D8F)'
                  }}
                >
                  <School className="w-10 h-10 text-white" />
                </div>
              )}
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-gray-900">{school.name}</DialogTitle>
                <p className="text-sm text-gray-500 font-mono mt-1 bg-gray-100 px-2 py-1 rounded inline-block">{school.code}</p>
                <div className="flex gap-2 mt-3">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                    {school.type_etablissement === 'prive' ? '🏫 Privé' : '🏛️ Public'}
                  </Badge>
                  <Badge className={school.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {school.status === 'active' ? '✅ Active' : '⏸️ Inactive'}
                  </Badge>
                  {school.annee_ouverture && (
                    <Badge variant="outline">📅 Depuis {school.annee_ouverture}</Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">📋 Général</TabsTrigger>
            <TabsTrigger value="contact">📞 Contact</TabsTrigger>
            <TabsTrigger value="users">👥 Personnel ({users.length})</TabsTrigger>
            <TabsTrigger value="stats">📊 Statistiques</TabsTrigger>
          </TabsList>

          {/* Onglet Général */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#2A9D8F]" />
                  Informations Générales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={School} label="Nom" value={school.name} />
                  <InfoRow icon={School} label="Code" value={school.code} />
                  <InfoRow icon={Calendar} label="Année d'ouverture" value={school.annee_ouverture} />
                  <InfoRow icon={MapPin} label="Type" value={school.type_etablissement === 'prive' ? 'Privé' : 'Public'} />
                  <InfoRow icon={MapPin} label="Région" value={school.region} />
                  <InfoRow icon={MapPin} label="Département" value={school.departement} />
                  <InfoRow icon={MapPin} label="Ville" value={school.city} />
                  <InfoRow icon={MapPin} label="Commune" value={school.commune} />
                  <InfoRow icon={MapPin} label="Adresse" value={school.address} />
                  <InfoRow icon={MapPin} label="Code postal" value={school.code_postal} />
                  <InfoRow icon={MapPin} label="Pays" value={school.pays} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Description</h3>
                <p className="text-sm text-gray-600">
                  {school.description || 'Aucune description disponible'}
                </p>
              </CardContent>
            </Card>

            {/* Couleur de l'école */}
            {school.couleur_principale && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Identité visuelle</h3>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-20 h-20 rounded-lg shadow-lg border-2 border-gray-200"
                      style={{ backgroundColor: school.couleur_principale }}
                    />
                    <div>
                      <p className="text-sm text-gray-600">Couleur principale</p>
                      <p className="text-lg font-mono font-bold" style={{ color: school.couleur_principale }}>
                        {school.couleur_principale}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Utilisée dans les cartes et documents officiels
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Contact */}
          <TabsContent value="contact" className="space-y-4">
            {/* Directeur/Proviseur */}
            {director && (
              <Card className="border-2 border-[#2A9D8F] bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-[#1D3557]">
                    <Shield className="w-5 h-5 text-[#2A9D8F]" />
                    Directeur de l'établissement
                  </h3>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                    <UserAvatar
                      firstName={director.first_name}
                      lastName={director.last_name}
                      avatar={director.avatar}
                      size="xl"
                      status="active"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-900">
                        {director.first_name} {director.last_name}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">{director.role}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        {director.phone && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3 h-3" /> {director.phone}
                          </span>
                        )}
                        {director.email && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" /> {director.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-[#2A9D8F] text-white">✓ Assigné</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#2A9D8F]" />
                  Coordonnées de l'école
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={Phone} label="Téléphone principal" value={school.phone} />
                  <InfoRow icon={Phone} label="Téléphone fixe" value={school.telephone_fixe} />
                  <InfoRow icon={Phone} label="Téléphone mobile" value={school.telephone_mobile} />
                  <InfoRow icon={Mail} label="Email" value={school.email} />
                  <InfoRow icon={Mail} label="Email institutionnel" value={school.email_institutionnel} />
                  <InfoRow icon={Globe} label="Site web" value={school.site_web} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Personnel */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#2A9D8F]" />
                  Personnel de l'école ({users.length})
                </h3>
                {loadingUsers ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin w-8 h-8 border-4 border-[#2A9D8F] border-t-transparent rounded-full mx-auto mb-2"></div>
                    Chargement...
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucun utilisateur assigné à cette école</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <UserAvatar
                          firstName={user.first_name}
                          lastName={user.last_name}
                          avatar={user.avatar}
                          size="lg"
                          status={user.status}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="capitalize">
                            {user.role === 'directeur' && '👔 Directeur'}
                            {user.role === 'proviseur' && '🎓 Proviseur'}
                            {user.role === 'enseignant' && '👨‍🏫 Enseignant'}
                            {user.role === 'cpe' && '🎯 CPE'}
                            {user.role === 'comptable' && '💰 Comptable'}
                            {user.role === 'surveillant' && '👮 Surveillant'}
                            {!['directeur', 'proviseur', 'enseignant', 'cpe', 'comptable', 'surveillant'].includes(user.role) && user.role}
                          </Badge>
                          {user.phone && (
                            <p className="text-xs text-gray-500 mt-1">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Statistiques */}
          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#2A9D8F]" />
                  Effectifs
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Élèves actuels</p>
                    <p className="text-2xl font-bold text-purple-600">{school.nombre_eleves_actuels || school.student_count || 0}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Capacité max</p>
                    <p className="text-2xl font-bold text-blue-600">{school.max_eleves_autorises || 0}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Enseignants</p>
                    <p className="text-2xl font-bold text-orange-600">{school.nombre_enseignants || 0}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Personnel</p>
                    <p className="text-2xl font-bold text-green-600">{school.staff_count || 0}</p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <p className="text-sm text-gray-600">Classes</p>
                    <p className="text-2xl font-bold text-pink-600">{school.nombre_classes || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
