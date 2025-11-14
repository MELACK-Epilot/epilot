/**
 * Page de gestion de l'environnement sandbox
 * Permet au Super Admin de générer et supprimer les données de test
 * @module SandboxManager
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSandboxStats } from '@/hooks/useIsSandbox';
import { supabase } from '@/lib/supabase';
import {
  TestTube2,
  Plus,
  Trash2,
  Loader2,
  School,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SandboxManager() {
  const { toast } = useToast();
  const { data: stats, refetch: refetchStats } = useSandboxStats();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Générer les données sandbox
   */
  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      toast({
        title: "🧪 Génération en cours...",
        description: "Création de 5 groupes, 20 écoles, 6500+ élèves. Cela peut prendre 2-3 minutes.",
      });

      // Appeler la fonction SQL
      const { data, error } = await supabase.rpc('generate_sandbox_data_sql');

      if (error) throw error;

      await refetchStats();

      toast({
        title: "✅ Données sandbox générées !",
        description: `${data.data.school_groups} groupes, ${data.data.schools} écoles, ${data.data.students} élèves créés`,
      });
    } catch (error: any) {
      console.error('Erreur génération sandbox:', error);
      
      // Fallback : afficher les instructions manuelles
      toast({
        title: "📋 Génération Manuelle Requise",
        description: "Ouvrez un terminal et exécutez: npm run generate:sandbox",
        duration: 10000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Supprimer les données sandbox
   */
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_sandbox_data');

      if (error) throw error;

      await refetchStats();

      toast({
        title: "✅ Données sandbox supprimées",
        description: "Toutes les données de test ont été effacées",
      });
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <TestTube2 className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold">Environnement Sandbox</h1>
          <Badge className="bg-orange-500 text-white">Super Admin</Badge>
        </div>
        <p className="text-gray-600">
          Gérez les données fictives pour tester et développer les modules
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Générer les Données
            </CardTitle>
            <CardDescription>
              Créer 5 groupes scolaires fictifs avec écoles, utilisateurs, élèves et données complètes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Générer les Données Sandbox
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Supprimer les Données
            </CardTitle>
            <CardDescription>
              Effacer toutes les données sandbox (irréversible)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  size="lg"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Suppression en cours...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-5 w-5" />
                      Supprimer les Données Sandbox
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Confirmer la suppression
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est <strong>irréversible</strong>. Toutes les données sandbox seront
                    définitivement supprimées :
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Groupes scolaires fictifs</li>
                      <li>Écoles fictives</li>
                      <li>Utilisateurs fictifs</li>
                      <li>Élèves fictifs</li>
                      <li>Toutes les données associées</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Sandbox</CardTitle>
          <CardDescription>
            Nombre d'entités actuellement dans l'environnement de test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              icon={School}
              label="Groupes"
              value={stats?.school_groups || 0}
              color="blue"
            />
            <StatCard
              icon={School}
              label="Écoles"
              value={stats?.schools || 0}
              color="green"
            />
            <StatCard
              icon={Users}
              label="Utilisateurs"
              value={stats?.users || 0}
              color="purple"
            />
            <StatCard
              icon={GraduationCap}
              label="Élèves"
              value={stats?.students || 0}
              color="orange"
            />
            <StatCard
              icon={BookOpen}
              label="Classes"
              value={stats?.classes || 0}
              color="pink"
            />
            <StatCard
              icon={FileText}
              label="Inscriptions"
              value={stats?.inscriptions || 0}
              color="indigo"
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            📋 Comment Utiliser le Sandbox
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1️⃣ Générer les Données</h3>
            <p className="text-sm mb-2">Ouvrez un terminal dans le projet et exécutez :</p>
            <code className="block bg-blue-100 p-3 rounded font-mono text-sm">
              npm run generate:sandbox
            </code>
            <p className="text-xs mt-2 text-blue-700">
              ⏱️ Durée : environ 2 minutes • 📊 Résultat : 6,500+ élèves fictifs
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2️⃣ Tester les Modules</h3>
            <p className="text-sm">
              Développez et testez vos modules avec les données fictives. Tout est isolé et sécurisé.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3️⃣ Supprimer les Données</h3>
            <p className="text-sm">
              Une fois terminé, cliquez sur le bouton "Supprimer les Données Sandbox" ci-dessus.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informations */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <TestTube2 className="w-5 h-5" />
            À propos de l'environnement Sandbox
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-900 space-y-2">
          <p>
            <strong>Objectif :</strong> Permettre au Super Admin de développer et tester les modules
            avec des données réalistes sans affecter les données de production.
          </p>
          <p>
            <strong>Contenu :</strong> 5 groupes scolaires fictifs de différentes tailles (grand réseau,
            moyen, petit, international, rural) avec 3-5 écoles chacun, des utilisateurs de tous les rôles,
            des élèves, des classes, et des données complètes (inscriptions, notes, absences, etc.).
          </p>
          <p>
            <strong>Isolation :</strong> Toutes les données sandbox sont marquées avec{' '}
            <code className="bg-orange-200 px-1 rounded">is_sandbox = true</code> et sont visibles
            uniquement par le Super Admin.
          </p>
          <p>
            <strong>Utilisation :</strong> Développez vos modules, testez les fonctionnalités, validez
            l'UX, puis déployez en production une fois satisfait.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Carte de statistique
 */
interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-pink-100 text-pink-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg border">
      <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-2xl font-bold mt-2">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
