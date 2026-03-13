import { db } from "@/db/db";
import { users } from "@/db/schema";
import { CreateUserDto } from "@/types";
import { ActionResponse } from "@/types/action-response";
import { eq } from "drizzle-orm";
import { hash,compare } from "bcrypt";
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


export const loginUser = async (email: string, password: string): Promise<ActionResponse<{
    token: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}>> => {
    try {
        if (!email || !password) {
            return {
                success: false,
                error: "Email and password are required"
            };
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            return {
                success: false,
                error: "Invalid email or password"
            };
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
            return {
                success: false,
                error: "Invalid email or password"
            };
        }

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
        console.error(`Login failed:`, error);

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Login failed. Please try again"
        };
    }
};


export const getUserFromToken = async (token: string): Promise<ActionResponse<{
    id: string;
    name: string | null;
    email: string;
}>> => {
    try {
        if (!token) {
            return {
                success: false,
                error: "Token is required"
            };
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };

        const [user] = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
            })
            .from(users)
            .where(eq(users.id, decoded.id))
            .limit(1);

        if (!user) {
            return {
                success: false,
                error: "User not found"
            };
        }

        return {
            success: true,
            data: user
        };
    } catch (error) {
        console.error(`Failed to get user from token:`, error);

        if (error instanceof jwt.JsonWebTokenError) {
            return {
                success: false,
                error: "Invalid token"
            };
        }

        if (error instanceof jwt.TokenExpiredError) {
            return {
                success: false,
                error: "Token has expired"
            };
        }

        if (error instanceof Error && error.message.includes("connection")) {
            return {
                success: false,
                error: "Database connection failed. Please try again later"
            };
        }

        return {
            success: false,
            error: "Failed to authenticate. Please login again"
        };
    }
};