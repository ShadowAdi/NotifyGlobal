import { db } from "@/db/db";
import { sendLogs } from "@/db/schema";
import { transporter } from "@/config/nodemailer";

interface SendEmailParams {
    projectId: string;
    campaignId?: string | null;
    eventId?: string | null;
    contact: {
        id: string;
        email: string;
    };
    subject: string;
    body: string;
    translatedLanguage: string | null;
}

interface SendEmailResult {
    success: boolean;
    error?: string;
}

/**
 * Sends a single email to a contact and logs the result in the send_logs table.
 */
export async function sendEmailToContact(params: SendEmailParams): Promise<SendEmailResult> {
    const { projectId, campaignId, eventId, contact, subject, body, translatedLanguage } = params;

    try {
        const info = await transporter.sendMail({
            from: process.env.APP_EMAIL,
            to: contact.email,
            subject,
            html: body,
        });

        await db.insert(sendLogs).values({
            projectId,
            contactId: contact.id,
            campaignId: campaignId ?? undefined,
            eventId: eventId ?? undefined,
            channel: "email",
            status: "sent",
            translatedLanguage,
            subject,
            body,
            externalId: info.messageId ?? null,
            sentAt: new Date(),
        });

        return { success: true };
    } catch (sendError) {
        const errorMsg = sendError instanceof Error ? sendError.message : "Unknown error";
        console.error(`Failed to send email to ${contact.email}: ${errorMsg}`);

        await db.insert(sendLogs).values({
            projectId,
            contactId: contact.id,
            campaignId: campaignId ?? undefined,
            eventId: eventId ?? undefined,
            channel: "email",
            status: "failed",
            translatedLanguage,
            subject,
            body,
            errorMessage: errorMsg,
        });

        return { success: false, error: errorMsg };
    }
}
