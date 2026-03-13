import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (user && user.password) {
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (isPasswordValid) {
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
          }
        }

        return null;
      },
    }),
  ],
});
