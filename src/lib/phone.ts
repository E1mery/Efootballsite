/**
 * Phone Number Normalization and Duplicate Detection Utility
 * Standardizes Rwandan and International phone numbers for WhatsApp coordination.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  coreKey: string;
  error?: string;
}

/**
 * Normalizes a phone number to standard international format (E.164 without symbols except leading +).
 * Supports Rwandan mobile numbers (078, 079, 072, 073) and international numbers.
 *
 * Examples:
 * - "0790842945" -> "+250790842945" (coreKey: "790842945")
 * - "+250 788 123 456" -> "+250788123456" (coreKey: "788123456")
 * - "250790563492" -> "+250790563492" (coreKey: "790563492")
 * - "788123456" -> "+250788123456" (coreKey: "788123456")
 * - "+63 927 505 4514" -> "+639275054514" (coreKey: "639275054514")
 */
export function normalizePhoneNumber(rawPhone: string | null | undefined): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== "string") {
    return {
      isValid: false,
      formatted: "",
      coreKey: "",
      error: "Phone number is required.",
    };
  }

  // Remove whitespace, dashes, parentheses, dots
  const trimmed = rawPhone.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (digitsOnly.length < 8) {
    return {
      isValid: false,
      formatted: "",
      coreKey: "",
      error: "Phone number is too short. Please provide a valid mobile or WhatsApp number.",
    };
  }

  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      formatted: "",
      coreKey: "",
      error: "Phone number is too long. Standard phone numbers cannot exceed 15 digits.",
    };
  }

  // 1. Rwandan format checks
  // Standard Rwandan mobile numbers: 9 subscriber digits starting with 7 (e.g. 78..., 79..., 72..., 73...)
  // Variations:
  // - 12 digits: starts with "2507" -> e.g. "250788123456"
  // - 10 digits: starts with "07" -> e.g. "0788123456"
  // - 9 digits: starts with "7" -> e.g. "788123456"
  if (digitsOnly.startsWith("2507") && digitsOnly.length === 12) {
    const subscriber = digitsOnly.slice(3); // 9 digits
    return {
      isValid: true,
      formatted: `+250${subscriber}`,
      coreKey: subscriber,
    };
  }

  if (digitsOnly.startsWith("07") && digitsOnly.length === 10) {
    const subscriber = digitsOnly.slice(1); // 9 digits
    return {
      isValid: true,
      formatted: `+250${subscriber}`,
      coreKey: subscriber,
    };
  }

  if (digitsOnly.startsWith("7") && digitsOnly.length === 9) {
    return {
      isValid: true,
      formatted: `+250${digitsOnly}`,
      coreKey: digitsOnly,
    };
  }

  // 2. Generic International Format
  // If user included a leading + or international code:
  if (trimmed.startsWith("+")) {
    return {
      isValid: true,
      formatted: `+${digitsOnly}`,
      // For general numbers, the core key is the last 9 digits or the full digits if shorter
      coreKey: digitsOnly.length >= 9 ? digitsOnly.slice(-9) : digitsOnly,
    };
  }

  // If starts with 250 but not followed by 7 (rare Rwandan landline or edge case)
  if (digitsOnly.startsWith("250") && digitsOnly.length >= 10) {
    return {
      isValid: true,
      formatted: `+${digitsOnly}`,
      coreKey: digitsOnly.slice(-9),
    };
  }

  // Default fallback: assume international without plus or format as +digits
  return {
    isValid: true,
    formatted: `+${digitsOnly}`,
    coreKey: digitsOnly.length >= 9 ? digitsOnly.slice(-9) : digitsOnly,
  };
}

/**
 * Checks whether two phone number strings refer to the exact same phone number.
 */
export function isSamePhoneNumber(phoneA: string | null | undefined, phoneB: string | null | undefined): boolean {
  if (!phoneA || !phoneB) return false;

  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);

  if (!normA.isValid || !normB.isValid) return false;

  // 1. Direct formatted match (e.g. "+250788123456" === "+250788123456")
  if (normA.formatted === normB.formatted) {
    return true;
  }

  // 2. Core key match (e.g. Rwandan 9-digit subscriber number matches across formats)
  if (normA.coreKey && normB.coreKey && normA.coreKey === normB.coreKey) {
    return true;
  }

  // 3. Raw digits match
  const digitsA = phoneA.replace(/\D/g, "");
  const digitsB = phoneB.replace(/\D/g, "");
  if (digitsA.length >= 9 && digitsB.length >= 9) {
    if (digitsA.slice(-9) === digitsB.slice(-9)) {
      return true;
    }
  }

  return false;
}
