import { getUserIdFromToken } from "@/lib/auth";
import { ActionResponse, ApiKey, CreateApiKeyDto } from "@/types";
import { getProjectById } from "./project.action";
import { db } from "@/db/db";
import { apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createApiKey = async (
    payload: CreateApiKeyDto,
    token: string
): Promise<ActionResponse<ApiKey>> => {
    try {
        if (!token) {
            return {
                success: false,
                error: "Authentication required"
            };
        }

        const authResult = await getUserIdFromToken(token);
        if (!authResult.success) {
            return {
                success: false,
                error: authResult.error
            };
        }

        // Verify project access
        const projectCheck = await getProjectById(payload.projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "Project not found or you don't have access to it"
            };
        }

        if (!payload.name) {
            return {
                success: false,
                error: "Name is required"
            };
        }


        const [contact] = await db.insert(apiKeys).values({
            projectId: payload.projectId,
            name: payload.name,
            key: crypto.randomUUID(),
            userId: authResult.userId,
            expiresAt: payload.expiresAt,
            isActive: true,
        }).returning();

        return {
            success: true,
            data: {
                ...contact,
            }
        };
    } catch (error) {
        console.error("Failed to create contact:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to create contact. Please try again"
        };
    }
};


export const GetAllKeys = async (
    token: string
): Promise<ActionResponse<ApiKey[]>> => {
    try {
        if (!token) {
            return {
                success: false,
                error: "Authentication required"
            };
        }

        const authResult = await getUserIdFromToken(token);
        if (!authResult.success) {
            return {
                success: false,
                error: authResult.error
            };
        }

        const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, authResult.userId));
        return {
            success: true,
            data: keys,
        };
    } catch (error) {
        console.error("Failed to get all keys:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to get all keys. Please try again"
        };
    }
};