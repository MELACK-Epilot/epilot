/**
 * Générateur de codes uniques pour les écoles
 * Évite les doublons en générant des codes basés sur le nom + timestamp
 */

import { supabase } from '@/lib/supabase';

/**
 * Génère un code unique pour une école
 * @param schoolName - Nom de l'école
 * @param schoolGroupId - ID du groupe scolaire
 * @returns Code unique généré
 */
export async function generateUniqueSchoolCode(
  schoolName: string, 
  schoolGroupId: string
): Promise<string> {
  // Nettoyer le nom de l'école pour créer un préfixe
  const cleanName = schoolName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Garder seulement lettres et chiffres
    .substring(0, 4); // Prendre les 4 premiers caractères

  // Générer un suffixe basé sur le timestamp
  const timestamp = Date.now().toString().slice(-4); // 4 derniers chiffres
  
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Créer le code candidat
    const candidateCode = attempts === 0 
      ? `${cleanName}${timestamp}` 
      : `${cleanName}${timestamp}${attempts}`;

    // Vérifier si le code existe déjà
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('id')
      .eq('code', candidateCode)
      .eq('school_group_id', schoolGroupId)
      .single();

    // Si le code n'existe pas, on peut l'utiliser
    if (!existingSchool) {
      return candidateCode;
    }

    attempts++;
  }

  // Fallback : utiliser un UUID court si tous les codes sont pris
  const fallbackCode = `SCH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  console.warn(`⚠️ Utilisation du code fallback: ${fallbackCode}`);
  return fallbackCode;
}

/**
 * Valide qu'un code d'école est unique
 * @param code - Code à vérifier
 * @param schoolGroupId - ID du groupe scolaire
 * @param excludeSchoolId - ID de l'école à exclure (pour les modifications)
 * @returns true si le code est unique
 */
export async function validateSchoolCodeUniqueness(
  code: string,
  schoolGroupId: string,
  excludeSchoolId?: string
): Promise<boolean> {
  let query = supabase
    .from('schools')
    .select('id')
    .eq('code', code)
    .eq('school_group_id', schoolGroupId);

  // Exclure l'école actuelle en cas de modification
  if (excludeSchoolId) {
    query = query.neq('id', excludeSchoolId);
  }

  const { data } = await query.single();
  
  // Le code est unique s'il n'y a pas de résultat
  return !data;
}

/**
 * Suggère des codes alternatifs si le code choisi existe déjà
 * @param baseCode - Code de base
 * @param schoolGroupId - ID du groupe scolaire
 * @returns Liste de codes alternatifs
 */
export async function suggestAlternativeCodes(
  baseCode: string,
  schoolGroupId: string
): Promise<string[]> {
  const suggestions: string[] = [];
  
  for (let i = 1; i <= 5; i++) {
    const alternative = `${baseCode}${i}`;
    const isUnique = await validateSchoolCodeUniqueness(alternative, schoolGroupId);
    
    if (isUnique) {
      suggestions.push(alternative);
    }
  }
  
  return suggestions;
}
