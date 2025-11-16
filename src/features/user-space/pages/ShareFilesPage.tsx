/**
 * Page Partage de Fichiers
 * Upload et partage de fichiers entre écoles
 */

import { useState } from 'react';
import { Share2, Upload, FileText, Download, Search, Filter, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShareFilesModal } from '../components/modals/ShareFilesModal';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { motion } from 'framer-motion';
import { StatsCard } from '../components/StatsCard';

export const ShareFilesPage = () => {
  const { data: user } = useCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const sharedFiles = [
    {
      id: '1',
      name: 'Rapport Trimestriel Q1.pdf',
      type: 'document',
      size: 2.5,
      uploadDate: '2025-01-15',
      sharedWith: ['École Primaire A', 'École Secondaire B'],
      status: 'shared',
    },
    {
      id: '2',
      name: 'Photos Événement.zip',
      type: 'image',
      size: 15.8,
      uploadDate: '2025-01-10',
      sharedWith: ['Toutes les écoles'],
      status: 'shared',
    },
  ];

  const getFileIcon = (type: string) => {
    return <FileText className="h-5 w-5" />;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      shared: { label: 'Partagé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            Partager des Fichiers
          </h1>
          <p className="text-gray-600 mt-1">
            Partagez des fichiers avec les autres écoles du groupe
          </p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          Partager un fichier
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Fichiers partagés"
          value={24}
          subtitle="Documents disponibles"
          icon={FileText}
          color="from-green-500 to-green-600"
          delay={0}
        />

        <StatsCard
          title="Téléchargements"
          value={156}
          subtitle="Total des téléchargements"
          icon={Download}
          color="from-blue-500 to-blue-600"
          delay={0.1}
        />

        <StatsCard
          title="Espace utilisé"
          value="2.4 GB"
          subtitle="Sur 10 GB disponibles"
          icon={Upload}
          color="from-purple-500 to-purple-600"
          delay={0.2}
        />
      </div>

      {/* Recherche et filtres */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher un fichier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Liste des fichiers */}
      <div className="space-y-4">
        {sharedFiles.map((file, index) => {
          const statusConfig = getStatusBadge(file.status);
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {file.name}
                        </h3>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>{file.size} MB</span>
                        <span>•</span>
                        <span>{new Date(file.uploadDate).toLocaleDateString('fr-FR')}</span>
                        <span>•</span>
                        <span>Partagé avec: {file.sharedWith.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <ShareFilesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schoolName={user?.schoolGroupId || ''}
        schoolId={user?.schoolId || ''}
      />
    </div>
  );
};
