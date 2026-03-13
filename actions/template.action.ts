"use server"

import { db } from "@/db/db";
import { templates } from "@/db/schema";
import { getUserIdFromToken } from "@/lib/auth";
import { extractTemplateVariables } from "@/lib/template-helpers";
import { ActionResponse, CreateTemplateDto, UpdateTemplateDto, Template, PaginationParams, PaginatedResult } from "@/types";
import { eq, and, or, like, desc, asc, count } from "drizzle-orm";
import { getProjectById } from "./project.action";


export const createTemplate = async (
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

        const isProjectExist = await getProjectById(payload.projectId, token);
        if (!isProjectExist.success) {
            return {
                success: false,
                error: "Project not found or you don't have access to it"
            };
        }

        if (!payload.name || !payload.subject || !payload.body) {
            return {
                success: false,
                error: "Name, subject, and body are required"
            };
        }

        // Extract variables from subject and body if not provided
        const variables = payload.variables && payload.variables.length > 0
            ? payload.variables
            : extractTemplateVariables(payload.subject, payload.body);

        const [template] = await db.insert(templates).values({
            name: payload.name,
            projectId: payload.projectId,
            body: payload.body,
            subject: payload.subject,
            variables: variables.length > 0 ? variables : null
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


export const getTemplatesByProject = async (
    projectId: string,
    token: string,
    params?: PaginationParams
): Promise<ActionResponse<PaginatedResult<Template>>> => {
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

        // Check if user has access to the project
        const projectCheck = await getProjectById(projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "Project not found or you don't have access to it"
            };
        }

        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const offset = (page - 1) * limit;
        const sortBy = params?.sortBy || 'createdAt';
        const sortOrder = params?.sortOrder || 'desc';

        const conditions = [eq(templates.projectId, projectId)];

        if (params?.search) {
            conditions.push(
                or(
                    like(templates.name, `%${params.search}%`),
                    like(templates.subject, `%${params.search}%`),
                    like(templates.body, `%${params.search}%`)
                )!
            );
        }

        const [{ count: total }] = await db
            .select({ count: count() })
            .from(templates)
            .where(and(...conditions));

        const orderByColumn = sortBy === 'name' ? templates.name :
            sortBy === 'updatedAt' ? templates.updatedAt :
                templates.createdAt;

        const templatesData = await db
            .select()
            .from(templates)
            .where(and(...conditions))
            .orderBy(sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn))
            .limit(limit)
            .offset(offset);

        const totalCount = Number(total);
        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            data: {
                data: templatesData.map(template => ({
                    ...template,
                    variables: (template.variables ?? null) as string[] | null
                })),
                total: totalCount,
                page,
                limit,
                totalPages
            }
        };
    } catch (error) {
        console.error("Failed to get templates:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to fetch templates. Please try again"
        };
    }
};


export const getTemplateById = async (
    templateId: string,
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

        const [template] = await db
            .select()
            .from(templates)
            .where(eq(templates.id, templateId))
            .limit(1);

        if (!template) {
            return {
                success: false,
                error: "Template not found"
            };
        }

        // Verify user has access to the project this template belongs to
        const projectCheck = await getProjectById(template.projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "You don't have access to this template"
            };
        }

        return {
            success: true,
            data: {
                ...template,
                variables: (template.variables ?? null) as string[] | null
            }
        };
    } catch (error) {
        console.error("Failed to get template:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to fetch template. Please try again"
        };
    }
};


export const updateTemplate = async (
    templateId: string,
    payload: UpdateTemplateDto,
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

        const [existingTemplate] = await db
            .select()
            .from(templates)
            .where(eq(templates.id, templateId))
            .limit(1);

        if (!existingTemplate) {
            return {
                success: false,
                error: "Template not found"
            };
        }

        // Verify user has access to the project
        const projectCheck = await getProjectById(existingTemplate.projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "You don't have permission to update this template"
            };
        }

        // Merge existing template data with payload for variable extraction
        const finalSubject = payload.subject || existingTemplate.subject;
        const finalBody = payload.body || existingTemplate.body;

        // Extract variables if not provided in payload
        const variables = payload.variables !== undefined
            ? (payload.variables.length > 0 ? payload.variables : null)
            : extractTemplateVariables(finalSubject, finalBody);

        const [updatedTemplate] = await db
            .update(templates)
            .set({
                ...payload,
                variables: Array.isArray(variables) && variables.length > 0 ? variables : null,
                updatedAt: new Date(),
            })
            .where(eq(templates.id, templateId))
            .returning();

        return {
            success: true,
            data: {
                ...updatedTemplate,
                variables: (updatedTemplate.variables ?? null) as string[] | null
            }
        };
    } catch (error) {
        console.error("Failed to update template:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to update template. Please try again"
        };
    }
};


export const deleteTemplate = async (
    templateId: string,
    token: string
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

        const [existingTemplate] = await db
            .select()
            .from(templates)
            .where(eq(templates.id, templateId))
            .limit(1);

        if (!existingTemplate) {
            return {
                success: false,
                error: "Template not found"
            };
        }

        // Verify user has access to the project
        const projectCheck = await getProjectById(existingTemplate.projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "You don't have permission to delete this template"
            };
        }

        await db.delete(templates).where(eq(templates.id, templateId));

        return {
            success: true,
            data: undefined
        };
    } catch (error) {
        console.error("Failed to delete template:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to delete template. Please try again"
        };
    }
};