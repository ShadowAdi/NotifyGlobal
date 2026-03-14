import { db } from "@/db/db";
import { campaigns, contacts, sendLogs, templates, users } from "@/db/schema";
import { getUserIdFromToken } from "@/lib/auth";
import { transporter } from "@/config/nodemailer";
import { and, eq, inArray } from "drizzle-orm";
import { replaceVariables } from "@/lib/replaceVariable";
import { LingoDotDevEngine } from "lingo.dev/sdk";

export const SendCampaign = async (
    campaignId: string,
    token: string
) => {
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

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
            return {
                success: false,
                error: "User not found"
            };
        }

        const [campaign] = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.id, campaignId))
            .limit(1);

        if (!campaign) {
            return {
                success: false,
                error: "Campaign not found"
            };
        }

        if (campaign.channel !== "email") {
            return {
                success: false,
                error: "Only email campaigns are supported at this time"
            };
        }

        if (campaign.status !== "draft") {
            return {
                success: false,
                error: `Campaign cannot be sent because it is already "${campaign.status}"`
            };
        }

        let emailSubject = campaign.subject;
        let emailBody = campaign.message;

        if (campaign.templateId) {
            const [template] = await db
                .select()
                .from(templates)
                .where(eq(templates.id, campaign.templateId))
                .limit(1);

            if (!template) {
                return {
                    success: false,
                    error: "Template linked to this campaign was not found"
                };
            }

            emailSubject = template.subject;
            emailBody = template.body;
        }

        if (!emailSubject || !emailBody) {
            return {
                success: false,
                error: "Campaign must have a subject and body (either directly or via a template)"
            };
        }

        let contactList: {
            id: string;
            name: string;
            email: string;
            language: string;
            tags: unknown;
            metadata: unknown;
        }[] = [];

        const projectId = campaign.projectId;

        switch (campaign.filterType) {
            case "all": {
                contactList = await db
                    .select()
                    .from(contacts)
                    .where(eq(contacts.projectId, projectId));
                break;
            }
            case "language": {
                if (!campaign.filterLanguage) {
                    return { success: false, error: "Filter language is not set for this campaign" };
                }
                contactList = await db
                    .select()
                    .from(contacts)
                    .where(
                        and(
                            eq(contacts.projectId, projectId),
                            eq(contacts.language, campaign.filterLanguage)
                        )
                    );
                break;
            }
            case "tags": {
                // Fetch all project contacts and filter by tags in JS
                // (jsonb array containment varies by driver)
                const filterTags = campaign.filterTags as string[] | null;
                if (!filterTags || filterTags.length === 0) {
                    return { success: false, error: "Filter tags are not set for this campaign" };
                }
                const allContacts = await db
                    .select()
                    .from(contacts)
                    .where(eq(contacts.projectId, projectId));

                contactList = allContacts.filter((c) => {
                    const contactTags = c.tags as string[] | null;
                    if (!contactTags) return false;
                    return filterTags.some((tag) => contactTags.includes(tag));
                });
                break;
            }
            case "manual":
            default: {
                const ids = campaign.contactIds as string[] | null;
                if (!ids || ids.length === 0) {
                    return { success: false, error: "No contacts selected for this campaign" };
                }
                contactList = await db
                    .select()
                    .from(contacts)
                    .where(
                        and(
                            eq(contacts.projectId, projectId),
                            inArray(contacts.id, ids)
                        )
                    );
                break;
            }
        }

        if (contactList.length === 0) {
            return {
                success: false,
                error: "No contacts found matching the campaign filters"
            };
        }

        await db
            .update(campaigns)
            .set({
                status: "sending",
                totalContacts: String(contactList.length),
                startedAt: new Date(),
            })
            .where(eq(campaigns.id, campaignId));

        // --- Initialize Lingo.dev translation engine ---
        const lingoDotDev = new LingoDotDevEngine({
            apiKey: process.env.LINGO_API_KEY!,
        });

        let sentCount = 0;
        let failedCount = 0;

        for (const contact of contactList) {
            // Replace {{variables}} with contact data
            const personalizedSubject = replaceVariables(emailSubject, contact);
            const personalizedBody = replaceVariables(emailBody, contact);

            let finalSubject = personalizedSubject;
            let finalBody = personalizedBody;
            let translatedLanguage: string | null = null;

            const targetLocale = contact.language?.toLowerCase();

            if (targetLocale && targetLocale !== "en") {
                try {
                    const translated = await lingoDotDev.localizeObject(
                        { subject: personalizedSubject, body: personalizedBody },
                        { sourceLocale: "en", targetLocale }
                    );

                    finalSubject = translated.subject;
                    finalBody = translated.body;
                    translatedLanguage = targetLocale;
                } catch (translateError) {
                    // If translation fails, fall back to the original English content
                    console.error(
                        `Translation to "${targetLocale}" failed for ${contact.email}: ${
                            translateError instanceof Error ? translateError.message : "Unknown error"
                        }`
                    );
                }
            }

            try {
                const info = await transporter.sendMail({
                    from: process.env.APP_EMAIL,
                    to: contact.email,
                    subject: finalSubject,
                    html: finalBody,
                });

                sentCount++;

                // Create a send log for this successful send
                await db.insert(sendLogs).values({
                    projectId,
                    contactId: contact.id,
                    campaignId: campaign.id,
                    channel: "email",
                    status: "sent",
                    translatedLanguage,
                    subject: finalSubject,
                    body: finalBody,
                    externalId: info.messageId ?? null,
                    sentAt: new Date(),
                });
            } catch (sendError) {
                failedCount++;
                const errorMsg = sendError instanceof Error ? sendError.message : "Unknown error";
                console.error(`Failed to send email to ${contact.email}: ${errorMsg}`);

                // Create a send log for this failed send
                await db.insert(sendLogs).values({
                    projectId,
                    contactId: contact.id,
                    campaignId: campaign.id,
                    channel: "email",
                    status: "failed",
                    translatedLanguage,
                    subject: finalSubject,
                    body: finalBody,
                    errorMessage: errorMsg,
                });
            }

            // Update running counts on the campaign
            await db
                .update(campaigns)
                .set({
                    sentCount: String(sentCount),
                    failedCount: String(failedCount),
                })
                .where(eq(campaigns.id, campaignId));
        }

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
        console.error(`Failed to send campaign to people ${error}`);

        try {
            await db
                .update(campaigns)
                .set({ status: "failed" })
                .where(eq(campaigns.id, campaignId));
        } catch {
        }

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection error. Please try again."
            };
        }

        return {
            success: false,
            error: "Failed to send campaign. Please try again."
        };
    }
};