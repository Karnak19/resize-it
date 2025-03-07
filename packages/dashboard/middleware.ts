import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// This is a placeholder middleware that will be replaced with Better Auth middleware
export async function middleware(request: NextRequest) {
  const session = getSessionCookie(request);

  if (!session) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    // Apply to all routes under /dashboard
    "/dashboard/:path*",
  ],
};
