// @ts-nocheck
/**
 * Hook pour gérer les utilisateurs (Administrateurs de Groupe)
 * @module useUsers
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  alertEmailAlreadyExists,
  alertInvalidEmail,
  alertWeakPassword,
  alertUserCreated,
  alertUserCreationFailed,
  alertUserUpdated,
  alertUserDeleted,
  alertLimitReached,
  alertOperationFailed,
} from '@/lib/alerts';
import { uploadAvatar } from '@/lib/avatar-utils';
import type { User } from '../types/dashboard.types';

/**
 * Clés de requête pour React Query
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

/**
 * Interface pour les filtres de recherche
 */
interface UserFilters {
  query?: string;
  status?: 'active' | 'inactive' | 'suspended';
  schoolGroupId?: string;
  schoolId?: string;
  role?: 'admin_groupe';
  page?: number;
  pageSize?: number;
  /** Désactive la requête si false */
  enabled?: boolean;
}

/**
 * Interface pour la réponse paginée
 */
export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Hook pour récupérer la liste des utilisateurs avec pagination
 * Scope Super Admin : uniquement les Administrateurs de Groupe
 */
export const useUsers = (filters?: UserFilters) => {
  const { enabled = true, ...queryFilters } = filters || {};
  
  return useQuery({
    queryKey: userKeys.list(queryFilters),
    queryFn: async () => {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('users')
        .select(
          `*,
          school_groups:school_group_id (
            id,
            name,
            code
          )`
        , { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // FILTRAGE SELON LE RÔLE
      if (filters?.schoolGroupId) {
        // Admin Groupe : Voir TOUS les utilisateurs de son groupe
        // (Admin Groupe, Proviseurs, Directeurs, Enseignants, CPE, Comptables, etc.)
        // MAIS exclure le Super Admin (qui ne fait pas partie du groupe)
        query = query
          .eq('school_group_id', filters.schoolGroupId)
          .neq('role', 'super_admin');
      } else {
        // Super Admin : Voir Super Admin ET Admin Groupe uniquement
        query = query.in('role', ['super_admin', 'admin_groupe']);
      }

      // Filtre par école
      if (filters?.schoolId) {
        query = query.eq('school_id', filters.schoolId);
      }

      // Filtres (adaptés pour profiles)
      if (filters?.query) {
        query = query.or(`first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Récupérer les IDs d'écoles uniques
      const schoolIds = [...new Set((data || [])
        .map((u: any) => u.school_id)
        .filter(Boolean))];

      // Récupérer les noms des écoles si nécessaire
      let schoolsMap: Record<string, string> = {};
      if (schoolIds.length > 0) {
        const { data: schoolsData } = await supabase
          .from('schools')
          .select('id, name')
          .in('id', schoolIds);
        
        if (schoolsData) {
          schoolsMap = Object.fromEntries(
            schoolsData.map((s: any) => [s.id, s.name])
          );
        }
      }

      // Récupérer le nombre de modules assignés pour chaque utilisateur
      const userIds = (data || []).map((u: any) => u.id);
      let modulesCountMap: Record<string, number> = {};
      
      if (userIds.length > 0) {
        const { data: permissionsData } = await (supabase as any)
          .from('user_module_permissions')
          .select('user_id')
          .in('user_id', userIds);
        
        if (permissionsData) {
          // Compter les modules par utilisateur
          permissionsData.forEach((p: any) => {
            modulesCountMap[p.user_id] = (modulesCountMap[p.user_id] || 0) + 1;
          });
        }
      }

      // Transformer les données depuis users
      const users = (data || []).map((user: any) => {
        // Source de vérité unique pour l'avatar
        const avatarValue = user.avatar || null;

        return {
        id: user.id,
        firstName: user.first_name || 'Utilisateur',
        lastName: user.last_name || '',
        email: user.email,
        phone: user.phone,
        avatar: avatarValue,
        gender: user.gender || undefined,
        dateOfBirth: user.date_of_birth || undefined,
        role: (user.role || 'admin_groupe') as User['role'],
        accessProfileCode: user.access_profile_code || undefined, // ✅ AJOUT: Profil d'accès
        schoolGroupId: user.school_group_id || undefined,
        schoolGroupName: user.role === 'super_admin'
          ? 'Administrateur Système E-Pilot'
          : user.school_groups?.name || 'Non assigné',
        schoolId: user.school_id || undefined,
        schoolName: user.school_id ? schoolsMap[user.school_id] || undefined : undefined,
        status: user.status || 'inactive',
        lastLogin: user.last_login || undefined,
        assignedModulesCount: modulesCountMap[user.id] || 0,
        lastLoginAt: user.last_login || undefined,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        };
      }) as User[];

      // Retourner avec métadonnées de pagination
      return {
        users,
        total: count || 0,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 20,
        totalPages: Math.ceil((count || 0) / (filters?.pageSize || 20)),
      } as PaginatedUsers;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled, // Permet de désactiver la requête conditionnellement
  });
};

/**
 * Hook pour activer le temps réel sur les utilisateurs
 * Écoute les changements INSERT, UPDATE, DELETE sur la table users
 */
export const useUsersRealtime = (filters?: UserFilters) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // S'abonner aux changements sur la table users
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('🔄 Changement détecté sur users:', payload);
          
          // Invalider le cache pour forcer un refetch
          queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        }
      )
      .subscribe();

    // Cleanup à la destruction du composant
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, filters]);
};

/**
 * Hook pour récupérer un utilisateur par ID
 */
export const useUser = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          school_groups:school_group_id (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        schoolGroupId: data.school_group_id,
        schoolGroupName: data.school_groups?.name || 'N/A',
        status: data.status,
        lastLogin: data.last_login,
        avatar: data.avatar || data.avatar_path || data.avatar_url || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as User;
    },
    enabled: !!id,
  });
};

/**
 * Interface pour créer un utilisateur
 */
interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolGroupId?: string; // Optionnel pour Super Admin
  schoolId?: string; // École d'affectation
  password: string;
  sendWelcomeEmail?: boolean;
  role?: string; // Type large pour inclure tous les rôles
  accessProfileCode?: string; // ✅ Profil d'accès pour modules
  avatarFile?: File | null;
  gender?: 'M' | 'F';
  dateOfBirth?: string;
}

/**
 * Hook pour créer un utilisateur
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      // ============================================
      // 1. VÉRIFIER SI L'EMAIL EXISTE DÉJÀ
      // ============================================
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, status')
        .eq('email', input.email.toLowerCase().trim())
        .maybeSingle();

      if (checkError) {
        console.error('❌ Erreur vérification email:', checkError);
      }

      if (existingUser) {
        const userName = `${existingUser.first_name || ''} ${existingUser.last_name || ''}`.trim();
        const statusLabel = existingUser.status === 'active' ? 'actif' : 
                           existingUser.status === 'inactive' ? 'inactif' : 'suspendu';
        
        // Afficher l'alerte avec les détails de l'utilisateur existant
        alertEmailAlreadyExists(input.email, userName, existingUser.status);
        
        throw new Error(
          `L'email "${input.email}" est déjà utilisé par ${userName || 'un utilisateur'} (compte ${statusLabel}). ` +
          `Veuillez utiliser une autre adresse email ou réactiver le compte existant.`
        );
      }

      // ============================================
      // 2. VÉRIFIER LA LIMITE D'UTILISATEURS
      // ============================================
      if (input.schoolGroupId) {
        const { data: limitCheck, error: limitError } = await supabase.rpc('check_plan_limit', {
          p_school_group_id: input.schoolGroupId,
          p_resource_type: 'users',
        } as any);

        if (limitError) {
          console.error('❌ Erreur vérification limite:', limitError);
          throw limitError;
        }

        const result = Array.isArray(limitCheck) ? limitCheck[0] : limitCheck;

        // ❌ BLOQUER SI LIMITE ATTEINTE
        if (result && !result.allowed) {
          throw new Error(result.message);
        }
      }

      // ============================================
      // 3. CRÉER L'UTILISATEUR DANS SUPABASE AUTH
      // ============================================
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email.toLowerCase().trim(),
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
            role: input.role || 'admin_groupe',
          },
        },
      });

      if (authError) {
        // ✅ Messages d'erreur personnalisés avec alertes modernes
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          alertEmailAlreadyExists(input.email);
          throw new Error(`L'email "${input.email}" est déjà enregistré dans le système d'authentification.`);
        }
        
        if (authError.message.includes('invalid email')) {
          alertInvalidEmail(input.email);
          throw new Error(`L'adresse email "${input.email}" n'est pas valide. Vérifiez le format.`);
        }
        
        if (authError.message.includes('password')) {
          alertWeakPassword();
          throw new Error(
            'Le mot de passe ne respecte pas les critères de sécurité : ' +
            '8 caractères minimum, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.'
          );
        }
        
        // Erreur générique
        const cleanMessage = authError.message.replace(/^Error:\s*/i, '');
        alertUserCreationFailed(cleanMessage);
        throw new Error(cleanMessage || 'Erreur lors de la création du compte utilisateur.');
      }

      let avatarPath: string | null = null;

      if (input.avatarFile && authData.user?.id) {
        try {
          avatarPath = await uploadAvatar(authData.user.id, input.avatarFile);
        } catch (uploadError) {
          console.error('Erreur upload avatar:', uploadError);
        }
      }

      // 2. Créer l'enregistrement dans la table users
      // Préparer les données avec gestion des ENUM et contraintes
      const insertData: Record<string, any> = {
        id: authData.user?.id,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        role: input.role || 'admin_groupe',
        access_profile_code: input.accessProfileCode || null, // ✅ Profil d'accès ajouté
        status: 'active',
        avatar: avatarPath,
      };

      // Gestion du school_group_id selon le rôle (respecter les contraintes CHECK)
      // Note : La validation est déjà faite dans le formulaire (UnifiedUserFormDialog)
      if (input.role === 'admin_groupe') {
        // Admin groupe DOIT avoir un school_group_id
        insertData.school_group_id = input.schoolGroupId || null;
      } else if (input.role === 'super_admin') {
        // Super admin ne DOIT PAS avoir de school_group_id (contrainte CHECK)
        insertData.school_group_id = null;
      } else {
        // Autres rôles : optionnel
        insertData.school_group_id = input.schoolGroupId || null;
      }

      // Gestion du school_id (école d'affectation)
      if (input.schoolId) {
        insertData.school_id = input.schoolId;
      }

      // Ajouter gender seulement si valide (ENUM: 'M' ou 'F')
      if (input.gender && (input.gender === 'M' || input.gender === 'F')) {
        insertData.gender = input.gender;
      }
      
      // Ajouter date_of_birth seulement si fournie
      if (input.dateOfBirth && input.dateOfBirth !== '') {
        insertData.date_of_birth = input.dateOfBirth;
      }

      // @ts-expect-error - Supabase types auto-générés non disponibles
      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Erreur insertion users:', error);
        throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
      }

      // ✅ INCRÉMENTER LE COMPTEUR D'UTILISATEURS (via fonction SQL)
      if (input.schoolGroupId) {
        // Déterminer si c'est un étudiant ou staff
        const isStudent = input.role === 'eleve';
        const resourceType = isStudent ? 'students' : 'staff';
        
        await supabase.rpc('increment_resource_count', {
          p_school_group_id: input.schoolGroupId,
          p_resource_type: resourceType,
          p_increment: 1,
        } as any);
      }

      // 3. Envoyer email de bienvenue (optionnel)
      if (input.sendWelcomeEmail) {
        // TODO: Implémenter l'envoi d'email
        console.log('Email de bienvenue envoyé à', input.email);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      // ✅ Alerte de succès moderne
      const userName = `${variables.firstName} ${variables.lastName}`;
      alertUserCreated(userName);
    },
    onError: (error: any) => {
      // ✅ Alerte d'erreur si pas déjà affichée
      if (!error.message.includes('déjà utilisé') && !error.message.includes('pas valide')) {
        alertUserCreationFailed(error.message);
      }
    },
  });
};

/**
 * Interface pour mettre à jour un utilisateur
 */
interface UpdateUserInput {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string; // ✅ AJOUT : Permettre la mise à jour du rôle
  accessProfileCode?: string; // ✅ AJOUT : Profil d'accès
  schoolGroupId?: string;
  schoolId?: string; // École d'affectation
  status?: 'active' | 'inactive' | 'suspended';
  avatarFile?: File | null;
  avatarRemoved?: boolean;
  gender?: 'M' | 'F';
  dateOfBirth?: string;
}

/**
 * Hook pour mettre à jour un utilisateur
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const { id, ...updates } = input;

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.accessProfileCode !== undefined) updateData.access_profile_code = updates.accessProfileCode;
      if (updates.schoolGroupId !== undefined) updateData.school_group_id = updates.schoolGroupId;
      if (updates.schoolId !== undefined) updateData.school_id = updates.schoolId;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.gender !== undefined) updateData.gender = updates.gender;
      if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth;

      if (updates.avatarFile) {
        const path = await uploadAvatar(id, updates.avatarFile);
        updateData.avatar = path;
      } else if (updates.avatarRemoved) {
        updateData.avatar = null;
      }

      // @ts-expect-error - Supabase types auto-générés non disponibles
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    // ✅ OPTIMISTIC UPDATE: Mise à jour immédiate de l'UI avant la réponse serveur
    onMutate: async (newUser) => {
      // Annuler les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      
      // Sauvegarder l'état précédent pour rollback en cas d'erreur
      const previousUsers = queryClient.getQueryData(userKeys.lists());
      
      // Mettre à jour optimistiquement le cache
      queryClient.setQueriesData({ queryKey: userKeys.lists() }, (old: any) => {
        if (!old?.users) return old;
        
        return {
          ...old,
          users: old.users.map((user: any) =>
            user.id === newUser.id
              ? {
                  ...user,
                  firstName: newUser.firstName ?? user.firstName,
                  lastName: newUser.lastName ?? user.lastName,
                  email: newUser.email ?? user.email,
                  phone: newUser.phone ?? user.phone,
                  role: newUser.role ?? user.role,
                  accessProfileCode: newUser.accessProfileCode ?? user.accessProfileCode,
                  status: newUser.status ?? user.status,
                  gender: newUser.gender ?? user.gender,
                  dateOfBirth: newUser.dateOfBirth ?? user.dateOfBirth,
                  updatedAt: new Date().toISOString(),
                }
              : user
          ),
        };
      });
      
      return { previousUsers };
    },
    onSuccess: (data, variables) => {
      // Invalider les caches pour refetch les données fraîches
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      
      // ✅ Alerte de succès moderne
      const userName = `${variables.firstName || data.first_name} ${variables.lastName || data.last_name}`;
      alertUserUpdated(userName);
    },
    onError: (error: any, newUser, context) => {
      // ✅ ROLLBACK: Restaurer l'état précédent en cas d'erreur
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers);
      }
      
      // ✅ Alerte d'erreur
      alertOperationFailed('modifier', 'l\'utilisateur', error.message);
    },
    // ✅ TOUJOURS refetch après succès ou erreur pour garantir la cohérence
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

/**
 * Hook pour supprimer un utilisateur (hard delete - suppression définitive) avec optimistic update
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Récupérer le nom de l'utilisateur avant suppression
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', id)
        .single();

      // Hard delete : suppression définitive
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { id, userName: userData ? `${userData.first_name} ${userData.last_name}` : 'Utilisateur' };
    },
    // Optimistic update : mise à jour immédiate de l'UI
    onMutate: async (id: string) => {
      // Annuler les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });

      // Snapshot de l'état actuel pour rollback
      const previousData = queryClient.getQueriesData({ queryKey: userKeys.lists() });

      // Mise à jour optimiste : retirer l'utilisateur de la liste
      queryClient.setQueriesData({ queryKey: userKeys.lists() }, (old: any) => {
        if (!old) return old;
        
        // Si c'est une réponse paginée
        if (old.users) {
          return {
            ...old,
            users: old.users.filter((user: User) => user.id !== id),
            total: (old.total || 0) - 1,
          };
        }
        
        // Si c'est un tableau simple
        return old.filter((user: User) => user.id !== id);
      });

      return { previousData };
    },
    // Rollback en cas d'erreur
    onError: (err: any, id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // ✅ Alerte d'erreur
      alertOperationFailed('supprimer', 'l\'utilisateur', err.message);
    },
    onSuccess: (data) => {
      // ✅ Alerte de succès
      alertUserDeleted(data.userName);
    },
    // Refetch pour synchroniser avec le serveur
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

/**
 * Hook pour réinitialiser le mot de passe
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true };
    },
  });
};

/**
 * Hook pour obtenir les statistiques des utilisateurs
 */
export const useUserStats = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['user-stats', schoolGroupId],
    queryFn: async () => {
      // Total utilisateurs
      let totalQuery = supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (schoolGroupId) {
        // Admin Groupe : compter TOUS les utilisateurs de son groupe
        totalQuery = totalQuery.eq('school_group_id', schoolGroupId);
      } else {
        // Super Admin : compter uniquement Super Admin + Admin Groupe
        totalQuery = totalQuery.in('role', ['super_admin', 'admin_groupe']);
      }
      
      const { count: total, error: totalError } = await totalQuery;

      if (totalError) throw totalError;

      // Utilisateurs actifs
      let activeQuery = supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (schoolGroupId) {
        activeQuery = activeQuery.eq('school_group_id', schoolGroupId);
      } else {
        activeQuery = activeQuery.in('role', ['super_admin', 'admin_groupe']);
      }
      
      const { count: active, error: activeError } = await activeQuery;

      if (activeError) throw activeError;

      // Utilisateurs inactifs
      let inactiveQuery = supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inactive');
      
      if (schoolGroupId) {
        inactiveQuery = inactiveQuery.eq('school_group_id', schoolGroupId);
      } else {
        inactiveQuery = inactiveQuery.in('role', ['super_admin', 'admin_groupe']);
      }
      
      const { count: inactive, error: inactiveError } = await inactiveQuery;

      if (inactiveError) throw inactiveError;

      // Utilisateurs suspendus
      let suspendedQuery = supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'suspended');
      
      if (schoolGroupId) {
        suspendedQuery = suspendedQuery.eq('school_group_id', schoolGroupId);
      } else {
        suspendedQuery = suspendedQuery.in('role', ['super_admin', 'admin_groupe']);
      }
      
      const { count: suspended, error: suspendedError } = await suspendedQuery;

      if (suspendedError) throw suspendedError;

      return {
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
        suspended: suspended || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook pour obtenir l'évolution des utilisateurs (12 derniers mois)
 */
export const useUserEvolutionStats = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['user-evolution', schoolGroupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_evolution_stats', { p_school_group_id: schoolGroupId || null });

      if (error) {
        console.error('❌ Erreur evolution stats:', error);
        throw error;
      }

      console.log('📊 Evolution stats raw:', data);
      
      // La fonction SQL retourne un JSON, pas un tableau directement
      // Supabase peut retourner data directement comme tableau si la fonction retourne JSON
      const result = Array.isArray(data) ? data : [];
      console.log('📊 Evolution stats parsed:', result);
      
      return result as { month_label: string; user_count: number }[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook pour obtenir la répartition des utilisateurs (par école ou groupe)
 */
export const useUserDistributionStats = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['user-distribution', schoolGroupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_distribution_stats', { p_school_group_id: schoolGroupId || null });

      if (error) {
        console.error('❌ Erreur distribution stats:', error);
        throw error;
      }

      console.log('📊 Distribution stats raw:', data);
      
      const result = Array.isArray(data) ? data : [];
      console.log('📊 Distribution stats parsed:', result);
      
      return result as { name: string; value: number }[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
