"use server";

import { db } from "@/db/db";
import { events, templates } from "@/db/schema";
import { getUserIdFromToken } from "@/lib/auth";
import { getProjectById } from "./project.action";
import {
    ActionResponse,
    CreateEventDto,
    UpdateEventDto,
    Event,
    PaginationParams,
    PaginatedResult,
} from "@/types";
import { eq, and, or, like, desc, asc, count } from "drizzle-orm";


export const createEvent = async (
    payload: CreateEventDto,
    token: string
): Promise<ActionResponse<Event>> => {
    try {
        if (!token) {
            return { success: false, error: "Authentication required" };
        }

        const authResult = await getUserIdFromToken(token);
        if (!authResult.success) {
            return { success: false, error: authResult.error };
        }

        const projectCheck = await getProjectById(payload.projectId, token);
        if (!projectCheck.success) {
            return { success: false, error: "Project not found or you don't have access to it" };
        }

        if (!payload.eventName || !payload.eventId) {
            return { success: false, error: "Event name and event ID are required" };
        }

        // Must provide either a templateId or an inline subject+message
        if (!payload.templateId && (!payload.subject || !payload.message)) {
            return {
                success: false,
                error: "You must provide either a templateId or both subject and message",
            };
        }

        // If a template is specified, verify it exists and belongs to the same project
        if (payload.templateId) {
            const [template] = await db
                .select()
                .from(templates)
                .where(
                    and(
                        eq(templates.id, payload.templateId),
                        eq(templates.projectId, payload.projectId)
                    )
                )
                .limit(1);

            if (!template) {
                return { success: false, error: "Template not found in this project" };
            }
        }

        const [event] = await db
            .insert(events)
            .values({
                projectId: payload.projectId,
                eventName: payload.eventName,
                eventId: payload.eventId,
                templateId: payload.templateId ?? null,
                subject: payload.subject ?? null,
                message: payload.message ?? null,
                channel: payload.channel ?? "email",
                description: payload.description ?? null,
                isActive: payload.isActive ?? true,
            })
            .returning();

        return {
            success: true,
            data: event as Event,
        };
    } catch (error) {
        console.error("Failed to create event:", error);

        if (
            error instanceof Error &&
            error.message.includes("unique constraint")
        ) {
            return {
                success: false,
                error: "An event with this event ID already exists",
            };
        }

        if (error instanceof Error && error.message.includes("connection")) {
            return { success: false, error: "Database connection failed. Please try again later" };
        }

        return { success: false, error: "Failed to create event. Please try again" };
    }
};

export const getEventsByProject = async (
    projectId: string,
    token: string,
    params?: PaginationParams
): Promise<ActionResponse<PaginatedResult<Event>>> => {
    try {
        if (!token) {
            return { success: false, error: "Authentication required" };
        }

        const authResult = await getUserIdFromToken(token);
        if (!authResult.success) {
            return { success: false, error: authResult.error };
        }

        const projectCheck = await getProjectById(projectId, token);
        if (!projectCheck.success) {
            return { success: false, error: "Project not found or you don't have access to it" };
        }

        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const offset = (page - 1) * limit;
        const sortOrder = params?.sortOrder || "desc";

        const conditions = [eq(events.projectId, projectId)];

        if (params?.search) {
            conditions.push(
                or(
                    like(events.eventName, `%${params.search}%`),
                    like(events.eventId, `%${params.search}%`),
                    like(events.description, `%${params.search}%`)
                )!
            );
        }

        const [{ count: total }] = await db
            .select({ count: count() })
            .from(events)
            .where(and(...conditions));

        const eventsData = await db
            .select()
            .from(events)
            .where(and(...conditions))
            .orderBy(sortOrder === "asc" ? asc(events.createdAt) : desc(events.createdAt))
            .limit(limit)
            .offset(offset);

        const totalCount = Number(total);

        return {
            success: true,
            data: {
                data: eventsData as Event[],
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
            },
        };
    } catch (error) {
        console.error("Failed to get events:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return { success: false, error: "Database connection failed. Please try again later" };
        }

        return { success: false, error: "Failed to fetch events. Please try again" };
    }
};

export const getEventById = async (
    eventId: string,
    token: string
): Promise<ActionResponse<Event>> => {
    try {
        if (!token) {
            return { success: false, error: "Authentication required" };
        }

        const authResult = await getUserIdFromToken(token);
        if (!authResult.success) {
            return { success: false, error: authResult.error };
        }

        const [event] = await db
            .select()
            .from(events)
            .where(eq(events.id, eventId))
            .limit(1);

        if (!event) {
            return { success: false, error: "Event not found" };
        }

        // Verify project access
        const projectCheck = await getProjectById(event.projectId, token);
        if (!projectCheck.success) {
            return { success: false, error: "You don't have access to this event" };
        }

        return { success: true, data: event as Event };
    } catch (error) {
        console.error("Failed to get event:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return { success: false, error: "Database connection failed. Please try again later" };
        }

        return { success: false, error: "Failed to fetch event. Please try again" };
    }
};

export const updateEvent = async (
    eventId: string,
    payload: UpdateEventDto,
    token: string
): Promise<ActionResponse<Event>> => {
    try {
        if (!token) {
            return { success: false, error: "Authentication required" };
        }

        const authResult = await getUserIdFromToken(token);
        if (!authResult.success) {
            return { success: false, error: authResult.error };
        }

        const [existing] = await db
            .select()
            .from(events)
            .where(eq(events.id, eventId))
            .limit(1);

        if (!existing) {
            return { success: false, error: "Event not found" };
        }

        const projectCheck = await getProjectById(existing.projectId, token);
        if (!projectCheck.success) {
            return { success: false, error: "You don't have access to this event" };
        }

        // If changing to a new template, verify it exists
        if (payload.templateId) {
            const [template] = await db
                .select()
                .from(templates)
                .where(
                    and(
                        eq(templates.id, payload.templateId),
                        eq(templates.projectId, existing.projectId)
                    )
                )
                .limit(1);

            if (!template) {
                return { success: false, error: "Template not found in this project" };
            }
        }

        const [updated] = await db
            .update(events)
            .set({
                ...(payload.eventName !== undefined && { eventName: payload.eventName }),
                ...(payload.templateId !== undefined && { templateId: payload.templateId }),
                ...(payload.subject !== undefined && { subject: payload.subject }),
                ...(payload.message !== undefined && { message: payload.message }),
                ...(payload.channel !== undefined && { channel: payload.channel }),
                ...(payload.description !== undefined && { description: payload.description }),
                ...(payload.isActive !== undefined && { isActive: payload.isActive }),
                updatedAt: new Date(),
            })
            .where(eq(events.id, eventId))
            .returning();

        return { success: true, data: updated as Event };
    } catch (error) {
        console.error("Failed to update event:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return { success: false, error: "Database connection failed. Please try again later" };
        }

        return { success: false, error: "Failed to update event. Please try again" };
    }
};

export const deleteEvent = async (
    eventId: string,
    token: string
): Promise<ActionResponse<void>> => {
    try {
        if (!token) {
            return { success: false, error: "Authentication required" };
        }

        const authResult = await getUserIdFromToken(token);
        if (!authResult.success) {
            return { success: false, error: authResult.error };
        }

        const [existing] = await db
            .select()
            .from(events)
            .where(eq(events.id, eventId))
            .limit(1);

        if (!existing) {
            return { success: false, error: "Event not found" };
        }

        const projectCheck = await getProjectById(existing.projectId, token);
        if (!projectCheck.success) {
            return { success: false, error: "You don't have access to this event" };
        }

        await db.delete(events).where(eq(events.id, eventId));

        return { success: true, data: undefined };
    } catch (error) {
        console.error("Failed to delete event:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return { success: false, error: "Database connection failed. Please try again later" };
        }

        return { success: false, error: "Failed to delete event. Please try again" };
    }
};
