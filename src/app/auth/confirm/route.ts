import { NextResponse } from "next/server";
/* Legacy third-party confirmation links are no longer accepted. */
export function GET(request: Request){
 return NextResponse.redirect(new URL("/login?status=expired",request.url),303);
}
