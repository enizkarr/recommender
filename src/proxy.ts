import { NextResponse, type NextRequest } from "next/server";

// Bosnian lives at the root (/, /?aktivnost=…) and English under /en. The pages themselves sit
// under app/[lang], so root addresses are served from /bs without the address bar changing.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/en" || pathname.startsWith("/en/")) return;

  const url = request.nextUrl.clone();
  // /bs is only the internal address: send visitors to the same page without it.
  if (pathname === "/bs" || pathname.startsWith("/bs/")) {
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url);
  }
  url.pathname = `/bs${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Not for Next's own files or anything with a file extension (photos, favicon).
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
