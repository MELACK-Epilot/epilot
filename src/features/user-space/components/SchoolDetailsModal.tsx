import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  School,
  GraduationCap,
  Award,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  Share2,
  Upload,
  Download,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  X
} from 'lucide-react';
import { SchoolData } from './SchoolCard';
import { MessageModal } from './modals/MessageModal';
import { ShareFilesModal } from './modals/ShareFilesModal';
import { DownloadDocsModal } from './modals/DownloadDocsModal';
import { UploadFilesModal } from './modals/UploadFilesModal';
import { SchoolSettingsModal } from './modals/SchoolSettingsModal';
import { useNavigate } from 'react-router-dom';

interface SchoolDetailsModalProps {
  school: SchoolData;
  isOpen: boolean;
  onClose: () => void;
}

export const SchoolDetailsModal = ({ school, isOpen, onClose }: SchoolDetailsModalProps) => {
  const navigate = useNavigate();
  
  // États pour les modals
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isShareFilesModalOpen, setIsShareFilesModalOpen] = useState(false);
  const [isDownloadDocsModalOpen, setIsDownloadDocsModalOpen] = useState(false);
  const [isUploadFilesModalOpen, setIsUploadFilesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleNavigateToPage = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-xl flex items-center justify-center">
                <School className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{school.name}</DialogTitle>
                <Badge className={school.status === 'active' ? 'bg-green-100 text-green-800 border-green-200 mt-1' : 'bg-gray-100 text-gray-800 border-gray-200 mt-1'}>
                  {school.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Statistiques Détaillées */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#2A9D8F]" />
              Statistiques Détaillées
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <GraduationCap className="h-6 w-6 text-blue-600 mb-2" />
                <div className="text-3xl font-bold text-blue-600">{school.students_count}</div>
                <div className="text-sm text-gray-600">Élèves inscrits</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12% cette année</span>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <Award className="h-6 w-6 text-purple-600 mb-2" />
                <div className="text-3xl font-bold text-purple-600">{school.teachers_count}</div>
                <div className="text-sm text-gray-600">Enseignants</div>
                <div className="text-xs text-gray-500 mt-1">Corps enseignant qualifié</div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <BookOpen className="h-6 w-6 text-orange-600 mb-2" />
                <div className="text-3xl font-bold text-orange-600">{school.classes_count}</div>
                <div className="text-sm text-gray-600">Classes actives</div>
                <div className="text-xs text-gray-500 mt-1">Tous niveaux confondus</div>
              </div>
            </div>
          </div>

          {/* Informations de Contact */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-[#2A9D8F]" />
              Coordonnées
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {school.address && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="h-5 w-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Adresse</p>
                    <p className="text-sm text-gray-900 font-medium">{school.address}</p>
                  </div>
                </div>
              )}
              {school.phone && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Phone className="h-5 w-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Téléphone</p>
                    <p className="text-sm text-gray-900 font-medium">{school.phone}</p>
                  </div>
                </div>
              )}
              {school.email && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Mail className="h-5 w-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-900 font-medium">{school.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <Calendar className="h-5 w-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Membre depuis</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {new Date(school.created_at).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions de Communication */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#2A9D8F]" />
              Actions et Communication
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                onClick={() => setIsMessageModalOpen(true)}
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-[#2A9D8F]/10 hover:border-[#2A9D8F]"
              >
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Envoyer un message</span>
              </Button>

              <Button
                onClick={() => setIsShareFilesModalOpen(true)}
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-[#2A9D8F]/10 hover:border-[#2A9D8F]"
              >
                <Share2 className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Partager fichiers</span>
              </Button>

              <Button
                onClick={() => setIsDownloadDocsModalOpen(true)}
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-[#2A9D8F]/10 hover:border-[#2A9D8F]"
              >
                <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Télécharger docs</span>
              </Button>

              <Button
                onClick={() => setIsUploadFilesModalOpen(true)}
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-[#2A9D8F]/10 hover:border-[#2A9D8F]"
              >
                <Upload className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Envoyer fichiers</span>
              </Button>

              <Button
                onClick={() => handleNavigateToPage('/user-space/staff-management')}
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-[#2A9D8F]/10 hover:border-[#2A9D8F]"
              >
                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Voir personnel</span>
              </Button>

              <Button
                onClick={() => handleNavigateToPage('/user-space/reports')}
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-[#2A9D8F]/10 hover:border-[#2A9D8F]"
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Voir rapports</span>
              </Button>

              <Button
                onClick={() => handleNavigateToPage('/user-space/advanced-stats')}
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-[#2A9D8F]/10 hover:border-[#2A9D8F]"
              >
                <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Statistiques</span>
              </Button>

              <Button
                onClick={() => setIsSettingsModalOpen(true)}
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-[#2A9D8F]/10 hover:border-[#2A9D8F]"
              >
                <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Paramètres</span>
              </Button>

              <Button
                onClick={() => handleNavigateToPage('/user-space/classes-management')}
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-[#2A9D8F]/10 hover:border-[#2A9D8F]"
              >
                <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">Voir classes</span>
              </Button>
            </div>
          </div>

          {/* Actions Principales */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={() => setIsMessageModalOpen(true)}
              className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter l'école
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Tous les modals */}
      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        schoolName={school.name}
        schoolId={school.id}
      />

      <ShareFilesModal
        isOpen={isShareFilesModalOpen}
        onClose={() => setIsShareFilesModalOpen(false)}
        schoolName={school.name}
        schoolId={school.id}
      />

      <DownloadDocsModal
        isOpen={isDownloadDocsModalOpen}
        onClose={() => setIsDownloadDocsModalOpen(false)}
        schoolName={school.name}
        schoolId={school.id}
      />

      <UploadFilesModal
        isOpen={isUploadFilesModalOpen}
        onClose={() => setIsUploadFilesModalOpen(false)}
        schoolName={school.name}
        schoolId={school.id}
      />

      <SchoolSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        schoolName={school.name}
        schoolId={school.id}
      />
    </Dialog>
  );
};
