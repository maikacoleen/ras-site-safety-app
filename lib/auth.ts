import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
export const auth = betterAuth({
    trustedOrigins: [
        "https://*.vercel.app", // Allows all Vercel preview and production subdomains
        "http://localhost:3000",
    ],
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
        role: {
            type: "string",  
            required: false,
            defaultValue: "FRAMER",
            input: false, 
        },
        },
    }
});