import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  Shield, 
  Clock, 
  MapPin, 
  Smartphone, 
  Monitor, 
  Printer, 
  Download,
  Briefcase,
  GraduationCap,
  FileText
} from 'lucide-react';
import { User } from '../../types/dashboard.types';
import { UserAvatar } from '../UserAvatar';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getStatusBadgeClass, getRoleBadgeClass } from '@/lib/colors';
import { useLoginHistory } from '../../hooks/useUserProfile';
import type { LoginHistoryEntry } from '../../hooks/useUserProfile';
import { useRef } from 'react';

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetailsDialog = ({ user, open, onOpenChange }: UserDetailsDialogProps) => {
  const { data: loginHistoryData } = useLoginHistory(user?.id, 10);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-user-profile');
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow && printContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Fiche Utilisateur - ${user.firstName} ${user.lastName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
              .header { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
              .avatar { width: 100px; height: 100px; border-radius: 50%; background-color: #eee; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #555; }
              .info h1 { margin: 0 0 10px 0; font-size: 24px; color: #1D3557; }
              .badges { display: flex; gap: 10px; margin-bottom: 10px; }
              .badge { padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
              .badge-role { background-color: #e0f2fe; color: #0369a1; }
              .badge-status { background-color: #dcfce7; color: #15803d; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; color: #457b9d; display: flex; align-items: center; gap: 10px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .field { margin-bottom: 15px; }
              .label { font-size: 12px; color: #666; margin-bottom: 4px; }
              .value { font-size: 14px; font-weight: 500; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="avatar">
                ${user.firstName[0]}${user.lastName[0]}
              </div>
              <div class="info">
                <h1>${user.firstName} ${user.lastName}</h1>
                <div class="badges">
                  <span class="badge badge-role">${user.role}</span>
                  <span class="badge badge-status">${user.status}</span>
                </div>
                <div class="value">${user.email}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Informations Personnelles</div>
              <div class="grid">
                <div class="field">
                  <div class="label">Email</div>
                  <div class="value">${user.email}</div>
                </div>
                <div class="field">
                  <div class="label">Téléphone</div>
                  <div class="value">${user.phone || 'Non renseigné'}</div>
                </div>
                <div class="field">
                  <div class="label">Genre</div>
                  <div class="value">${user.gender === 'M' ? 'Masculin' : user.gender === 'F' ? 'Féminin' : 'Non renseigné'}</div>
                </div>
                <div class="field">
                  <div class="label">Date de naissance</div>
                  <div class="value">${user.dateOfBirth ? format(new Date(user.dateOfBirth), 'dd MMMM yyyy', { locale: fr }) : 'Non renseignée'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Organisation</div>
              <div class="grid">
                <div class="field">
                  <div class="label">Groupe Scolaire</div>
                  <div class="value">${user.schoolGroupName || 'Non assigné'}</div>
                </div>
                <div class="field">
                  <div class="label">École</div>
                  <div class="value">${user.schoolName || 'Non assignée'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Permissions</div>
              <div class="grid">
                <div class="field">
                  <div class="label">Rôle Système</div>
                  <div class="value">${user.role}</div>
                </div>
                <div class="field">
                  <div class="label">Profil d'Accès</div>
                  <div class="value">${user.accessProfileCode || 'Aucun'}</div>
                </div>
              </div>
            </div>

            <div class="footer">
              Généré par E-Pilot le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Admin E-Pilot',
      admin_groupe: 'Administrateur de Groupe',
      proviseur: 'Proviseur',
      directeur: 'Directeur',
      enseignant: 'Enseignant',
      comptable: 'Comptable',
      secretaire: 'Secrétaire',
      surveillant: 'Surveillant',
      parent: 'Parent',
      eleve: 'Élève',
    };
    return labels[role] || role;
  };

  const getProfileLabel = (code: string | undefined) => {
    if (!code) return 'Non défini';
    const labels: Record<string, string> = {
      chef_etablissement: 'Chef d\'Établissement',
      financier_sans_suppression: 'Financier',
      administratif_basique: 'Administratif',
      enseignant_saisie_notes: 'Enseignant',
      parent_consultation: 'Parent',
      eleve_consultation: 'Élève',
    };
    return labels[code] || code;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div id="printable-user-profile">
          <DialogHeader className="flex flex-row items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <UserAvatar
                firstName={user.firstName}
                lastName={user.lastName}
                avatar={user.avatar}
                status={user.status}
                size="xl"
              />
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </DialogTitle>
                <DialogDescription className="mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {user.email}
                  </span>
                </DialogDescription>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={getRoleBadgeClass(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  <Badge className={getStatusBadgeClass(user.status)}>
                    {user.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer Fiche
            </Button>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] px-0 py-2"
              >
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger 
                value="school" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] px-0 py-2"
              >
                École & Groupe
              </TabsTrigger>
              <TabsTrigger 
                value="permissions" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] px-0 py-2"
              >
                Permissions
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1D3557] data-[state=active]:text-[#1D3557] px-0 py-2"
              >
                Activité
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Info Contact */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      Informations Personnelles
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Téléphone</p>
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {user.phone ? (
                              <>
                                <Phone className="h-3 w-3 text-gray-400" />
                                {user.phone}
                              </>
                            ) : (
                              <span className="text-gray-400 italic">Non renseigné</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Genre</p>
                          <p className="font-medium text-gray-900">
                            {user.gender === 'M' ? '👨 Masculin' : user.gender === 'F' ? '👩 Féminin' : 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date de naissance</p>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {user.dateOfBirth ? (
                            <>
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {format(new Date(user.dateOfBirth), 'dd MMMM yyyy', { locale: fr })}
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Non renseignée</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Résumé École */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Building2 className="h-4 w-4" />
                      </div>
                      Affiliation
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Groupe Scolaire</p>
                        <p className="font-medium text-gray-900 text-lg">
                          {user.schoolGroupName || 'Aucun'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">École d'appartenance</p>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-indigo-500" />
                          {user.schoolName || 'Non assignée'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Compte créé le</p>
                        <p className="font-medium text-gray-700">
                          {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="school" className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100">
                      <Building2 className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {user.schoolGroupName || 'Aucun Groupe'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Réseau d'établissements scolaires
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-indigo-50">
                          <p className="text-sm text-gray-500 mb-1">École assignée</p>
                          <div className="font-semibold text-indigo-900 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            {user.schoolName || 'Aucune école assignée'}
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-indigo-50">
                          <p className="text-sm text-gray-500 mb-1">Rôle dans l'organisation</p>
                          <div className="font-semibold text-indigo-900">
                            {getRoleLabel(user.role)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      Rôle & Accès
                    </h3>
                    <div className="space-y-4">
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-700 font-medium mb-1">Rôle Système</p>
                        <p className="text-lg font-bold text-emerald-900">{getRoleLabel(user.role)}</p>
                      </div>
                      
                      {user.role !== 'super_admin' && user.role !== 'admin_groupe' && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-700 font-medium mb-1">Profil d'Accès (Permissions)</p>
                          <p className="text-lg font-bold text-blue-900 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {getProfileLabel(user.accessProfileCode)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      Détails des droits
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {user.role === 'admin_groupe' ? (
                        <>
                          <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span> Gestion complète du groupe scolaire
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span> Création et gestion des utilisateurs
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span> Accès aux statistiques financières
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span> Accès limité à l'école : <strong>{user.schoolName}</strong>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span> Permissions selon le profil : <strong>{getProfileLabel(user.accessProfileCode)}</strong>
                          </li>
                        </>
                      )}
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Accès au tableau de bord
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    Historique de connexion
                  </h3>
                  
                  <div className="space-y-4">
                    {!loginHistoryData || loginHistoryData.length === 0 ? (
                       <div className="text-center py-8 text-gray-500">
                         <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                         Aucun historique de connexion récent
                         {user.lastLogin && (
                           <p className="text-sm mt-2">
                             Dernière connexion le {format(new Date(user.lastLogin), 'dd/MM/yyyy à HH:mm')}
                           </p>
                         )}
                       </div>
                    ) : (
                      loginHistoryData.map((login: LoginHistoryEntry, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${login.device_type?.includes('Mobile') ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                              {login.device_type?.includes('Mobile') ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {login.device_type || 'Appareil inconnu'}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {login.location_city || 'Ville inconnue'}, {login.location_country || 'Pays inconnu'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-900">
                              {login.login_at ? format(new Date(login.login_at), 'dd MMM HH:mm', { locale: fr }) : '-'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {login.login_at ? formatDistanceToNow(new Date(login.login_at), { addSuffix: true, locale: fr }) : ''}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
