/**
 * Card Personnel École - Affichage du personnel avec statistiques
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  BookOpen, 
  Shield, 
  Heart,
  Calculator,
  Eye,
  Plus,
  MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PersonnelMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  hireDate: string;
  subjects?: string[];
  classes?: string[];
}

interface SchoolPersonnelCardProps {
  schoolId: string;
  schoolName: string;
}

export const SchoolPersonnelCard = ({ schoolId, schoolName }: SchoolPersonnelCardProps) => {
  // Données de démonstration réalistes
  const personnelData: PersonnelMember[] = [
    {
      id: '1',
      firstName: 'Marie',
      lastName: 'Mbemba',
      role: 'directeur',
      email: 'marie.mbemba@ecole.cg',
      phone: '+242 06 123 4567',
      status: 'active',
      hireDate: '2020-09-01',
      classes: ['Direction'],
    },
    {
      id: '2',
      firstName: 'Jean',
      lastName: 'Kongo',
      role: 'enseignant',
      email: 'jean.kongo@ecole.cg',
      phone: '+242 06 234 5678',
      status: 'active',
      hireDate: '2021-01-15',
      subjects: ['Mathématiques', 'Physique'],
      classes: ['6ème A', '5ème B'],
    },
    {
      id: '3',
      firstName: 'Grace',
      lastName: 'Nzambi',
      role: 'enseignant',
      email: 'grace.nzambi@ecole.cg',
      status: 'active',
      hireDate: '2019-08-20',
      subjects: ['Français', 'Littérature'],
      classes: ['4ème A', '3ème C'],
    },
    {
      id: '4',
      firstName: 'Paul',
      lastName: 'Makaya',
      role: 'cpe',
      email: 'paul.makaya@ecole.cg',
      phone: '+242 06 345 6789',
      status: 'active',
      hireDate: '2022-02-10',
      classes: ['Vie scolaire'],
    },
    {
      id: '5',
      firstName: 'Sylvie',
      lastName: 'Moukoko',
      role: 'comptable',
      email: 'sylvie.moukoko@ecole.cg',
      status: 'active',
      hireDate: '2020-11-05',
      classes: ['Comptabilité'],
    },
    {
      id: '6',
      firstName: 'André',
      lastName: 'Bassouamina',
      role: 'infirmier',
      email: 'andre.bassouamina@ecole.cg',
      status: 'active',
      hireDate: '2021-06-12',
      classes: ['Infirmerie'],
    },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'directeur': return Shield;
      case 'enseignant': return GraduationCap;
      case 'cpe': return UserCheck;
      case 'comptable': return Calculator;
      case 'infirmier': return Heart;
      default: return Users;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'directeur': return 'Directeur';
      case 'enseignant': return 'Enseignant';
      case 'cpe': return 'CPE';
      case 'comptable': return 'Comptable';
      case 'infirmier': return 'Infirmier';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'directeur': return 'bg-purple-100 text-purple-800';
      case 'enseignant': return 'bg-blue-100 text-blue-800';
      case 'cpe': return 'bg-green-100 text-green-800';
      case 'comptable': return 'bg-orange-100 text-orange-800';
      case 'infirmier': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
      case 'suspended': return <Badge className="bg-red-100 text-red-800">Suspendu</Badge>;
      default: return null;
    }
  };

  // Statistiques du personnel
  const stats = {
    total: personnelData.length,
    directeurs: personnelData.filter(p => p.role === 'directeur').length,
    enseignants: personnelData.filter(p => p.role === 'enseignant').length,
    cpe: personnelData.filter(p => p.role === 'cpe').length,
    comptables: personnelData.filter(p => p.role === 'comptable').length,
    autres: personnelData.filter(p => !['directeur', 'enseignant', 'cpe', 'comptable'].includes(p.role)).length,
    actifs: personnelData.filter(p => p.status === 'active').length,
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Personnel</h3>
              <p className="text-sm text-gray-500">{schoolName}</p>
            </div>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-700">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.enseignants}</div>
            <div className="text-xs text-green-700">Enseignants</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.directeurs}</div>
            <div className="text-xs text-purple-700">Direction</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.autres + stats.comptables + stats.cpe}</div>
            <div className="text-xs text-orange-700">Support</div>
          </div>
        </div>

        {/* Liste du personnel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Membres du personnel ({stats.actifs} actifs)</h4>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Voir tout
            </Button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {personnelData.map((member, index) => {
              const RoleIcon = getRoleIcon(member.role);
              
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <RoleIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </span>
                        {getStatusBadge(member.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </Badge>
                        {member.subjects && (
                          <span className="text-xs text-gray-500">
                            {member.subjects.join(', ')}
                          </span>
                        )}
                        {member.classes && !member.subjects && (
                          <span className="text-xs text-gray-500">
                            {member.classes.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <BookOpen className="w-4 h-4 mr-2" />
            Emplois du temps
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Calculator className="w-4 h-4 mr-2" />
            Salaires
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Users className="w-4 h-4 mr-2" />
            Gestion
          </Button>
        </div>
      </div>
    </Card>
  );
};
