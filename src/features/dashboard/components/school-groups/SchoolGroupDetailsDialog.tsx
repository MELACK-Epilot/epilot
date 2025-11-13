/**
 * Composant Dialog Détails pour un Groupe Scolaire
 */

import { Building2, Users, GraduationCap, Edit, Calendar, MapPin, Phone, Globe, FileText, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { SchoolGroup } from '../../types/dashboard.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StatusBadgeProps {
  status: SchoolGroup['status'];
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const variants = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
  };

  const labels = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}>
      {labels[status]}
    </span>
  );
};

interface PlanBadgeProps {
  plan: SchoolGroup['plan'];
}

const PlanBadge = ({ plan }: PlanBadgeProps) => {
  const variants = {
    gratuit: 'bg-gray-100 text-gray-800',
    premium: 'bg-blue-100 text-blue-800',
    pro: 'bg-purple-100 text-purple-800',
    institutionnel: 'bg-yellow-100 text-yellow-800',
  };

  const labels = {
    gratuit: 'Gratuit',
    premium: 'Premium',
    pro: 'Pro',
    institutionnel: 'Institutionnel',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[plan]}`}>
      {labels[plan]}
    </span>
  );
};

interface SchoolGroupDetailsDialogProps {
  group: SchoolGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (group: SchoolGroup) => void;
}

export const SchoolGroupDetailsDialog = ({
  group,
  isOpen,
  onClose,
  onEdit,
}: SchoolGroupDetailsDialogProps) => {
  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1D3557]" />
            {group.name}
          </DialogTitle>
          <DialogDescription>
            Code: {group.code} • {group.region}, {group.city}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-600">Administrateur</Label>
              {group.adminName ? (
                <div className="flex items-center gap-3">
                  {group.adminAvatar ? (
                    <img 
                      src={group.adminAvatar} 
                      alt={group.adminName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white font-semibold">
                      {group.adminName.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{group.adminName}</p>
                    <p className="text-xs text-gray-500">{group.adminEmail}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-600 text-xl">⚠️</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900">Non assigné</p>
                    <p className="text-xs text-amber-700">Aucun administrateur assigné à ce groupe</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Plan & Statut</Label>
              <div className="flex items-center gap-2">
                <PlanBadge plan={group.plan} />
                <StatusBadge status={group.status} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Informations de contact */}
          <div>
            <Label className="text-gray-600 mb-3 block flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Informations de contact
            </Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Adresse */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Adresse</p>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p>{group.address || 'Non renseignée'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {group.region} • {group.city}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Téléphone & Site web */}
              <div className="space-y-3">
                {group.phone && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Téléphone</p>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${group.phone}`} className="hover:text-[#2A9D8F] transition-colors">
                        {group.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {group.website && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Site web</p>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a 
                        href={group.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-[#2A9D8F] transition-colors flex items-center gap-1"
                      >
                        {group.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description & Année de fondation */}
          {(group.description || group.foundedYear) && (
            <>
              <div>
                <Label className="text-gray-600 mb-3 block flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  À propos
                </Label>
                <div className="space-y-4">
                  {group.foundedYear && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Award className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Fondé en {group.foundedYear}
                        </p>
                        <p className="text-xs text-blue-700">
                          {new Date().getFullYear() - group.foundedYear} ans d'expérience
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {group.description && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {group.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          <Separator />

          {/* Statistiques */}
          <div>
            <Label className="text-gray-600 mb-3 block">Statistiques</Label>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Building2 className="w-8 h-8 mx-auto text-[#1D3557] mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{group.schoolCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Écoles</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <GraduationCap className="w-8 h-8 mx-auto text-[#2A9D8F] mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{group.studentCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Élèves</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 mx-auto text-[#E9C46A] mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{group.staffCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Personnel</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Dates & Logo */}
          <div className="grid grid-cols-3 gap-4">
            {/* Logo */}
            {group.logo && (
              <div className="col-span-1">
                <Label className="text-gray-600 mb-2 block">Logo</Label>
                <div className="w-full h-24 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={group.logo} 
                    alt={`Logo ${group.name}`}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="text-gray-400 text-xs">Logo indisponible</div>';
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Dates */}
            <div className={group.logo ? "col-span-2 grid grid-cols-2 gap-4" : "col-span-3 grid grid-cols-2 gap-4"}>
              <div>
                <Label className="text-gray-600 mb-2 block">Date de création</Label>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{format(new Date(group.createdAt), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
              </div>
              <div>
                <Label className="text-gray-600 mb-2 block">Dernière mise à jour</Label>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{format(new Date(group.updatedAt), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button 
            className="bg-[#1D3557] hover:bg-[#2A9D8F]"
            onClick={() => {
              onClose();
              onEdit(group);
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
