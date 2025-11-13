/**
 * Utilitaires pour formatter proprement les erreurs
 * @module error-utils
 */

type AnyError = unknown;

/**
 * Convertit n'importe quelle erreur en message lisible
 */
export const formatError = (error: AnyError): string => {
  if (!error) {
    return 'Erreur inconnue';
  }

  if (error instanceof Error) {
    return error.message || error.name || 'Erreur inconnue';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object') {
    const maybeMessage = (error as Record<string, unknown>).message;
    const maybeDescription = (error as Record<string, unknown>).error_description;

    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }

    if (typeof maybeDescription === 'string' && maybeDescription.trim().length > 0) {
      return maybeDescription;
    }

    try {
      return JSON.stringify(error, replacer, 2);
    } catch (jsonError) {
      console.error('❌ Impossible de sérialiser l\'erreur', jsonError);
      return 'Erreur non sérialisable';
    }
  }

  return String(error);
};

const replacer = () => {
  const seen = new WeakSet();
  return (_key: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[circular]';
      }
      seen.add(value);
    }
    return value;
  };
};
