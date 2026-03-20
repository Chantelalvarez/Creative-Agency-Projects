export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login (the sign-in page)
     * - /api/auth/* (NextAuth endpoints)
     * - /share (read-only public share links)
     * - Next.js internals (_next/static, _next/image, favicon)
     */
    "/((?!login|api/auth|share|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
