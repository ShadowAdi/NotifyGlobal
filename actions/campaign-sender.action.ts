"use server";

import { db } from "@/db/db";
import { campaigns, templates, users } from "@/db/schema";
import { getUserIdFromToken } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { replaceVariables } from "@/lib/replaceVariable";
import { getFilteredContacts } from "@/lib/contact-filter";
import { translateContent } from "@/lib/translate";
import { sendEmailToContact } from "@/lib/email-sender";

export const SendCampaign = async (
    campaignId: string,
    token: string
) => {
    try {
        if (!token) {
            return { success: false, error: "Authentication required" };
        }

        const authResult = await getUserIdFromToken(token);
        if (!authResult.success) {
            return { success: false, error: authResult.error };
        }

        const userId = authResult.userId;

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
            return { success: false, error: "User not found" };
        }

        const [campaign] = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.id, campaignId))
            .limit(1);

        if (!campaign) {
            return { success: false, error: "Campaign not found" };
        }

        if (campaign.channel !== "email") {
            return { success: false, error: "Only email campaigns are supported at this time" };
        }

        if (campaign.status !== "draft") {
            return { success: false, error: `Campaign cannot be sent because it is already "${campaign.status}"` };
        }

        // --- Resolve subject & body (template or inline) ---
        let emailSubject = campaign.subject;
        let emailBody = campaign.message;

        if (campaign.templateId) {
            const [template] = await db
                .select()
                .from(templates)
                .where(eq(templates.id, campaign.templateId))
                .limit(1);

            if (!template) {
                return { success: false, error: "Template linked to this campaign was not found" };
            }

            emailSubject = template.subject;
            emailBody = template.body;
        }

        if (!emailSubject || !emailBody) {
            return { success: false, error: "Campaign must have a subject and body (either directly or via a template)" };
        }

        // --- Fetch contacts ---
        const projectId = campaign.projectId;

        const contactResult = await getFilteredContacts({
            projectId,
            filterType: campaign.filterType,
            filterLanguage: campaign.filterLanguage,
            filterTags: campaign.filterTags as string[] | null,
            contactIds: campaign.contactIds as string[] | null,
        });

        if (!contactResult.success) {
            return { success: false, error: contactResult.error };
        }

        const contactList = contactResult.contacts;

        if (contactList.length === 0) {
            return { success: false, error: "No contacts found matching the campaign filters" };
        }

        // --- Mark campaign as sending ---
        await db
            .update(campaigns)
            .set({
                status: "sending",
                totalContacts: String(contactList.length),
                startedAt: new Date(),
            })
            .where(eq(campaigns.id, campaignId));

        // --- Send to each contact ---
        let sentCount = 0;
        let failedCount = 0;

        const campaignVariables =
            (campaign.variables ?? null) as Record<string, unknown> | null;

        for (const contact of contactList) {
            const contactData = {
                ...contact,
                metadata: {
                    ...(campaignVariables ?? {}),
                    ...(((contact as unknown as { metadata?: unknown }).metadata as Record<string, unknown>) ?? {}),
                },
            };

            const personalizedSubject = replaceVariables(emailSubject, contactData);
            const personalizedBody = replaceVariables(emailBody, contactData);

            const { subject: finalSubject, body: finalBody, translatedLanguage } =
                await translateContent(
                    { subject: personalizedSubject, body: personalizedBody },
                    contact.language
                );

            const result = await sendEmailToContact({
                projectId,
                campaignId: campaign.id,
                contact,
                subject: finalSubject,
                body: finalBody,
                translatedLanguage,
            });

            if (result.success) {
                sentCount++;
            } else {
                failedCount++;
            }

            await db
                .update(campaigns)
                .set({
                    sentCount: String(sentCount),
                    failedCount: String(failedCount),
                })
                .where(eq(campaigns.id, campaignId));
        }

        // --- Finalize ---
        const finalStatus = failedCount === contactList.length ? "failed" : "completed";

        await db
            .update(campaigns)
            .set({
                status: finalStatus,
                sentCount: String(sentCount),
                failedCount: String(failedCount),
                completedAt: new Date(),
            })
            .where(eq(campaigns.id, campaignId));

        return {
            success: true,
            data: {
                campaignId,
                status: finalStatus,
                totalContacts: contactList.length,
                sentCount,
                failedCount,
            },
        };
    } catch (error) {
        console.error(`Failed to send campaign: ${error}`);

        try {
            await db
                .update(campaigns)
                .set({ status: "failed" })
                .where(eq(campaigns.id, campaignId));
        } catch {
        }

        if (error instanceof Error && error.message.includes("connection")) {
            return { success: false, error: "Database connection error. Please try again." };
        }

        return { success: false, error: "Failed to send campaign. Please try again." };
    }
};