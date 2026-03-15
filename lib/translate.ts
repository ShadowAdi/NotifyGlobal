import { lingoDotDev } from "@/config/lingo";

interface TranslationInput {
    subject: string;
    body: string;
}

interface TranslationResult {
    subject: string;
    body: string;
    translatedLanguage: string | null;
}

/**
 * Translates a subject + body to the target locale using the Lingo.dev SDK.
 * Falls back to the original content if the target is English or translation fails.
 */
export async function translateContent(
    input: TranslationInput,
    targetLocale: string | undefined | null
): Promise<TranslationResult> {
    const locale = targetLocale?.toLowerCase();

    // No translation needed for English or missing locale
    if (!locale || locale === "en") {
        return {
            subject: input.subject,
            body: input.body,
            translatedLanguage: null,
        };
    }

    try {
        const translated = await lingoDotDev.localizeObject(
            { subject: input.subject, body: input.body },
            { sourceLocale: "en", targetLocale: locale }
        );

        return {
            subject: translated.subject,
            body: translated.body,
            translatedLanguage: locale,
        };
    } catch (translateError) {
        console.error(
            `Translation to "${locale}" failed: ${
                translateError instanceof Error ? translateError.message : "Unknown error"
            }`
        );

        // Fall back to the original content
        return {
            subject: input.subject,
            body: input.body,
            translatedLanguage: null,
        };
    }
}
