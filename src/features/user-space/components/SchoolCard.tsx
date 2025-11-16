import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  School, 
  GraduationCap, 
  Users, 
  BookOpen, 
  MapPin, 
  Phone, 
  Mail,
  Eye,
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SchoolDetailsModal } from './SchoolDetailsModal';

export interface SchoolData {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  status: string;
  students_count: number;
  teachers_count: number;
  classes_count: number;
  created_at: string;
  logo_url?: string;
}

interface SchoolCardProps {
  school: SchoolData;
}

export const SchoolCard = ({ school }: SchoolCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debug: Vérifier si le logo est présent
  console.log('🏫 École:', school.name, '| Logo:', school.logo_url || 'PAS DE LOGO');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#2A9D8F]/5 to-[#1D3557]/5 rounded-2xl blur-xl" />
        <Card className="relative p-6 bg-white/90 backdrop-blur-xl border-white/60 shadow-lg hover:shadow-xl transition-all duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                {school.logo_url ? (
                  <img 
                    src={school.logo_url} 
                    alt={`Logo ${school.name}`}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      // Si l'image ne charge pas, afficher l'icône par défaut
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<svg class="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M18 5v17"/><path d="m4 6 8-4 8 4"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg>';
                    }}
                  />
                ) : (
                  <School className="h-8 w-8 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl text-gray-900 mb-1 truncate">{school.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge className={school.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                    {school.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Depuis {new Date(school.created_at).getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsModalOpen(true)}
              aria-label={`Voir les détails de ${school.name}`}
              title="Voir les détails de l'école"
              className="flex-shrink-0"
            >
              <Eye className="h-5 w-5" />
            </Button>
          </div>

          {/* Statistiques Principales */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <GraduationCap className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{school.students_count}</div>
              <div className="text-xs text-gray-600 font-medium">Élèves</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{school.teachers_count}</div>
              <div className="text-xs text-gray-600 font-medium">Enseignants</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <BookOpen className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{school.classes_count}</div>
              <div className="text-xs text-gray-600 font-medium">Classes</div>
            </div>
          </div>

          {/* Taux de Réussite (Exemple) */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Performance Globale</span>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-bold">+5%</span>
              </div>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">85% de taux de réussite</p>
          </div>

          {/* Informations de Contact */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Coordonnées</h4>
            {school.address && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <MapPin className="h-4 w-4 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{school.address}</span>
              </div>
            )}
            {school.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Phone className="h-4 w-4 text-[#2A9D8F] flex-shrink-0" />
                <span className="text-sm text-gray-700">{school.phone}</span>
              </div>
            )}
            {school.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Mail className="h-4 w-4 text-[#2A9D8F] flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{school.email}</span>
              </div>
            )}
          </div>

          {/* Bouton Voir Détails */}
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="w-full mt-4 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir tous les détails
          </Button>
        </Card>
      </motion.div>

      {/* Modal Détails */}
      <SchoolDetailsModal 
        school={school}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
