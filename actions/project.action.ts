"use server"

import { db } from "@/db/db";
import { projects } from "@/db/schema";
import { getUserIdFromToken } from "@/lib/auth";
import { CreateProjectDto, UpdateProjectDto, Project, ActionResponse, PaginationParams, PaginatedResult } from "@/types";
import { eq, and, or, like, desc, asc, count } from "drizzle-orm";


export const createProject = async (
    payload: CreateProjectDto,
    token: string
): Promise<ActionResponse<Project>> => {
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

        if (!payload.name) {
            return {
                success: false,
                error: "Name is required"
            };
        }

        const [project] = await db.insert(projects).values({
            name: payload.name,
            description: payload.description,
            userId: authResult.userId,
        }).returning();

        return {
            success: true,
            data: project
        };
    } catch (error) {
        console.error("Failed to create project:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to create project. Please try again"
        };
    }
};


export const getUserProjects = async (
    token: string,
    params?: PaginationParams
): Promise<ActionResponse<PaginatedResult<Project>>> => {
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

        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const offset = (page - 1) * limit;
        const sortBy = params?.sortBy || 'createdAt';
        const sortOrder = params?.sortOrder || 'desc';

        const conditions = [eq(projects.userId, authResult.userId)];

        if (params?.search) {
            conditions.push(
                or(
                    like(projects.name, `%${params.search}%`),
                    like(projects.description, `%${params.search}%`)
                )!
            );
        }

        const [{ count: total }] = await db
            .select({ count: count() })
            .from(projects)
            .where(and(...conditions));

        const orderByColumn = sortBy === 'name' ? projects.name :
            sortBy === 'updatedAt' ? projects.updatedAt :
                projects.createdAt;

        const projectsData = await db
            .select()
            .from(projects)
            .where(and(...conditions))
            .orderBy(sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn))
            .limit(limit)
            .offset(offset);

        const totalCount = Number(total);
        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            data: {
                data: projectsData,
                total: totalCount,
                page,
                limit,
                totalPages
            }
        };
    } catch (error) {
        console.error("Failed to get user projects:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to fetch projects. Please try again"
        };
    }
};


export const getProjectById = async (
    id: string,
    token: string
): Promise<ActionResponse<Project>> => {
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

        const [project] = await db
            .select()
            .from(projects)
            .where(
                and(
                    eq(projects.id, id),
                    eq(projects.userId, authResult.userId)
                )
            )
            .limit(1);

        if (!project) {
            return {
                success: false,
                error: "Project not found"
            };
        }

        return {
            success: true,
            data: project
        };
    } catch (error) {
        console.error("Failed to get project:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to fetch project. Please try again"
        };
    }
};


export const updateProject = async (
    projectId: string,
    payload: UpdateProjectDto,
    token: string
): Promise<ActionResponse<Project>> => {
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

        const [existingProject] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (!existingProject) {
            return {
                success: false,
                error: "Project not found"
            };
        }

        if (existingProject.userId !== authResult.userId) {
            return {
                success: false,
                error: "You don't have permission to update this project"
            };
        }

        const [updatedProject] = await db
            .update(projects)
            .set({
                ...payload,
                updatedAt: new Date(),
            })
            .where(eq(projects.id, projectId))
            .returning();

        return {
            success: true,
            data: updatedProject
        };
    } catch (error) {
        console.error("Failed to update project:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to update project. Please try again"
        };
    }
};


export const deleteProject = async (
    projectId: string,
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

        const [existingProject] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (!existingProject) {
            return {
                success: false,
                error: "Project not found"
            };
        }

        if (existingProject.userId !== authResult.userId) {
            return {
                success: false,
                error: "You don't have permission to delete this project"
            };
        }

        await db.delete(projects).where(eq(projects.id, projectId));

        return {
            success: true,
            data: undefined
        };
    } catch (error) {
        console.error("Failed to delete project:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to delete project. Please try again"
        };
    }
};
