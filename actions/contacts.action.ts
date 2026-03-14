"use server"

import { db } from "@/db/db";
import { contacts } from "@/db/schema";
import { getUserIdFromToken } from "@/lib/auth";
import { validateBulkContacts, isValidEmail } from "@/lib/contact-helpers";
import { ActionResponse, CreateContactDto, UpdateContactDto, Contact, PaginationParams, PaginatedResult } from "@/types";
import { eq, and, or, like, desc, asc, count, inArray } from "drizzle-orm";
import { getProjectById } from "./project.action";



export const createContact = async (
    payload: CreateContactDto,
    token: string
): Promise<ActionResponse<Contact>> => {
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

        if (!payload.name || !payload.email) {
            return {
                success: false,
                error: "Name and email are required"
            };
        }

        if (!isValidEmail(payload.email)) {
            return {
                success: false,
                error: "Invalid email format"
            };
        }

        const [contact] = await db.insert(contacts).values({
            projectId: payload.projectId,
            name: payload.name,
            email: payload.email,
            language: payload.language || 'en',
            tags: payload.tags || null,
            discordUsername: payload.discordUsername || null,
            metadata: payload.metadata || null
        }).returning();

        return {
            success: true,
            data: {
                ...contact,
                tags: (contact.tags ?? null) as string[] | null,
                metadata: (contact.metadata ?? null) as Record<string, unknown> | null
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

export const bulkUploadContacts = async (
    projectId: string,
    contactsData: CreateContactDto[],
    token: string
): Promise<ActionResponse<{ 
    created: Contact[], 
    failed: number,
    errors: string[]
}>> => {
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
        const projectCheck = await getProjectById(projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "Project not found or you don't have access to it"
            };
        }

        if (!Array.isArray(contactsData) || contactsData.length === 0) {
            return {
                success: false,
                error: "Contacts array is required and must not be empty"
            };
        }

        // Validate all contacts
        const { valid, invalid, errors } = validateBulkContacts(contactsData);

        if (valid.length === 0) {
            return {
                success: false,
                error: `All contacts are invalid. Errors: ${errors.join(', ')}`
            };
        }

        // Insert valid contacts
        const contactsToInsert = valid.map(contact => ({
            projectId,
            name: contact.name,
            email: contact.email,
            language: contact.language || 'en',
            tags: contact.tags || null,
            discordUsername: contact.discordUsername || null,
            metadata: contact.metadata || null
        }));

        const createdContacts = await db
            .insert(contacts)
            .values(contactsToInsert)
            .returning();

        return {
            success: true,
            data: {
                created: createdContacts.map(contact => ({
                    ...contact,
                    tags: (contact.tags ?? null) as string[] | null,
                    metadata: (contact.metadata ?? null) as Record<string, unknown> | null
                })),
                failed: invalid.length,
                errors
            }
        };
    } catch (error) {
        console.error("Failed to bulk upload contacts:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to upload contacts. Please try again"
        };
    }
};

export const getContactsByProject = async (
    projectId: string,
    token: string,
    params?: PaginationParams
): Promise<ActionResponse<PaginatedResult<Contact>>> => {
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

        const conditions = [eq(contacts.projectId, projectId)];

        if (params?.search) {
            conditions.push(
                or(
                    like(contacts.name, `%${params.search}%`),
                    like(contacts.email, `%${params.search}%`),
                    like(contacts.language, `%${params.search}%`)
                )!
            );
        }

        const [{ count: total }] = await db
            .select({ count: count() })
            .from(contacts)
            .where(and(...conditions));

        const orderByColumn = sortBy === 'name' ? contacts.name :
            sortBy === 'email' ? contacts.email :
            sortBy === 'updatedAt' ? contacts.updatedAt :
                contacts.createdAt;

        const contactsData = await db
            .select()
            .from(contacts)
            .where(and(...conditions))
            .orderBy(sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn))
            .limit(limit)
            .offset(offset);

        const totalCount = Number(total);
        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            data: {
                data: contactsData.map(contact => ({
                    ...contact,
                    tags: (contact.tags ?? null) as string[] | null,
                    metadata: (contact.metadata ?? null) as Record<string, unknown> | null
                })),
                total: totalCount,
                page,
                limit,
                totalPages
            }
        };
    } catch (error) {
        console.error("Failed to get contacts:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to fetch contacts. Please try again"
        };
    }
};

export const getContactById = async (
    contactId: string,
    token: string
): Promise<ActionResponse<Contact>> => {
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

        const [contact] = await db
            .select()
            .from(contacts)
            .where(eq(contacts.id, contactId))
            .limit(1);

        if (!contact) {
            return {
                success: false,
                error: "Contact not found"
            };
        }

        // Verify project access
        const projectCheck = await getProjectById(contact.projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "You don't have access to this contact"
            };
        }

        return {
            success: true,
            data: {
                ...contact,
                tags: (contact.tags ?? null) as string[] | null,
                metadata: (contact.metadata ?? null) as Record<string, unknown> | null
            }
        };
    } catch (error) {
        console.error("Failed to get contact:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to fetch contact. Please try again"
        };
    }
};

export const updateContact = async (
    contactId: string,
    payload: UpdateContactDto,
    token: string
): Promise<ActionResponse<Contact>> => {
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

        const [existingContact] = await db
            .select()
            .from(contacts)
            .where(eq(contacts.id, contactId))
            .limit(1);

        if (!existingContact) {
            return {
                success: false,
                error: "Contact not found"
            };
        }

        // Verify project access
        const projectCheck = await getProjectById(existingContact.projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "You don't have permission to update this contact"
            };
        }

        if (payload.email && !isValidEmail(payload.email)) {
            return {
                success: false,
                error: "Invalid email format"
            };
        }

        const [updatedContact] = await db
            .update(contacts)
            .set({
                ...payload,
                updatedAt: new Date(),
            })
            .where(eq(contacts.id, contactId))
            .returning();

        return {
            success: true,
            data: {
                ...updatedContact,
                tags: (updatedContact.tags ?? null) as string[] | null,
                metadata: (updatedContact.metadata ?? null) as Record<string, unknown> | null
            }
        };
    } catch (error) {
        console.error("Failed to update contact:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to update contact. Please try again"
        };
    }
};

export const bulkUpdateContacts = async (
    updates: { id: string, data: UpdateContactDto }[],
    token: string
): Promise<ActionResponse<{
    updated: Contact[],
    failed: number,
    errors: string[]
}>> => {
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

        if (!Array.isArray(updates) || updates.length === 0) {
            return {
                success: false,
                error: "Updates array is required and must not be empty"
            };
        }

        const updatedContacts: Contact[] = [];
        const errors: string[] = [];
        let failedCount = 0;

        // Process each update
        for (const update of updates) {
            try {
                const [existingContact] = await db
                    .select()
                    .from(contacts)
                    .where(eq(contacts.id, update.id))
                    .limit(1);

                if (!existingContact) {
                    errors.push(`Contact ${update.id}: Not found`);
                    failedCount++;
                    continue;
                }

                // Verify project access
                const projectCheck = await getProjectById(existingContact.projectId, token);
                if (!projectCheck.success) {
                    errors.push(`Contact ${update.id}: Access denied`);
                    failedCount++;
                    continue;
                }

                if (update.data.email && !isValidEmail(update.data.email)) {
                    errors.push(`Contact ${update.id}: Invalid email format`);
                    failedCount++;
                    continue;
                }

                const [updatedContact] = await db
                    .update(contacts)
                    .set({
                        ...update.data,
                        updatedAt: new Date(),
                    })
                    .where(eq(contacts.id, update.id))
                    .returning();

                updatedContacts.push({
                    ...updatedContact,
                    tags: (updatedContact.tags ?? null) as string[] | null,
                    metadata: (updatedContact.metadata ?? null) as Record<string, unknown> | null
                });
            } catch (err) {
                errors.push(`Contact ${update.id}: Update failed`);
                failedCount++;
            }
        }

        return {
            success: true,
            data: {
                updated: updatedContacts,
                failed: failedCount,
                errors
            }
        };
    } catch (error) {
        console.error("Failed to bulk update contacts:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to update contacts. Please try again"
        };
    }
};

export const deleteContact = async (
    contactId: string,
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

        const [existingContact] = await db
            .select()
            .from(contacts)
            .where(eq(contacts.id, contactId))
            .limit(1);

        if (!existingContact) {
            return {
                success: false,
                error: "Contact not found"
            };
        }

        // Verify project access
        const projectCheck = await getProjectById(existingContact.projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "You don't have permission to delete this contact"
            };
        }

        await db.delete(contacts).where(eq(contacts.id, contactId));

        return {
            success: true,
            data: undefined
        };
    } catch (error) {
        console.error("Failed to delete contact:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to delete contact. Please try again"
        };
    }
};

export const bulkDeleteContacts = async (
    contactIds: string[],
    token: string
): Promise<ActionResponse<{
    deleted: number,
    failed: number,
    errors: string[]
}>> => {
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

        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return {
                success: false,
                error: "Contact IDs array is required and must not be empty"
            };
        }

        // Fetch all contacts to verify access
        const contactsToDelete = await db
            .select()
            .from(contacts)
            .where(inArray(contacts.id, contactIds));

        if (contactsToDelete.length === 0) {
            return {
                success: false,
                error: "No contacts found with provided IDs"
            };
        }

        // Verify access to all projects
        const projectIds = [...new Set(contactsToDelete.map(c => c.projectId))];
        const errors: string[] = [];
        let accessibleContactIds: string[] = [];

        for (const projectId of projectIds) {
            const projectCheck = await getProjectById(projectId, token);
            if (projectCheck.success) {
                const contactsInProject = contactsToDelete
                    .filter(c => c.projectId === projectId)
                    .map(c => c.id);
                accessibleContactIds.push(...contactsInProject);
            } else {
                const deniedContacts = contactsToDelete.filter(c => c.projectId === projectId);
                errors.push(`Access denied for ${deniedContacts.length} contact(s) in project ${projectId}`);
            }
        }

        if (accessibleContactIds.length === 0) {
            return {
                success: false,
                error: "You don't have permission to delete any of these contacts"
            };
        }

        // Delete accessible contacts
        await db.delete(contacts).where(inArray(contacts.id, accessibleContactIds));

        return {
            success: true,
            data: {
                deleted: accessibleContactIds.length,
                failed: contactIds.length - accessibleContactIds.length,
                errors
            }
        };
    } catch (error) {
        console.error("Failed to bulk delete contacts:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to delete contacts. Please try again"
        };
    }
};

export const deleteAllContactsInProject = async (
    projectId: string,
    token: string
): Promise<ActionResponse<{ deleted: number }>> => {
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
        const projectCheck = await getProjectById(projectId, token);
        if (!projectCheck.success) {
            return {
                success: false,
                error: "Project not found or you don't have access to it"
            };
        }

        // Count contacts before deletion
        const [{ count: total }] = await db
            .select({ count: count() })
            .from(contacts)
            .where(eq(contacts.projectId, projectId));

        // Delete all contacts in the project
        await db.delete(contacts).where(eq(contacts.projectId, projectId));

        return {
            success: true,
            data: {
                deleted: Number(total)
            }
        };
    } catch (error) {
        console.error("Failed to delete all contacts:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to delete contacts. Please try again"
        };
    }
};
