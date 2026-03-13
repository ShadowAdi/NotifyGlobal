/**
 * Extracts variables from text using {{variable}} pattern
 * @param text - The text to extract variables from
 * @returns Array of unique variable names
 */
export function extractVariables(text: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = text.matchAll(regex);
    const variables = new Set<string>();

    for (const match of matches) {
        const variable = match[1].trim();
        if (variable) {
            variables.add(variable);
        }
    }

    return Array.from(variables);
}

/**
 * Extracts variables from both subject and body
 * @param subject - Template subject line
 * @param body - Template body content
 * @returns Array of unique variable names from both fields
 */
export function extractTemplateVariables(subject: string, body: string): string[] {
    const subjectVars = extractVariables(subject);
    const bodyVars = extractVariables(body);
    
    const allVariables = new Set([...subjectVars, ...bodyVars]);
    return Array.from(allVariables);
}
