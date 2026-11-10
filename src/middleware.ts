import { NextResponse, type NextRequest } from "next/server";
/* Account validation happens inside Node.js server components and actions.
   Middleware must never open a SQLite database in the Edge runtime. */
export function middleware(_request: NextRequest) {
 const response=NextResponse.next();
 response.headers.set("Cache-Control","private, no-store");
 return response;
}
export const config={
 matcher:["/create/:path*","/video-editor/:path*","/studio","/account/:path*","/login","/signup","/api/account/:path*","/api/template-likes"],
};
