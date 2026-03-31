import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createServerClient } from "@/lib/supabase";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "magic-link",
      credentials: {
        email: { label: "Email", type: "email" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const token = credentials?.token?.trim();

        if (!email || !token) return null;

        if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
          return null;
        }

        const supabase = createServerClient();

        const { data, error } = await supabase
          .from("magic_tokens")
          .select("*")
          .eq("email", email)
          .eq("token", token)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (error || !data) return null;

        // Mark token as used
        await supabase
          .from("magic_tokens")
          .update({ used: true })
          .eq("id", data.id);

        return { id: email, email, name: email.split("@")[0] };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
