/**
 * Page affichée aux utilisateurs sans profil d'accès
 * Ils doivent attendre qu'un administrateur leur assigne un profil
 * 
 * ✅ Écoute en temps réel les changements de profil
 * 
 * @module ProfilePendingPage
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, UserCog, LogOut, RefreshCw, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/** Types de problèmes de configuration */
type ConfigIssue = 'NO_PROFILE' | 'NO_SCHOOL_GROUP' | 'BOTH_MISSING';

interface ProfilePendingPageProps {
  userName?: string;
  userEmail?: string;
  userId?: string;
  issue?: ConfigIssue;
}

/**
 * Page d'attente pour les utilisateurs sans profil d'accès assigné
 * Écoute en temps réel les changements de profil
 */
export const ProfilePendingPage = ({ userName, userEmail, userId, issue = 'NO_PROFILE' }: ProfilePendingPageProps) => {
  const { logout, user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [profileAssigned, setProfileAssigned] = useState(false);

  // ID utilisateur (depuis props ou store)
  const currentUserId = userId || user?.id;

  /**
   * Vérifier manuellement si un profil a été assigné
   */
  const checkForProfile = useCallback(async () => {
    if (!currentUserId) return;

    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('access_profile_code, school_group_id')
        .eq('id', currentUserId)
        .single();

      if (error) throw error;

      // Vérifier si la configuration est complète
      const hasProfile = !!data?.access_profile_code;
      const hasGroup = !!data?.school_group_id;
      
      if (hasProfile && hasGroup) {
        // Configuration complète !
        setProfileAssigned(true);
        toast.success('🎉 Configuration complète !', {
          description: 'Vous allez être redirigé vers votre espace de travail.',
        });
        
        if (user) {
          setUser({
            ...user,
            accessProfileCode: data.access_profile_code ?? undefined,
            schoolGroupId: data.school_group_id ?? undefined,
          });
        }

        // Rediriger après un court délai
        setTimeout(() => {
          navigate('/user', { replace: true });
        }, 1500);
      } else if (hasProfile && !hasGroup) {
        toast.info('Groupe scolaire non assigné. Contactez votre administrateur.');
      } else if (!hasProfile && hasGroup) {
        toast.info('Profil d\'accès non assigné. Contactez votre administrateur.');
      } else {
        toast.info('Configuration incomplète. Contactez votre administrateur.');
      }
    } catch (error) {
      console.error('Erreur vérification profil:', error);
      toast.error('Erreur lors de la vérification');
    } finally {
      setIsChecking(false);
    }
  }, [currentUserId, user, setUser, navigate]);

  /**
   * Écouter les changements en temps réel
   */
  useEffect(() => {
    if (!currentUserId) return;

    console.log('🔄 ProfilePendingPage: Écoute temps réel pour', currentUserId);

    // Souscrire aux changements de la table users pour cet utilisateur
    const channel = supabase
      .channel(`user-profile-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('📡 Changement détecté:', payload);
          
          const newProfile = payload.new?.access_profile_code;
          if (newProfile) {
            setProfileAssigned(true);
            toast.success('🎉 Profil assigné !', {
              description: 'Vous allez être redirigé vers votre espace de travail.',
            });

            // Mettre à jour le store et rediriger
            if (user) {
              setUser({
                ...user,
                accessProfileCode: newProfile,
              });
            }

            setTimeout(() => {
              navigate('/user', { replace: true });
            }, 1500);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    // Cleanup
    return () => {
      console.log('🔄 ProfilePendingPage: Désinscription');
      supabase.removeChannel(channel);
    };
  }, [currentUserId, user, setUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1D3557]/5 via-white to-[#2A9D8F]/5 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="p-8 shadow-2xl border-2 border-[#E9C46A]/30">
          {/* Icône animée */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-[#E9C46A] rounded-full blur-xl opacity-30"
              />
              <div className="relative bg-gradient-to-br from-[#E9C46A] to-[#F4A261] rounded-full p-5">
                <Clock className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Titre dynamique selon le problème */}
          <h1 className="text-2xl font-bold text-center text-[#1D3557] mb-2">
            {issue === 'NO_PROFILE' && 'Profil en attente d\'attribution'}
            {issue === 'NO_SCHOOL_GROUP' && 'Groupe scolaire non assigné'}
            {issue === 'BOTH_MISSING' && 'Configuration incomplète'}
          </h1>

          {/* Message de bienvenue */}
          {userName && (
            <p className="text-center text-gray-600 mb-4">
              Bienvenue, <span className="font-semibold text-[#2A9D8F]">{userName}</span> !
            </p>
          )}

          {/* Explication dynamique selon le problème */}
          <div className="bg-[#E9C46A]/10 border border-[#E9C46A]/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <UserCog className="h-5 w-5 text-[#E9C46A] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-2">Pourquoi ce message ?</p>
                {issue === 'NO_PROFILE' && (
                  <p className="text-gray-600">
                    Votre compte a été créé mais aucun <strong>profil d'accès</strong> ne vous a encore été attribué.
                    Un profil d'accès détermine les modules et fonctionnalités auxquels vous avez accès.
                  </p>
                )}
                {issue === 'NO_SCHOOL_GROUP' && (
                  <p className="text-gray-600">
                    Votre compte n'est pas encore rattaché à un <strong>groupe scolaire</strong>.
                    Cette association est nécessaire pour accéder à votre espace de travail.
                  </p>
                )}
                {issue === 'BOTH_MISSING' && (
                  <p className="text-gray-600">
                    Votre compte nécessite une configuration complète : un <strong>groupe scolaire</strong> et 
                    un <strong>profil d'accès</strong> doivent vous être attribués.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ce qu'il faut faire */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-2">
              📋 Que faire maintenant ?
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Contactez votre <strong>administrateur de groupe</strong></li>
              {issue === 'NO_PROFILE' && (
                <li>• Demandez-lui de vous assigner un <strong>profil d'accès</strong></li>
              )}
              {issue === 'NO_SCHOOL_GROUP' && (
                <li>• Demandez-lui de vous rattacher à un <strong>groupe scolaire</strong></li>
              )}
              {issue === 'BOTH_MISSING' && (
                <>
                  <li>• Demandez-lui de vous rattacher à un <strong>groupe scolaire</strong></li>
                  <li>• Demandez-lui de vous assigner un <strong>profil d'accès</strong></li>
                </>
              )}
              <li>• Une fois la configuration complète, actualisez cette page</li>
            </ul>
          </div>

          {/* Email de contact (si disponible) */}
          {userEmail && (
            <p className="text-center text-xs text-gray-500 mb-6">
              <Mail className="inline h-3 w-3 mr-1" />
              Connecté avec : {userEmail}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {profileAssigned ? (
              <Button
                disabled
                className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e]"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Redirection en cours...
              </Button>
            ) : (
              <Button
                onClick={checkForProfile}
                disabled={isChecking}
                className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1d7a6f]"
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isChecking ? 'Vérification...' : 'Vérifier mon profil'}
              </Button>
            )}
            
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              disabled={profileAssigned}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
          
          {/* Indicateur temps réel */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Écoute en temps réel active
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          E-Pilot Congo 🇨🇬 - Système de gestion scolaire
        </p>
      </motion.div>
    </div>
  );
};

export default ProfilePendingPage;
