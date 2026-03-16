"use server";

import { getUserIdFromToken } from "@/lib/auth";
import { ActionResponse, ApiKey, CreateApiKeyDto } from "@/types";
import { getProjectById } from "./project.action";
import { db } from "@/db/db";
import { apiKeys } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const API_KEY_SECRET = process.env.API_KEY_SECRET || process.env.JWT_SECRET || "api-key-secret-change-in-production";

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


        const signedKey = jwt.sign(
            {
                userId: authResult.userId,
                projectId: payload.projectId,
                type: "api_key",
            },
            API_KEY_SECRET,
            payload.expiresAt
                ? { expiresIn: Math.floor((payload.expiresAt.getTime() - Date.now()) / 1000) }
                : undefined
        );

        const [apiKey] = await db.insert(apiKeys).values({
            projectId: payload.projectId,
            name: payload.name,
            key: signedKey,
            userId: authResult.userId,
            expiresAt: payload.expiresAt,
            isActive: true,
        }).returning();

        return {
            success: true,
            data: {
                ...apiKey,
            }
        };
    } catch (error) {
        console.error("Failed to create API key:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to create API key. Please try again"
        };
    }
};


export const GetAllKeys = async (
    token: string,
    projectId: string
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

        const projectCheck = await getProjectById(projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "Project not found or you don't have access to it"
            };
        }


        const keys = await db.select().from(apiKeys).where(and(eq(apiKeys.userId, authResult.userId), eq(apiKeys.projectId, projectCheck.data.id)));
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

export const DeleteApiKey = async (
    token: string,
    keyId: string
): Promise<ActionResponse<void>> => {
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

        const [existingKey] = await db
            .select()
            .from(apiKeys)
            .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, authResult.userId)))
            .limit(1);
        if (!existingKey) {
            return {
                success: false,
                error: "Key not found"
            };
        }
        await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

        return {
            success: true,
            data: undefined
        };

    } catch (error) {
        console.error("Failed to delete API key:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to delete API key. Please try again"
        };
    }
};