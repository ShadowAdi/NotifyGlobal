import { db } from "@/db/db";
import { contacts } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export type ContactRecord = {
    id: string;
    name: string;
    email: string;
    language: string;
    tags: unknown;
    metadata: unknown;
};

interface FilterParams {
    projectId: string;
    filterType: string;
    filterLanguage?: string | null;
    filterTags?: string[] | null;
    contactIds?: string[] | null;
}

/**
 * Fetches contacts matching the campaign's filter criteria.
 * Returns an object with either a list of contacts or an error message.
 */
export async function getFilteredContacts(
    params: FilterParams
): Promise<{ success: true; contacts: ContactRecord[] } | { success: false; error: string }> {
    const { projectId, filterType, filterLanguage, filterTags, contactIds } = params;

    switch (filterType) {
        case "all": {
            const list = await db
                .select()
                .from(contacts)
                .where(eq(contacts.projectId, projectId));
            return { success: true, contacts: list };
        }

        case "language": {
            if (!filterLanguage) {
                return { success: false, error: "Filter language is not set for this campaign" };
            }
            const list = await db
                .select()
                .from(contacts)
                .where(
                    and(
                        eq(contacts.projectId, projectId),
                        eq(contacts.language, filterLanguage)
                    )
                );
            return { success: true, contacts: list };
        }

        case "tags": {
            if (!filterTags || filterTags.length === 0) {
                return { success: false, error: "Filter tags are not set for this campaign" };
            }
            const allContacts = await db
                .select()
                .from(contacts)
                .where(eq(contacts.projectId, projectId));

            const filtered = allContacts.filter((c) => {
                const contactTags = c.tags as string[] | null;
                if (!contactTags) return false;
                return filterTags.some((tag) => contactTags.includes(tag));
            });
            return { success: true, contacts: filtered };
        }

        case "manual":
        default: {
            if (!contactIds || contactIds.length === 0) {
                return { success: false, error: "No contacts selected for this campaign" };
            }
            const list = await db
                .select()
                .from(contacts)
                .where(
                    and(
                        eq(contacts.projectId, projectId),
                        inArray(contacts.id, contactIds)
                    )
                );
            return { success: true, contacts: list };
        }
    }
}
