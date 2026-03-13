'use server'

import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const getUserIdFromToken =async (token: string): Promise<{ success: true; userId: string } | { success: false; error: string }> => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
        return { success: true, userId: decoded.id };
    } catch (error) {
        if (error instanceof JsonWebTokenError) {
            return { success: false, error: "Invalid token" };
        }
        if (error instanceof TokenExpiredError) {
            return { success: false, error: "Token has expired" };
        }
        return { success: false, error: "Authentication failed" };
    }
};