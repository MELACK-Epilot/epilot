/**
 * Hook personnalisé pour gérer la logique d'état des besoins
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase.types';
import type { CartItem, Resource, UploadedFile } from './resource-request.types';

export const useResourceRequest = () => {
  const { toast } = useToast();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Retirer du panier
  const removeFromCart = useCallback((resourceId: string) => {
    setCart(prevCart => prevCart.filter(item => item.resource.id !== resourceId));
  }, []);

  // Mettre à jour la quantité
  const updateQuantity = useCallback((resourceId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(resourceId);
      return;
    }
    setCart(prevCart => prevCart.map(item =>
      item.resource.id === resourceId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  }, [removeFromCart]);

  // Ajouter au panier
  const addToCart = useCallback((resource: Resource) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.resource.id === resource.id);
      if (existingItem) {
        // Mettre à jour la quantité directement
        return prevCart.map(item =>
          item.resource.id === resource.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast({
          title: "Ajouté au panier",
          description: `${resource.name} ajouté à votre état des besoins.`,
        });
        return [...prevCart, { 
          resource, 
          quantity: 1, 
          unitPrice: resource.estimatedPrice || 0,
          justification: '' 
        }];
      }
    });
  }, [toast]);

  // Mettre à jour la justification
  const updateJustification = useCallback((resourceId: string, justification: string) => {
    setCart(prevCart => prevCart.map(item =>
      item.resource.id === resourceId
        ? { ...item, justification }
        : item
    ));
  }, []);

  // Mettre à jour le prix unitaire
  const updateUnitPrice = useCallback((resourceId: string, newPrice: number) => {
    setCart(prevCart => prevCart.map(item =>
      item.resource.id === resourceId
        ? { ...item, unitPrice: newPrice }
        : item
    ));
  }, []);

  // Calculer le total
  const calculateTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      return total + item.unitPrice * item.quantity;
    }, 0);
  }, [cart]);

  // Upload fichier (simulation)
  const handleFileUpload = useCallback(() => {
    setUploadedFiles(prevFiles => {
      const newFile: UploadedFile = {
        id: Date.now().toString(),
        name: `Document_${prevFiles.length + 1}.pdf`,
        size: Math.floor(Math.random() * 5000000),
        type: 'application/pdf',
      };
      return [...prevFiles, newFile];
    });
  }, []);

  // Retirer fichier
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
  }, []);

  // Réinitialiser le formulaire
  const resetForm = useCallback(() => {
    setCart([]);
    setUploadedFiles([]);
    setGeneralNotes('');
  }, []);

  // Soumettre la demande
  const submitRequest = useCallback(async (onSuccess: () => void) => {
    if (cart.length === 0) {
      toast({
        title: "Panier vide",
        description: "Veuillez ajouter au moins une ressource à votre état des besoins.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // 1. Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // 2. Récupérer les infos de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('school_id, school_group_id')
        .eq('id', user.id)
        .single<{ school_id: string | null; school_group_id: string | null }>();

      if (userError) throw userError;
      if (!userData) throw new Error('Données utilisateur introuvables');
      if (!userData.school_id) throw new Error('Aucune école associée à votre compte');
      if (!userData.school_group_id) throw new Error('Aucun groupe scolaire associé à votre compte');

      // 3. Créer la demande principale
      const { data: request, error: requestError } = await supabase
        .from('resource_requests')
        .insert({
          school_id: userData.school_id,
          school_group_id: userData.school_group_id,
          requested_by: user.id,
          title: `État des besoins - ${new Date().toLocaleDateString('fr-FR')}`,
          description: generalNotes || null,
          notes: generalNotes || null,
          status: 'pending',
          priority: 'normal',
        })
        .select()
        .single();

      if (requestError) throw requestError;
      if (!request) throw new Error('Erreur lors de la création de la demande');

      // 4. Créer les items de la demande
      const items: Database['public']['Tables']['resource_request_items']['Insert'][] = cart.map(item => ({
        request_id: request.id,
        resource_name: item.resource.name,
        resource_category: item.resource.category,
        quantity: item.quantity,
        unit: item.resource.unit,
        unit_price: item.unitPrice,
        justification: item.justification || null,
      }));

      const { error: itemsError } = await supabase
        .from('resource_request_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // 5. Success
      toast({
        title: "État des besoins envoyé !",
        description: `Votre état des besoins (${cart.length} ressource(s)) a été transmis aux administrateurs.`,
      });

      // Reset
      resetForm();
      onSuccess();

    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer l'état des besoins. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [cart, generalNotes, toast, resetForm]);

  return {
    cart,
    uploadedFiles,
    generalNotes,
    isSending,
    setGeneralNotes,
    addToCart,
    updateQuantity,
    updateJustification,
    updateUnitPrice,
    removeFromCart,
    calculateTotal,
    handleFileUpload,
    removeFile,
    submitRequest,
    resetForm,
  };
};
