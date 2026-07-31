/**
 * Validation utilities for the application
 */

/**
 * Valide la robustesse d'un mot de passe (règle commune à l'inscription,
 * au reset de mot de passe et aux pages paramètres vendeur/livreur/client).
 * @returns null si valide, sinon un message d'erreur à afficher.
 */
export function validatePasswordStrength(value: string): string | null {
  if (value.length < 8) return "Le mot de passe doit contenir au moins 8 caractères."
  if (!/[A-Z]/.test(value)) return "Le mot de passe doit contenir au moins une majuscule."
  if (!/[0-9]/.test(value)) return "Le mot de passe doit contenir au moins un chiffre."
  return null
}

/**
 * Validates a Benin phone number format
 * @param phone - The phone number to validate (with or without +229 prefix)
 * @returns Object with isValid flag and formatted phone number
 */
export function validateBeninPhone(phone: string): {
  isValid: boolean
  formatted: string
  error?: string
} {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Retire l'indicatif pays (229) s'il est présent
  let phoneNumber = cleaned
  if (cleaned.startsWith('229') && cleaned.length > 3) {
    phoneNumber = cleaned.slice(3)
  }

  // Depuis le 30/11/2024, l'ARCEP a fait migrer tous les numéros béninois
  // (fixes et mobiles, tous opérateurs) de 8 à 10 chiffres, en ajoutant un
  // préfixe "01" commun devant l'ancien numéro. Les deux formats coexistent
  // encore chez les utilisateurs :
  //   - Ancien format à 8 chiffres : ex. 97001122
  //   - Nouveau format à 10 chiffres : ex. 0197001122
  // On accepte les deux et on normalise vers le nouveau format à 10 chiffres.
  //
  // NB: on ne filtre plus par liste de préfixes (ex. 01/02/97/98...) : cette
  // liste s'est révélée fausse et incomplète (les vrais préfixes attribués
  // couvrent 20-29, 40-69 et 90-99, tous opérateurs confondus — cf. décision
  // ARCEP n°2024-063), et toute liste figée finira par rejeter de vrais
  // numéros dès qu'une nouvelle tranche sera attribuée.
  let phoneNumber10: string

  if (phoneNumber.length === 10 && phoneNumber.startsWith('01')) {
    phoneNumber10 = phoneNumber
  } else if (phoneNumber.length === 8) {
    phoneNumber10 = `01${phoneNumber}`
  } else {
    return {
      isValid: false,
      formatted: '',
      error:
        'Numéro invalide. Utilise le format à 8 chiffres (ex. 97 00 11 22) ou à 10 chiffres avec le préfixe 01 (ex. 01 97 00 11 22).'
    }
  }

  // Format avec l'indicatif pays
  const formatted = `+229${phoneNumber10}`

  return {
    isValid: true,
    formatted
  }
}

/**
 * Formats a phone number for display
 * @param phone - The phone number to format (should include +229)
 * @returns Formatted phone number (e.g., +229 97 00 00 00)
 */
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  // Nouveau format ARCEP : indicatif (3) + numéro national à 10 chiffres = 13 chiffres
  if (cleaned.startsWith('229') && cleaned.length === 13) {
    const prefix = cleaned.slice(0, 3)
    const part1 = cleaned.slice(3, 5)
    const part2 = cleaned.slice(5, 7)
    const part3 = cleaned.slice(7, 9)
    const part4 = cleaned.slice(9, 11)
    const part5 = cleaned.slice(11, 13)
    return `${prefix} ${part1} ${part2} ${part3} ${part4} ${part5}`
  }

  // Compatibilité avec d'anciennes valeurs stockées au format 8 chiffres
  if (cleaned.startsWith('229') && cleaned.length === 11) {
    const prefix = cleaned.slice(0, 3)
    const part1 = cleaned.slice(3, 5)
    const part2 = cleaned.slice(5, 7)
    const part3 = cleaned.slice(7, 9)
    const part4 = cleaned.slice(9, 11)
    return `${prefix} ${part1} ${part2} ${part3} ${part4}`
  }

  return phone
}
