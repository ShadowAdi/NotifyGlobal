"use server"

import { db } from "@/db/db";
import { projects, templates } from "@/db/schema";
import { getUserIdFromToken } from "@/lib/auth";
import { ActionResponse, CreateTemplateDto, Template } from "@/types";
import { getProjectById } from "./project.action";

export const creatreTemplate = async (
    payload: CreateTemplateDto,
    token: string
): Promise<ActionResponse<Template>> => {
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

        const isProjectExist = await getProjectById(payload.projectId, token)
        if (!isProjectExist.success) {
            return {
                "success": false,
                error: "Failed to get the given project for template Creation"
            }
        }

        if (!payload.name) {
            return {
                success: false,
                error: "Name is required"
            };
        }

        const [template] = await db.insert(templates).values({
            name: payload.name,
            projectId: payload.projectId,
            body: payload.name,
            subject: payload.subject,
            variables: payload.variables || []
        }).returning();

        return {
            success: true,
            data: {
                ...template,
                variables: (template.variables ?? null) as string[] | null
            }
        };
    } catch (error) {
        console.error("Failed to create template:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to create template. Please try again"
        };
    }
};