import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Save,
  School,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  Bell,
  Shield,
  Palette,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  schoolId: string;
}

export const SchoolSettingsModal = ({ isOpen, onClose, schoolName }: SchoolSettingsModalProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Informations générales
  const [generalInfo, setGeneralInfo] = useState({
    name: schoolName,
    address: '123 Rue de l\'Éducation, Yaoundé',
    phone: '+237 6 XX XX XX XX',
    email: 'contact@ecole.cm',
    website: 'www.ecole.cm',
    description: 'École d\'excellence offrant un enseignement de qualité.',
  });

  // Paramètres de notification
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklyReports: true,
    monthlyReports: true,
    urgentAlerts: true,
  });

  // Paramètres de sécurité
  const [security, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    ipWhitelist: false,
  });

  // Paramètres d'apparence
  const [appearance, setAppearance] = useState({
    primaryColor: '#2A9D8F',
    secondaryColor: '#1D3557',
    logo: null as File | null,
    theme: 'light',
  });

  // Horaires
  const [schedule, setSchedule] = useState({
    openingTime: '07:30',
    closingTime: '17:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      toast({
        title: "Paramètres sauvegardés !",
        description: "Les modifications ont été appliquées avec succès.",
      });
      setIsSaving(false);
    }, 1500);
  };

  const weekDays = [
    { value: 'monday', label: 'Lundi' },
    { value: 'tuesday', label: 'Mardi' },
    { value: 'wednesday', label: 'Mercredi' },
    { value: 'thursday', label: 'Jeudi' },
    { value: 'friday', label: 'Vendredi' },
    { value: 'saturday', label: 'Samedi' },
    { value: 'sunday', label: 'Dimanche' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-xl flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Paramètres de l'école</DialogTitle>
              <DialogDescription>
                Configuration pour : <span className="font-semibold text-[#2A9D8F]">{schoolName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">
              <School className="h-4 w-4 mr-2" />
              Général
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Apparence
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Clock className="h-4 w-4 mr-2" />
              Horaires
            </TabsTrigger>
          </TabsList>

          {/* Onglet Général */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="school-name" className="flex items-center gap-2 mb-2">
                  <School className="h-4 w-4 text-[#2A9D8F]" />
                  Nom de l'école
                </Label>
                <Input
                  id="school-name"
                  value={generalInfo.name}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-[#2A9D8F]" />
                  Adresse
                </Label>
                <Input
                  id="address"
                  value={generalInfo.address}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-[#2A9D8F]" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    value={generalInfo.phone}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-[#2A9D8F]" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={generalInfo.email}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website" className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-[#2A9D8F]" />
                  Site web
                </Label>
                <Input
                  id="website"
                  value={generalInfo.website}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, website: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                  <School className="h-4 w-4 text-[#2A9D8F]" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={generalInfo.description}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, description: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Onglet Notifications */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#2A9D8F]" />
                  <div>
                    <p className="font-medium text-gray-900">Notifications par email</p>
                    <p className="text-sm text-gray-500">Recevoir les notifications importantes par email</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#2A9D8F]" />
                  <div>
                    <p className="font-medium text-gray-900">Notifications par SMS</p>
                    <p className="text-sm text-gray-500">Recevoir les alertes urgentes par SMS</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.smsNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, smsNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-[#2A9D8F]" />
                  <div>
                    <p className="font-medium text-gray-900">Notifications push</p>
                    <p className="text-sm text-gray-500">Recevoir les notifications dans l'application</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, pushNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[#2A9D8F]" />
                  <div>
                    <p className="font-medium text-gray-900">Rapports hebdomadaires</p>
                    <p className="text-sm text-gray-500">Recevoir un résumé chaque semaine</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, weeklyReports: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[#2A9D8F]" />
                  <div>
                    <p className="font-medium text-gray-900">Rapports mensuels</p>
                    <p className="text-sm text-gray-500">Recevoir un bilan détaillé chaque mois</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.monthlyReports}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, monthlyReports: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Onglet Sécurité */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[#2A9D8F]" />
                  <div>
                    <p className="font-medium text-gray-900">Authentification à deux facteurs</p>
                    <p className="text-sm text-gray-500">Sécurité renforcée pour les connexions</p>
                  </div>
                </div>
                <Switch
                  checked={security.twoFactorAuth}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({ ...security, twoFactorAuth: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="session-timeout" className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-[#2A9D8F]" />
                  Délai d'expiration de session (minutes)
                </Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...security, sessionTimeout: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="password-expiry" className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-[#2A9D8F]" />
                  Expiration du mot de passe (jours)
                </Label>
                <Input
                  id="password-expiry"
                  type="number"
                  value={security.passwordExpiry}
                  onChange={(e) => setSecuritySettings({ ...security, passwordExpiry: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[#2A9D8F]" />
                  <div>
                    <p className="font-medium text-gray-900">Liste blanche d'IP</p>
                    <p className="text-sm text-gray-500">Restreindre l'accès à certaines adresses IP</p>
                  </div>
                </div>
                <Switch
                  checked={security.ipWhitelist}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({ ...security, ipWhitelist: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Onglet Apparence */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Palette className="h-4 w-4 text-[#2A9D8F]" />
                  Couleur principale
                </Label>
                <div className="flex gap-3">
                  <Input
                    type="color"
                    value={appearance.primaryColor}
                    onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                    className="w-20 h-12"
                  />
                  <Input
                    type="text"
                    value={appearance.primaryColor}
                    onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Palette className="h-4 w-4 text-[#2A9D8F]" />
                  Couleur secondaire
                </Label>
                <div className="flex gap-3">
                  <Input
                    type="color"
                    value={appearance.secondaryColor}
                    onChange={(e) => setAppearance({ ...appearance, secondaryColor: e.target.value })}
                    className="w-20 h-12"
                  />
                  <Input
                    type="text"
                    value={appearance.secondaryColor}
                    onChange={(e) => setAppearance({ ...appearance, secondaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <School className="h-4 w-4 text-[#2A9D8F]" />
                  Logo de l'école
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <School className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-3">Glissez votre logo ici ou cliquez pour sélectionner</p>
                  <Button variant="outline" size="sm">
                    Choisir un fichier
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Horaires */}
          <TabsContent value="schedule" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opening-time" className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-[#2A9D8F]" />
                    Heure d'ouverture
                  </Label>
                  <Input
                    id="opening-time"
                    type="time"
                    value={schedule.openingTime}
                    onChange={(e) => setSchedule({ ...schedule, openingTime: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="closing-time" className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-[#2A9D8F]" />
                    Heure de fermeture
                  </Label>
                  <Input
                    id="closing-time"
                    type="time"
                    value={schedule.closingTime}
                    onChange={(e) => setSchedule({ ...schedule, closingTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-[#2A9D8F]" />
                  Jours d'ouverture
                </Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <Badge
                      key={day.value}
                      className={`cursor-pointer px-4 py-2 ${
                        schedule.workingDays.includes(day.value)
                          ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                      onClick={() => {
                        if (schedule.workingDays.includes(day.value)) {
                          setSchedule({
                            ...schedule,
                            workingDays: schedule.workingDays.filter(d => d !== day.value),
                          });
                        } else {
                          setSchedule({
                            ...schedule,
                            workingDays: [...schedule.workingDays, day.value],
                          });
                        }
                      }}
                    >
                      {day.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t mt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white"
          >
            {isSaving ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les modifications
              </>
            )}
          </Button>
          <Button onClick={onClose} variant="outline">
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
