/**
 * Générateur de codes d'écoles
 * Fonctions utilitaires pour créer des codes uniques d'écoles
 * Pour Administrateur Groupe Scolaire
 */

import { supabase } from '@/lib/supabase';

/**
 * Génère un code unique pour une école basé sur son nom
 * Format : [GroupeCode]-[AutoIncrement]-[NomCourt]
 * Exemple : EP-BZV-001-SAINTJOSEPH
 *
 * @param schoolName - Nom de l'école
 * @param schoolGroupId - ID du groupe scolaire
 * @returns Code unique pour l'école
 */
export async function generateUniqueSchoolCode(
  schoolName: string,
  schoolGroupId: string
): Promise<string> {
  try {
    // 1. Récupérer le code du groupe scolaire
    const { data: groupData, error: groupError } = await supabase
      .from('school_groups')
      .select('code')
      .eq('id', schoolGroupId)
      .single();

    if (groupError || !groupData) {
      throw new Error('Impossible de récupérer le code du groupe scolaire');
    }

    const groupCode = groupData.code;

    // 2. Créer un nom court (max 10 caractères, sans espaces spéciaux)
    const shortName = schoolName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Garder seulement lettres et chiffres
      .substring(0, 10); // Limiter à 10 caractères

    // 3. Générer un numéro incrémental unique
    let counter = 1;
    let uniqueCode = '';
    let isUnique = false;

    while (!isUnique) {
      // Format : GROUPE-XXX-NOMCOURT
      uniqueCode = `${groupCode}-${counter.toString().padStart(3, '0')}-${shortName}`;

      // Vérifier l'unicité
      isUnique = await validateSchoolCodeUniqueness(uniqueCode, schoolGroupId);

      if (!isUnique) {
        counter++;
        // Limite de sécurité pour éviter une boucle infinie
        if (counter > 999) {
          // Fallback : utiliser un timestamp
          const timestamp = Date.now().toString().slice(-6);
          uniqueCode = `${groupCode}-${timestamp}-${shortName}`;
          break;
        }
      }
    }

    return uniqueCode;
  } catch (error) {
    console.error('Erreur lors de la génération du code d\'école:', error);

    // Fallback : code générique avec timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `ECO-${timestamp}`;
  }
}

/**
 * Vérifie si un code d'école est unique dans le groupe scolaire
 *
 * @param code - Code à vérifier
 * @param schoolGroupId - ID du groupe scolaire
 * @returns true si le code est unique, false sinon
 */
export async function validateSchoolCodeUniqueness(
  code: string,
  schoolGroupId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('id')
      .eq('code', code)
      .eq('school_group_id', schoolGroupId)
      .limit(1);

    if (error) {
      console.error('Erreur lors de la vérification d\'unicité:', error);
      // En cas d'erreur, considérer comme non unique pour être prudent
      return false;
    }

    // Si on trouve des résultats, le code n'est pas unique
    return !data || data.length === 0;
  } catch (error) {
    console.error('Erreur lors de la vérification d\'unicité:', error);
    return false;
  }
}

/**
 * Valide le format d'un code d'école
 * Format attendu : [GroupeCode]-[XXX]-[NomCourt]
 * Où XXX est un nombre sur 3 chiffres
 *
 * @param code - Code à valider
 * @returns true si le format est valide, false sinon
 */
export function validateSchoolCodeFormat(code: string): boolean {
  // Regex pour valider le format : XXX-XXX-XXXXX (au moins 3-3-5 caractères)
  const codeRegex = /^[A-Z0-9-]+-\d{3}-[A-Z0-9]+$/;

  if (!codeRegex.test(code)) {
    return false;
  }

  // Vérifier que le code n'est pas trop long (max 50 caractères)
  if (code.length > 50) {
    return false;
  }

  // Vérifier qu'il n'y a pas d'espaces
  if (code.includes(' ')) {
    return false;
  }

  return true;
}

/**
 * Extrait des informations d'un code d'école
 *
 * @param code - Code d'école
 * @returns Objet avec les informations extraites ou null si format invalide
 */
export function parseSchoolCode(code: string): {
  groupCode: string;
  number: number;
  shortName: string;
} | null {
  if (!validateSchoolCodeFormat(code)) {
    return null;
  }

  const parts = code.split('-');
  if (parts.length < 3) {
    return null;
  }

  // Tout sauf le dernier élément et l'avant-dernier = groupCode
  const groupCode = parts.slice(0, -2).join('-');
  const number = parseInt(parts[parts.length - 2], 10);
  const shortName = parts[parts.length - 1];

  if (isNaN(number)) {
    return null;
  }

  return {
    groupCode,
    number,
    shortName,
  };
}

/**
 * Génère plusieurs codes d'écoles à la fois
 * Utile pour l'import en masse
 *
 * @param schoolNames - Liste des noms d'écoles
 * @param schoolGroupId - ID du groupe scolaire
 * @returns Liste des codes générés
 */
export async function generateMultipleSchoolCodes(
  schoolNames: string[],
  schoolGroupId: string
): Promise<string[]> {
  const codes: string[] = [];

  for (const name of schoolNames) {
    try {
      const code = await generateUniqueSchoolCode(name, schoolGroupId);
      codes.push(code);
    } catch (error) {
      console.error(`Erreur génération code pour "${name}":`, error);
      // Utiliser un code de fallback
      const timestamp = Date.now().toString().slice(-6);
      codes.push(`ECO-${timestamp}`);
    }
  }

  return codes;
}

/**
 * Nettoie un nom d'école pour créer un nom court valide
 *
 * @param schoolName - Nom original de l'école
 * @returns Nom court nettoyé
 */
export function cleanSchoolNameForCode(schoolName: string): string {
  return schoolName
    .toUpperCase()
    .normalize('NFD') // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^A-Z0-9]/g, '') // Garder seulement lettres et chiffres
    .substring(0, 10); // Limiter à 10 caractères
}

/**
 * Vérifie si un code d'école peut être utilisé
 * Combine la validation de format et l'unicité
 *
 * @param code - Code à vérifier
 * @param schoolGroupId - ID du groupe scolaire
 * @returns true si le code est valide et unique
 */
export async function canUseSchoolCode(
  code: string,
  schoolGroupId: string
): Promise<{ valid: boolean; reason?: string }> {
  // Vérifier le format
  if (!validateSchoolCodeFormat(code)) {
    return {
      valid: false,
      reason: 'Format de code invalide. Utilisez le format : GROUPE-XXX-NOM',
    };
  }

  // Vérifier l'unicité
  const isUnique = await validateSchoolCodeUniqueness(code, schoolGroupId);
  if (!isUnique) {
    return {
      valid: false,
      reason: 'Ce code est déjà utilisé dans votre groupe scolaire',
    };
  }

  return { valid: true };
}
