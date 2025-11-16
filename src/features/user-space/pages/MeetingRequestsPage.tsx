/**
 * Page Demandes de Réunion
 * Planification et gestion des réunions
 */

import { useState } from 'react';
import { Calendar, Plus, Video, Clock, CheckCircle, XCircle, Users, MapPin, Link as LinkIcon, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { StatsCard } from '../components/StatsCard';

export const MeetingRequestsPage = () => {
  const { data: user } = useCurrentUser();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meetingType: 'admin',
    proposedDate: '',
    location: '',
    meetingLink: '',
  });

  // Mock data
  const meetings = [
    {
      id: '1',
      title: 'Réunion Budget 2025',
      type: 'admin',
      status: 'approved',
      date: '2025-01-20T14:00:00',
      location: 'Salle de conférence',
      participants: ['Admin Groupe', 'Proviseur'],
    },
    {
      id: '2',
      title: 'Coordination Pédagogique',
      type: 'schools',
      status: 'pending',
      date: '2025-01-18T10:00:00',
      location: 'En ligne',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      participants: ['Directeurs des écoles'],
    },
  ];

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      approved: { label: 'Approuvée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: 'Rejetée', color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Envoyer la demande
    toast({
      title: 'Demande envoyée',
      description: 'Votre demande de réunion a été envoyée avec succès.',
    });
    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      meetingType: 'admin',
      proposedDate: '',
      location: '',
      meetingLink: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            Demandes de Réunion
          </h1>
          <p className="text-gray-600 mt-1">
            Planifiez des réunions avec l'admin ou d'autres directeurs
          </p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total demandes"
          value={12}
          subtitle="Toutes les réunions"
          icon={Calendar}
          color="from-pink-500 to-pink-600"
          delay={0}
        />

        <StatsCard
          title="En attente"
          value={3}
          subtitle="À valider"
          icon={Clock}
          color="from-yellow-500 to-yellow-600"
          delay={0.1}
        />

        <StatsCard
          title="Approuvées"
          value={8}
          subtitle="Confirmées"
          icon={CheckCircle}
          color="from-green-500 to-green-600"
          delay={0.2}
        />

        <StatsCard
          title="Ce mois-ci"
          value={5}
          subtitle="Réunions prévues"
          icon={Video}
          color="from-blue-500 to-blue-600"
          delay={0.3}
        />
      </div>

      {/* Recherche et filtres */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher une réunion..."
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

      {/* Liste des réunions */}
      <div className="space-y-4">
        {meetings.map((meeting, index) => {
          const statusConfig = getStatusBadge(meeting.status);
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {meeting.title}
                      </h3>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(meeting.date).toLocaleString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {meeting.location}
                      </div>
                      {meeting.meetingLink && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Lien de la réunion
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {meeting.participants.join(', ')}
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    Voir détails
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Modal Nouvelle Demande */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle Demande de Réunion</DialogTitle>
            <DialogDescription>
              Remplissez le formulaire pour demander une réunion
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de la réunion *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Réunion Budget 2025"
                required
              />
            </div>

            <div>
              <Label htmlFor="meetingType">Type de réunion *</Label>
              <Select
                value={formData.meetingType}
                onValueChange={(value) => setFormData({ ...formData, meetingType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Avec l'administration</SelectItem>
                  <SelectItem value="schools">Avec les autres écoles</SelectItem>
                  <SelectItem value="internal">Interne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez l'objet de la réunion..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proposedDate">Date proposée *</Label>
                <Input
                  id="proposedDate"
                  type="datetime-local"
                  value={formData.proposedDate}
                  onChange={(e) => setFormData({ ...formData, proposedDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Lieu</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Salle de conférence ou En ligne"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="meetingLink">Lien de réunion (optionnel)</Label>
              <Input
                id="meetingLink"
                type="url"
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-pink-500 to-pink-600">
                Envoyer la demande
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
