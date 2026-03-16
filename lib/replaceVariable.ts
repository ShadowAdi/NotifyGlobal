
/**
 * Replace {{variable}} placeholders in text with contact data.
 * Supports: {{name}}, {{email}}, {{language}}, {{discord_username}},
 * and any key from the contact's metadata object.
 */
export function replaceVariables(
    text: string,
    contact: {
        name: string;
        email: string;
        language: string;
        discordUsername?: string | null;
        metadata: unknown;
    }
): string {
    const metadata = (contact.metadata ?? {}) as Record<string, unknown>;

    const metadataVars = Object.fromEntries(
        Object.entries(metadata).map(([k, v]) => [k.trim(), String(v ?? "")])
    ) as Record<string, string>;

    // Important: built-in fields win over metadata to keep them consistent.
    const variables: Record<string, string> = {
        ...metadataVars,
        discordUsername: String(contact.discordUsername ?? ""),
        discord_username: String(contact.discordUsername ?? ""),
        name: contact.name,
        email: contact.email,
        language: contact.language,
    };

    return text.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
        const trimmed = key.trim();
        return variables[trimmed] ?? match; // keep placeholder if no value
    });
}