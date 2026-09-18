import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse, NextFetchEvent } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isOfficerRoute = createRouteMatcher([
  "/officer(.*)",
]);

const OFFICER_ROLES = ["procurement_officer", "auditor", "administrator", "officer"];

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
    
    if (isOfficerRoute(req)) {
      const authData = await auth();
      const claims = authData.sessionClaims as any;
      const role = String(claims?.metadata?.role || claims?.public_metadata?.role || claims?.role || "").toLowerCase();
      if (role && !OFFICER_ROLES.includes(role)) {
        return NextResponse.redirect(new URL("/bidder", req.url));
      }
    }
  }
});


export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  try {
    return await clerkHandler(req, event);
  } catch (error: any) {
    const errorMsg = String(error?.message || error || "");
    if (
      errorMsg.includes("jwk-kid-mismatch") ||
      errorMsg.includes("Handshake token verification failed") ||
      errorMsg.includes("signing key in JWKS") ||
      errorMsg.includes("secret-key-invalid")
    ) {
      console.warn("Detected stale/mismatched Clerk session; auto-clearing session cookies and redirecting.");
      const cleanUrl = new URL(req.url);
      cleanUrl.searchParams.delete("__clerk_handshake");
      cleanUrl.searchParams.delete("__clerk_help");

      const target = isPublicRoute(req) ? cleanUrl.toString() : new URL("/sign-in", req.url).toString();
      const res = NextResponse.redirect(target);

      const cookieNames = [
        "__session",
        "__client_uat",
        "__clerk_db_jwt",
        "__clerk_handshake",
      ];
      cookieNames.forEach((name) => {
        res.cookies.set(name, "", { maxAge: 0, path: "/" });
      });
      return res;
    }
    throw error;
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
