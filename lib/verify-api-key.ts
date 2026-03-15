import { db } from "@/db/db";
import { apiKeys } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface VerifyApiKeyResult {
    success: true;
    userId: string;
    projectId: string;
    keyId: string;
}

interface VerifyApiKeyError {
    success: false;
    error: string;
}

/**
 * Verifies a Bearer API key from the Authorization header.
 * Returns the userId and projectId associated with the key.
 */
export async function verifyApiKey(
    authorizationHeader: string | null
): Promise<VerifyApiKeyResult | VerifyApiKeyError> {
    if (!authorizationHeader) {
        return { success: false, error: "Authorization header is required" };
    }

    const parts = authorizationHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return { success: false, error: "Authorization header must be in the format: Bearer <api_key>" };
    }

    const rawKey = parts[1];
    if (!rawKey) {
        return { success: false, error: "API key is missing" };
    }

    const [key] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.key, rawKey), eq(apiKeys.isActive, true)))
        .limit(1);

    if (!key) {
        return { success: false, error: "Invalid or inactive API key" };
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
        return { success: false, error: "API key has expired" };
    }

    // Update last used timestamp
    await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, key.id));

    return {
        success: true,
        userId: key.userId,
        projectId: key.projectId,
        keyId: key.id,
    };
}
