/**
 * Page de Gestion du Personnel pour le Proviseur
 * Vue complète du personnel de l'école avec statistiques et filtres
 * @module PersonnelManagement
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Search, 
  Filter, 
  Download,
  Mail,
  Phone,
  Calendar,
  Award,
  TrendingUp,
  RefreshCw,
  Eye,
  MoreVertical
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/features/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

// Types
interface PersonnelMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  schoolId: string;
  schoolName?: string;
  hireDate?: string;
  avatar?: string;
  specialization?: string;
  classesCount?: number;
}

interface PersonnelStats {
  total: number;
  active: number;
  enseignants: number;
  administratifs: number;
  autres: number;
}

// Composant KPI Card
const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number | string; 
  subtitle: string; 
  icon: any; 
  color: string;
}) => (
  <Card className="p-6 hover:shadow-lg transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <TrendingUp className="h-4 w-4 text-green-500" />
    </div>
    <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </Card>
);

// Composant Badge de rôle
const RoleBadge = ({ role }: { role: string }) => {
  const roleConfig: Record<string, { label: string; color: string }> = {
    enseignant: { label: 'Enseignant', color: 'bg-blue-100 text-blue-800' },
    cpe: { label: 'CPE', color: 'bg-purple-100 text-purple-800' },
    comptable: { label: 'Comptable', color: 'bg-green-100 text-green-800' },
    secretaire: { label: 'Secrétaire', color: 'bg-pink-100 text-pink-800' },
    surveillant: { label: 'Surveillant', color: 'bg-orange-100 text-orange-800' },
    bibliothecaire: { label: 'Bibliothécaire', color: 'bg-indigo-100 text-indigo-800' },
    directeur: { label: 'Directeur', color: 'bg-red-100 text-red-800' },
    proviseur: { label: 'Proviseur', color: 'bg-red-100 text-red-800' },
  };

  const config = roleConfig[role] || { label: role, color: 'bg-gray-100 text-gray-800' };
  
  return (
    <Badge className={`${config.color} font-medium`}>
      {config.label}
    </Badge>
  );
};

// Composant Principal
export const PersonnelManagement = () => {
  const { user } = useAuth();
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Charger le personnel
  const loadPersonnel = async () => {
    if (!user?.schoolId) {
      setError('Aucune école associée');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          role,
          status,
          school_id,
          created_at,
          avatar_url,
          schools!inner(
            name
          )
        `)
        .eq('school_id', user.schoolId)
        .in('role', [
          'enseignant', 
          'cpe', 
          'comptable', 
          'secretaire', 
          'surveillant',
          'bibliothecaire',
          'gestionnaire_cantine',
          'conseiller_orientation',
          'infirmier',
          'directeur',
          'directeur_etudes'
        ])
        .order('last_name', { ascending: true });

      if (fetchError) throw fetchError;

      // Transformer les données
      const personnelData: PersonnelMember[] = (data || []).map((member: any) => ({
        id: member.id,
        firstName: member.first_name || '',
        lastName: member.last_name || '',
        email: member.email,
        phone: member.phone,
        role: member.role,
        status: member.status,
        schoolId: member.school_id,
        schoolName: member.schools?.name,
        hireDate: member.created_at,
        avatar: member.avatar_url,
      }));

      // Charger le nombre de classes pour les enseignants
      for (const member of personnelData) {
        if (member.role === 'enseignant') {
          const { count } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', member.id)
            .eq('status', 'active');
          
          member.classesCount = count || 0;
        }
      }

      setPersonnel(personnelData);
    } catch (err: any) {
      console.error('Erreur chargement personnel:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPersonnel();
  }, [user?.schoolId]);

  // Calculer les statistiques
  const stats: PersonnelStats = useMemo(() => {
    const active = personnel.filter(p => p.status === 'active');
    return {
      total: personnel.length,
      active: active.length,
      enseignants: active.filter(p => p.role === 'enseignant').length,
      administratifs: active.filter(p => ['secretaire', 'comptable'].includes(p.role)).length,
      autres: active.filter(p => !['enseignant', 'secretaire', 'comptable'].includes(p.role)).length,
    };
  }, [personnel]);

  // Filtrer le personnel
  const filteredPersonnel = useMemo(() => {
    return personnel.filter(member => {
      const matchesSearch = 
        member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = selectedRole === 'all' || member.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
  }, [personnel, searchQuery, selectedRole]);

  // Rôles disponibles pour le filtre
  const availableRoles = useMemo(() => {
    const roles = new Set(personnel.map(p => p.role));
    return Array.from(roles).sort();
  }, [personnel]);

  // Export CSV
  const handleExport = () => {
    const csv = [
      ['Nom', 'Prénom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Classes'].join(','),
      ...filteredPersonnel.map(p => [
        p.lastName,
        p.firstName,
        p.email,
        p.phone || '',
        p.role,
        p.status,
        p.classesCount || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personnel-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion du Personnel</h1>
              <p className="text-gray-600 mt-1">
                École • {stats.active} membres actifs
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadPersonnel}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Personnel"
            value={stats.total}
            subtitle={`${stats.active} actifs`}
            icon={Users}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Enseignants"
            value={stats.enseignants}
            subtitle="Corps enseignant"
            icon={Award}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Administratifs"
            value={stats.administratifs}
            subtitle="Secrétaires & Comptables"
            icon={UserCheck}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Autres"
            value={stats.autres}
            subtitle="CPE, Surveillants, etc."
            icon={Users}
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* Alerte si erreur */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtres */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, prénom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les rôles</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>{filteredPersonnel.length} résultat(s)</span>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </Card>

        {/* Liste du personnel */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Membre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Classes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Chargement du personnel...</p>
                    </td>
                  </tr>
                ) : filteredPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">Aucun membre trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filteredPersonnel.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </p>
                            {member.hireDate && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Depuis {new Date(member.hireDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.role === 'enseignant' ? (
                          <Badge variant="outline" className="font-medium">
                            {member.classesCount || 0} classe(s)
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={
                            member.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {member.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
