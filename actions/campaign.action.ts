"use server"

import { db } from "@/db/db";
import { campaigns, projects, templates, contacts, users } from "@/db/schema";
import { getUserIdFromToken } from "@/lib/auth";
import { 
    CreateCampaignDto, 
    UpdateCampaignDto, 
    Campaign, 
    ActionResponse, 
    PaginationParams, 
    PaginatedResult 
} from "@/types";
import { eq, and, desc, count, sql, inArray } from "drizzle-orm";

/**
 * Create a new campaign with comprehensive validation
 */
export const createCampaign = async (
    projectId: string,
    payload: CreateCampaignDto,
    token: string
): Promise<ActionResponse<Campaign>> => {
    try {
        // Validate token
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

        const userId = authResult.userId;

        // Validate user exists
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
            return {
                success: false,
                error: "User not found"
            };
        }

        // Validate project exists and belongs to user
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
            .limit(1);

        if (!project) {
            return {
                success: false,
                error: "Project not found or access denied"
            };
        }

        // Validate campaign name
        if (!payload.name || payload.name.trim().length === 0) {
            return {
                success: false,
                error: "Campaign name is required"
            };
        }

        // Validate channel
        const validChannels = ["email", "sms", "discord", "slack"];
        if (!validChannels.includes(payload.channel)) {
            return {
                success: false,
                error: "Invalid channel. Must be one of: email, sms, discord, slack"
            };
        }

        // Validate template OR subject/message
        if (payload.templateId) {
            // If templateId is provided, verify it exists and belongs to the project
            const [template] = await db
                .select()
                .from(templates)
                .where(and(eq(templates.id, payload.templateId), eq(templates.projectId, projectId)))
                .limit(1);

            if (!template) {
                return {
                    success: false,
                    error: "Template not found or doesn't belong to this project"
                };
            }
        } else {
            // If no templateId, validate subject/message based on channel
            if (payload.channel === "email") {
                // Email requires both subject and message
                if (!payload.subject || payload.subject.trim().length === 0) {
                    return {
                        success: false,
                        error: "Subject is required for email campaigns when no template is provided"
                    };
                }
                if (!payload.message || payload.message.trim().length === 0) {
                    return {
                        success: false,
                        error: "Message is required for email campaigns when no template is provided"
                    };
                }
            } else {
                // SMS, Discord, Slack only need message
                if (!payload.message || payload.message.trim().length === 0) {
                    return {
                        success: false,
                        error: `Message is required for ${payload.channel} campaigns when no template is provided`
                    };
                }
            }
        }

        // Validate filterType
        const validFilterTypes = ["manual", "all", "language", "tags"];
        if (!validFilterTypes.includes(payload.filterType)) {
            return {
                success: false,
                error: "Invalid filterType. Must be one of: manual, all, language, tags"
            };
        }

        // Validate filter-specific requirements
        if (payload.filterType === "manual") {
            if (!payload.contactIds || payload.contactIds.length === 0) {
                return {
                    success: false,
                    error: "contactIds are required when filterType is 'manual'"
                };
            }

            // Verify all contact IDs exist and belong to the project
            const existingContacts = await db
                .select({ id: contacts.id })
                .from(contacts)
                .where(and(eq(contacts.projectId, projectId), inArray(contacts.id, payload.contactIds)));

            if (existingContacts.length !== payload.contactIds.length) {
                return {
                    success: false,
                    error: "One or more contact IDs are invalid or don't belong to this project"
                };
            }
        }

        if (payload.filterType === "language") {
            if (!payload.filterLanguage || payload.filterLanguage.trim().length === 0) {
                return {
                    success: false,
                    error: "filterLanguage is required when filterType is 'language'"
                };
            }
        }

        if (payload.filterType === "tags") {
            if (!payload.filterTags || payload.filterTags.length === 0) {
                return {
                    success: false,
                    error: "filterTags are required when filterType is 'tags'"
                };
            }
        }

        // Validate scheduledAt is in the future (if provided)
        if (payload.scheduledAt) {
            const scheduledDate = new Date(payload.scheduledAt);
            const now = new Date();

            if (isNaN(scheduledDate.getTime())) {
                return {
                    success: false,
                    error: "Invalid scheduledAt date format"
                };
            }

            if (scheduledDate <= now) {
                return {
                    success: false,
                    error: "scheduledAt must be in the future"
                };
            }
        }

        // Create the campaign
        const [campaign] = await db.insert(campaigns).values({
            projectId,
            templateId: payload.templateId || null,
            name: payload.name,
            subject: payload.subject || null,
            message: payload.message || null,
            variables: payload.variables || null,
            channel: payload.channel,
            filterType: payload.filterType,
            filterLanguage: payload.filterLanguage || null,
            filterTags: payload.filterTags || null,
            contactIds: payload.contactIds || null,
            status: "draft",
            scheduledAt: payload.scheduledAt || null,
        }).returning();

        return {
            success: true,
            data: campaign as Campaign
        };
    } catch (error) {
        console.error("Failed to create campaign:", error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection error. Please try again."
            };
        }

        return {
            success: false,
            error: "Failed to create campaign. Please try again."
        };
    }
};

/**
 * Get a single campaign by ID
 */
export const getCampaign = async (
    campaignId: string,
    projectId: string,
    token: string
): Promise<ActionResponse<Campaign>> => {
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

        const userId = authResult.userId;

        // Verify project belongs to user
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
            .limit(1);

        if (!project) {
            return {
                success: false,
                error: "Project not found or access denied"
            };
        }

        // Get campaign
        const [campaign] = await db
            .select()
            .from(campaigns)
            .where(and(eq(campaigns.id, campaignId), eq(campaigns.projectId, projectId)))
            .limit(1);

        if (!campaign) {
            return {
                success: false,
                error: "Campaign not found"
            };
        }

        return {
            success: true,
            data: campaign as Campaign
        };
    } catch (error) {
        console.error("Failed to get campaign:", error);
        return {
            success: false,
            error: "Failed to retrieve campaign. Please try again."
        };
    }
};

/**
 * Get all campaigns for a project with pagination
 */
export const getAllCampaigns = async (
    projectId: string,
    token: string,
    params?: PaginationParams
): Promise<ActionResponse<PaginatedResult<Campaign>>> => {
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

        const userId = authResult.userId;

        // Verify project belongs to user
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
            .limit(1);

        if (!project) {
            return {
                success: false,
                error: "Project not found or access denied"
            };
        }

        // Pagination setup
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const [{ total }] = await db
            .select({ total: count() })
            .from(campaigns)
            .where(eq(campaigns.projectId, projectId));

        // Get campaigns
        const campaignList = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.projectId, projectId))
            .orderBy(desc(campaigns.createdAt))
            .limit(limit)
            .offset(offset);

        return {
            success: true,
            data: {
                data: campaignList as Campaign[],
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to get campaigns:", error);
        return {
            success: false,
            error: "Failed to retrieve campaigns. Please try again."
        };
    }
};

/**
 * Update a campaign
 */
export const updateCampaign = async (
    campaignId: string,
    projectId: string,
    payload: UpdateCampaignDto,
    token: string
): Promise<ActionResponse<Campaign>> => {
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

        const userId = authResult.userId;

        // Verify project belongs to user
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
            .limit(1);

        if (!project) {
            return {
                success: false,
                error: "Project not found or access denied"
            };
        }

        // Get existing campaign
        const [existingCampaign] = await db
            .select()
            .from(campaigns)
            .where(and(eq(campaigns.id, campaignId), eq(campaigns.projectId, projectId)))
            .limit(1);

        if (!existingCampaign) {
            return {
                success: false,
                error: "Campaign not found"
            };
        }

        // Don't allow updates to campaigns that are sending or completed
        if (existingCampaign.status === "sending" || existingCampaign.status === "completed") {
            return {
                success: false,
                error: `Cannot update campaign with status '${existingCampaign.status}'`
            };
        }

        // Validate scheduled date if provided
        if (payload.scheduledAt) {
            const scheduledDate = new Date(payload.scheduledAt);
            const now = new Date();

            if (isNaN(scheduledDate.getTime())) {
                return {
                    success: false,
                    error: "Invalid scheduledAt date format"
                };
            }

            if (scheduledDate <= now) {
                return {
                    success: false,
                    error: "scheduledAt must be in the future"
                };
            }
        }

        // Validate channel if provided
        if (payload.channel) {
            const validChannels = ["email", "sms", "discord", "slack"];
            if (!validChannels.includes(payload.channel)) {
                return {
                    success: false,
                    error: "Invalid channel. Must be one of: email, sms, discord, slack"
                };
            }
        }

        // Validate status if provided
        if (payload.status) {
            const validStatuses = ["draft", "sending", "completed", "failed"];
            if (!validStatuses.includes(payload.status)) {
                return {
                    success: false,
                    error: "Invalid status. Must be one of: draft, sending, completed, failed"
                };
            }
        }

        // Build update object with only provided fields
        const updateData: Partial<typeof campaigns.$inferInsert> = {};

        if (payload.name !== undefined) updateData.name = payload.name;
        if (payload.subject !== undefined) updateData.subject = payload.subject;
        if (payload.message !== undefined) updateData.message = payload.message;
        if (payload.variables !== undefined) updateData.variables = payload.variables;
        if (payload.channel !== undefined) updateData.channel = payload.channel;
        if (payload.status !== undefined) updateData.status = payload.status;
        if (payload.scheduledAt !== undefined) updateData.scheduledAt = payload.scheduledAt;

        // Update campaign
        const [updatedCampaign] = await db
            .update(campaigns)
            .set(updateData)
            .where(and(eq(campaigns.id, campaignId), eq(campaigns.projectId, projectId)))
            .returning();

        return {
            success: true,
            data: updatedCampaign as Campaign
        };
    } catch (error) {
        console.error("Failed to update campaign:", error);
        return {
            success: false,
            error: "Failed to update campaign. Please try again."
        };
    }
};

/**
 * Delete a campaign
 */
export const deleteCampaign = async (
    campaignId: string,
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

        const userId = authResult.userId;

        // Verify project belongs to user
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
            .limit(1);

        if (!project) {
            return {
                success: false,
                error: "Project not found or access denied"
            };
        }

        // Get existing campaign
        const [existingCampaign] = await db
            .select()
            .from(campaigns)
            .where(and(eq(campaigns.id, campaignId), eq(campaigns.projectId, projectId)))
            .limit(1);

        if (!existingCampaign) {
            return {
                success: false,
                error: "Campaign not found"
            };
        }

        // Don't allow deletion of campaigns that are currently sending
        if (existingCampaign.status === "sending") {
            return {
                success: false,
                error: "Cannot delete a campaign that is currently sending"
            };
        }

        // Delete campaign
        await db
            .delete(campaigns)
            .where(and(eq(campaigns.id, campaignId), eq(campaigns.projectId, projectId)));

        return {
            success: true,
            data: undefined
        };
    } catch (error) {
        console.error("Failed to delete campaign:", error);
        return {
            success: false,
            error: "Failed to delete campaign. Please try again."
        };
    }
};
