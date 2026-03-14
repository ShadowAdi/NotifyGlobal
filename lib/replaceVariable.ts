
/**
 * Replace {{variable}} placeholders in text with contact data.
 * Supports: {{name}}, {{email}}, {{language}}, {{discord_username}},
 * and any key from the contact's metadata object.
 */
export function replaceVariables(
    text: string,
    contact: { name: string; email: string; language: string; metadata: unknown }
): string {
    const metadata = (contact.metadata ?? {}) as Record<string, unknown>;

    const variables: Record<string, string> = {
        name: contact.name,
        email: contact.email,
        language: contact.language,
        ...Object.fromEntries(
            Object.entries(metadata).map(([k, v]) => [k, String(v ?? "")])
        ),
    };

    return text.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
        const trimmed = key.trim();
        return variables[trimmed] ?? match; // keep placeholder if no value
    });
}