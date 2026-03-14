import { db } from "@/db/db";
import { campaigns, users } from "@/db/schema";
import { getUserIdFromToken } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

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


    } catch (error) {
        console.error(`Failed to send campaign to people ${error}`)


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
}