/**
 * International phone number data and helpers.
 *
 * Numbers are stored as E.164-like strings: +{dialCode}{localDigits},
 * e.g. "+995555123456". Legacy bare Georgian formats (5XXXXXXXX,
 * landline 32XXXXXX, optional 995 prefix) are still accepted when
 * validating stored values.
 */

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2 */
  code: string
  name: string
  flag: string
  /** Full dial code including leading +, e.g. "+995" */
  dialCode: string
  /** Regex that validates the LOCAL number (digits only, no country prefix) */
  pattern: RegExp
  /** Maximum number of digits in the local number */
  maxLocalLen: number
  /** Minimum number of digits in the local number */
  minLocalLen: number
  placeholder: string
  /** Digit group sizes for display formatting, e.g. [3,3,3] → "555 123 456" */
  formatGroups: number[]
}

/** Format raw digit string into spaced groups, e.g. "555123456" → "555 123 456" */
export function formatLocalDigits(digits: string, groups: number[]): string {
  let result = ''
  let pos = 0
  for (const size of groups) {
    if (pos >= digits.length) break
    if (pos > 0) result += ' '
    result += digits.slice(pos, pos + size)
    pos += size
  }
  return result
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  {
    code: 'GE',
    name: 'Georgia',
    flag: '🇬🇪',
    dialCode: '+995',
    pattern: /^5\d{8}$/,
    minLocalLen: 9,
    maxLocalLen: 9,
    placeholder: '555 123 456',
    formatGroups: [3, 3, 3],
  },
  {
    code: 'AM',
    name: 'Armenia',
    flag: '🇦🇲',
    dialCode: '+374',
    pattern: /^[1-9]\d{7}$/,
    minLocalLen: 8,
    maxLocalLen: 8,
    placeholder: '91 123 456',
    formatGroups: [2, 3, 3],
  },
  {
    code: 'AZ',
    name: 'Azerbaijan',
    flag: '🇦🇿',
    dialCode: '+994',
    pattern: /^[5-7]\d{8}$/,
    minLocalLen: 9,
    maxLocalLen: 9,
    placeholder: '50 123 4567',
    formatGroups: [2, 3, 4],
  },
  {
    code: 'TR',
    name: 'Turkey',
    flag: '🇹🇷',
    dialCode: '+90',
    pattern: /^5\d{9}$/,
    minLocalLen: 10,
    maxLocalLen: 10,
    placeholder: '531 234 5678',
    formatGroups: [3, 3, 4],
  },
  {
    code: 'RU',
    name: 'Russia',
    flag: '🇷🇺',
    dialCode: '+7',
    pattern: /^9\d{9}$/,
    minLocalLen: 10,
    maxLocalLen: 10,
    placeholder: '912 345 6789',
    formatGroups: [3, 3, 4],
  },
  {
    code: 'UA',
    name: 'Ukraine',
    flag: '🇺🇦',
    dialCode: '+380',
    pattern: /^[3-9]\d{8}$/,
    minLocalLen: 9,
    maxLocalLen: 9,
    placeholder: '67 123 4567',
    formatGroups: [2, 3, 4],
  },
  {
    code: 'US',
    name: 'USA',
    flag: '🇺🇸',
    dialCode: '+1',
    pattern: /^[2-9]\d{9}$/,
    minLocalLen: 10,
    maxLocalLen: 10,
    placeholder: '212 555 0100',
    formatGroups: [3, 3, 4],
  },
  {
    code: 'GB',
    name: 'UK',
    flag: '🇬🇧',
    dialCode: '+44',
    pattern: /^7\d{9}$/,
    minLocalLen: 10,
    maxLocalLen: 10,
    placeholder: '7911 123456',
    formatGroups: [4, 6],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    dialCode: '+49',
    pattern: /^1[5-7]\d{8,9}$/,
    minLocalLen: 10,
    maxLocalLen: 11,
    placeholder: '151 2345 6789',
    formatGroups: [3, 4, 4],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    dialCode: '+33',
    pattern: /^[67]\d{8}$/,
    minLocalLen: 9,
    maxLocalLen: 9,
    placeholder: '6 12 34 56 78',
    formatGroups: [1, 2, 2, 2, 2],
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    dialCode: '+39',
    pattern: /^3\d{8,9}$/,
    minLocalLen: 9,
    maxLocalLen: 10,
    placeholder: '312 345 678',
    formatGroups: [3, 3, 4],
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    dialCode: '+34',
    pattern: /^[67]\d{8}$/,
    minLocalLen: 9,
    maxLocalLen: 9,
    placeholder: '612 345 678',
    formatGroups: [3, 3, 3],
  },
  {
    code: 'IL',
    name: 'Israel',
    flag: '🇮🇱',
    dialCode: '+972',
    pattern: /^5\d{8}$/,
    minLocalLen: 9,
    maxLocalLen: 9,
    placeholder: '52 123 4567',
    formatGroups: [2, 3, 4],
  },
  {
    code: 'PL',
    name: 'Poland',
    flag: '🇵🇱',
    dialCode: '+48',
    pattern: /^[4-9]\d{8}$/,
    minLocalLen: 9,
    maxLocalLen: 9,
    placeholder: '512 345 678',
    formatGroups: [3, 3, 3],
  },
]

export const DEFAULT_COUNTRY = PHONE_COUNTRIES[0] // Georgia

export function findCountryByDialCode(dialCode: string): PhoneCountry | undefined {
  return PHONE_COUNTRIES.find((c) => c.dialCode === dialCode)
}

/**
 * Validates the local phone number (digits only, without country code).
 * Returns an error message or null if valid.
 */
export function validateLocalNumber(dialCode: string, localNumber: string): string | null {
  const digits = localNumber.replace(/\D/g, '')

  if (!digits) return 'Phone number is required'

  const country = findCountryByDialCode(dialCode)
  if (!country) return 'Unsupported country code'

  if (!country.pattern.test(digits)) {
    return `Invalid number for ${country.name} — expected format: ${country.placeholder}`
  }

  return null
}

/**
 * Builds full E.164-like string: +{dialCode}{localDigits}
 * e.g. buildE164("+995", "555 123 456") → "+995555123456"
 */
export function buildE164(dialCode: string, localNumber: string): string {
  const localDigits = localNumber.replace(/\D/g, '')
  return `${dialCode}${localDigits}`
}

/**
 * Parse a stored phone string into { dialCode, localNumber }.
 * Handles:
 *   - E.164 like "+995555123456"
 *   - Legacy bare 9-digit Georgian "555123456"
 */
export function parseStoredPhone(stored: string | null | undefined): { dialCode: string; localNumber: string } {
  if (!stored) return { dialCode: '+995', localNumber: '' }

  if (stored.startsWith('+')) {
    // Longest dial code first to avoid prefix collisions (+9 vs +995)
    const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
    for (const country of sorted) {
      if (stored.startsWith(country.dialCode)) {
        return { dialCode: country.dialCode, localNumber: stored.slice(country.dialCode.length).replace(/\D/g, '') }
      }
    }
  }

  const digits = stored.replace(/\D/g, '')
  if (digits.length === 9 && digits.startsWith('5')) {
    return { dialCode: '+995', localNumber: digits }
  }

  return { dialCode: '+995', localNumber: digits }
}

// Legacy Georgian formats kept for previously stored values:
// 5XX XXX XXX mobiles and area-code landlines, optional 995 prefix.
const legacyGeorgianPhoneRegex =
  /^(\+?995\s?)?(5\d{2}[\s-]?\d{3}[\s-]?\d{3}|5\d{8}|(32|42|43|31|41|34)\d{2}[\s-]?\d{2}[\s-]?\d{2}|(32|42|43|31|41|34)\d{6})$/

/**
 * Validates a full stored phone value. Accepts E.164 with a supported
 * dial code, or legacy Georgian formats. Used by server-side schemas —
 * keep in sync with what the PhoneInputField submits.
 */
export function isValidPhoneValue(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  if (trimmed.startsWith('+')) {
    const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
    for (const country of sorted) {
      if (trimmed.startsWith(country.dialCode)) {
        const local = trimmed.slice(country.dialCode.length).replace(/[\s-]/g, '')
        if (country.pattern.test(local)) return true
      }
    }
  }

  return legacyGeorgianPhoneRegex.test(trimmed)
}
