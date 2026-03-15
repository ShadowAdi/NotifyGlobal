import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { events, templates, contacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyApiKey } from "@/lib/verify-api-key";
import { replaceVariables } from "@/lib/replaceVariable";
import { translateContent } from "@/lib/translate";
import { sendEmailToContact } from "@/lib/email-sender";
import { TriggerEventBody } from "@/types";

/**
 * POST /api/events/trigger
 *
 * Called by external backends to trigger an event-based notification.
 *
 * Headers:
 *   Authorization: Bearer <api_key>
 *
 * Body (JSON):
 *   {
 *     "eventId":   "evt_abc123",      // required — the event's unique slug
 *     "email":     "user@example.com", // required — recipient email
 *     "name":      "John Doe",         // optional — recipient name
 *     "language":  "es",               // optional — ISO locale for translation
 *     "subject":   "...",              // optional — override subject (only when event has no template)
 *     "message":   "...",              // optional — override body   (only when event has no template)
 *     "variables": { "key": "value" }  // optional — values for {{variable}} placeholders
 *   }
 */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        const keyResult = await verifyApiKey(authHeader);

        if (!keyResult.success) {
            return NextResponse.json(
                { success: false, error: keyResult.error },
                { status: 401 }
            );
        }

        const { projectId } = keyResult;

        // ── 2. Parse & validate request body ────────────────────
        const body: TriggerEventBody = await req.json();

        if (!body.eventId || !body.email) {
            return NextResponse.json(
                { success: false, error: "eventId and email are required" },
                { status: 400 }
            );
        }

        // ── 3. Find the event ───────────────────────────────────
        const [event] = await db
            .select()
            .from(events)
            .where(
                and(
                    eq(events.eventId, body.eventId),
                    eq(events.projectId, projectId)
                )
            )
            .limit(1);

        if (!event) {
            return NextResponse.json(
                { success: false, error: "Event not found" },
                { status: 404 }
            );
        }

        if (!event.isActive) {
            return NextResponse.json(
                { success: false, error: "This event is currently disabled" },
                { status: 403 }
            );
        }

        // ── 4. Resolve subject & body ───────────────────────────
        let emailSubject: string | null = null;
        let emailBody: string | null = null;

        if (event.templateId) {
            // Template takes priority
            const [template] = await db
                .select()
                .from(templates)
                .where(eq(templates.id, event.templateId))
                .limit(1);

            if (!template) {
                return NextResponse.json(
                    { success: false, error: "Template linked to this event was not found" },
                    { status: 500 }
                );
            }

            emailSubject = template.subject;
            emailBody = template.body;
        } else {
            // Use inline subject+message from the event definition,
            // but allow the API caller to override them per request.
            emailSubject = body.subject ?? event.subject;
            emailBody = body.message ?? event.message;
        }

        if (!emailSubject || !emailBody) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No email content available. Provide a template on the event or send subject + message in the request body.",
                },
                { status: 400 }
            );
        }

        // ── 5. Upsert contact ───────────────────────────────────
        //   If the contact already exists in this project (by email),
        //   use their record. Otherwise create one automatically.
        const contactName = body.name ?? body.email.split("@")[0];
        const contactLanguage = body.language ?? "en";

        let [existingContact] = await db
            .select()
            .from(contacts)
            .where(
                and(
                    eq(contacts.projectId, projectId),
                    eq(contacts.email, body.email)
                )
            )
            .limit(1);

        if (!existingContact) {
            const [created] = await db
                .insert(contacts)
                .values({
                    projectId,
                    name: contactName,
                    email: body.email,
                    language: contactLanguage,
                    metadata: body.variables ? body.variables : null,
                })
                .returning();
            existingContact = created;
        }

        // ── 6. Build the contact data object for variable replacement ─
        const contactData = {
            name: existingContact.name ?? contactName,
            email: existingContact.email,
            language: contactLanguage,
            metadata: {
                ...((existingContact.metadata as Record<string, unknown>) ?? {}),
                ...(body.variables ?? {}),
            },
        };

        // ── 7. Replace {{variables}} ────────────────────────────
        const personalizedSubject = replaceVariables(emailSubject, contactData);
        const personalizedBody = replaceVariables(emailBody, contactData);

        // ── 8. Translate if needed ──────────────────────────────
        const { subject: finalSubject, body: finalBody, translatedLanguage } =
            await translateContent(
                { subject: personalizedSubject, body: personalizedBody },
                contactLanguage
            );

        // ── 9. Send the email ───────────────────────────────────
        const sendResult = await sendEmailToContact({
            projectId,
            eventId: event.id,
            contact: {
                id: existingContact.id,
                email: existingContact.email,
            },
            subject: finalSubject,
            body: finalBody,
            translatedLanguage,
        });

        if (!sendResult.success) {
            return NextResponse.json(
                { success: false, error: `Failed to send email: ${sendResult.error}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                eventId: body.eventId,
                email: body.email,
                translatedLanguage,
            },
        });
    } catch (error) {
        console.error("Event trigger failed:", error);

        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
