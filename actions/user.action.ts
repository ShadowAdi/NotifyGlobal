import { db } from "@/db/db";
import { users } from "@/db/schema";
import { CreateUserDto } from "@/types";
import { ActionResponse } from "@/types/action-response";
import { eq } from "drizzle-orm";
import { hash } from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";


export const createUser = async (payload: CreateUserDto): Promise<ActionResponse<{
    token: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}>> => {
    try {
        if (!payload.email || !payload.password || !payload.name) {
            return {
                success: false,
                error: "All fields are required"
            };
        }

        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, payload.email))
            .limit(1);

        if (existingUser.length > 0) {
            return {
                success: false,
                error: "User with this email already exists"
            };
        }

        const hashedPassword = await hash(payload.password, 10);

        const [user] = await db.insert(users).values({
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
        }).returning({
            id: users.id,
            name: users.name,
            email: users.email,
            createdAt: users.createdAt,
        });

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return {
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            }
        };
    } catch (error) {
        console.error(`Failed to create user:`, error);

        if (error instanceof Error) {
            if (error.message.includes("unique")) {
                return {
                    success: false,
                    error: "Email already registered"
                };
            }
            if (error.message.includes("connection")) {
                return {
                    success: false,
                    error: "Database connection failed. Please try again later"
                };
            }
        }

        return {
            success: false,
            error: "Failed to create user. Please try again"
        };
    }
};

