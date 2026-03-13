/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates language code (ISO 639-1 format)
 */
export function isValidLanguageCode(code: string): boolean {
    // Basic validation for 2-letter ISO codes
    return /^[a-z]{2}$/i.test(code);
}

/**
 * Validates bulk contact data
 */
export function validateBulkContacts(contacts: any[]): { valid: any[], invalid: any[], errors: string[] } {
    const valid: any[] = [];
    const invalid: any[] = [];
    const errors: string[] = [];

    contacts.forEach((contact, index) => {
        const contactErrors: string[] = [];

        if (!contact.name || typeof contact.name !== 'string' || contact.name.trim() === '') {
            contactErrors.push(`Contact ${index + 1}: Name is required`);
        }

        if (!contact.email || typeof contact.email !== 'string') {
            contactErrors.push(`Contact ${index + 1}: Email is required`);
        } else if (!isValidEmail(contact.email)) {
            contactErrors.push(`Contact ${index + 1}: Invalid email format`);
        }

        if (contact.language && !isValidLanguageCode(contact.language)) {
            contactErrors.push(`Contact ${index + 1}: Invalid language code (use 2-letter ISO code like 'en', 'es')`);
        }

        if (contactErrors.length > 0) {
            invalid.push({ ...contact, rowIndex: index + 1 });
            errors.push(...contactErrors);
        } else {
            valid.push(contact);
        }
    });

    return { valid, invalid, errors };
}
