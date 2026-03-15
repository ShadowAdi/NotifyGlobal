import { db } from "@/db/db";
import { apiKeys } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

const API_KEY_SECRET = process.env.API_KEY_SECRET || process.env.JWT_SECRET || "api-key-secret-change-in-production";

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
 * Verifies a Bearer API key (JWT-signed) from the Authorization header.
 * 1. Decodes & verifies the JWT signature.
 * 2. Checks the key exists in the DB and is still active.
 * 3. Returns userId + projectId.
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

    let decoded: { userId: string; projectId: string; type: string };
    try {
        decoded = jwt.verify(rawKey, API_KEY_SECRET) as {
            userId: string;
            projectId: string;
            type: string;
        };
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return { success: false, error: "API key has expired" };
        }
        return { success: false, error: "Invalid API key" };
    }

    if (decoded.type !== "api_key") {
        return { success: false, error: "Invalid API key" };
    }

    const [key] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.key, rawKey), eq(apiKeys.isActive, true)))
        .limit(1);

    if (!key) {
        return { success: false, error: "API key is revoked or does not exist" };
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
        return { success: false, error: "API key has expired" };
    }

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
