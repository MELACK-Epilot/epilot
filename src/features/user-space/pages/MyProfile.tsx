/**
 * Page de profil utilisateur
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react';

export const MyProfile = () => {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A9D8F]"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <Button className="bg-[#2A9D8F] hover:bg-[#238276]">
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#1D3557] flex items-center justify-center text-white text-3xl font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600 capitalize mb-4">
              {user?.role.replace('_', ' ')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+242 06 123 45 67</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Brazzaville, Congo</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Membre depuis 2025</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informations complémentaires</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Statut</label>
            <p className="text-gray-900 capitalize">{user?.status}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Identifiant</label>
            <p className="text-gray-900 font-mono text-sm">{user?.id}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
