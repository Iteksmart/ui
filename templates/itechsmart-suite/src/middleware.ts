import { NextResponse, type NextRequest } from "next/server"

// Host-based routing: one container serves every suite subdomain. nginx
// proxies each vhost here unchanged; we rewrite the subdomain to its app
// path so verify.itechsmart.dev/ renders src/app/verify at the root URL.
const HOST_TO_SLUG: Record<string, string> = {
  "verify.itechsmart.dev": "verify",
  "warroom.itechsmart.dev": "warroom",
  "arbiter.itechsmart.dev": "arbiter",
  "impactos.itechsmart.dev": "impactos",
  "generative-workflow.itechsmart.dev": "generative-workflow",
  "architect.itechsmart.dev": "architect",
  "certification.itechsmart.dev": "certification",
  "twin.itechsmart.dev": "twin",
  "market.itechsmart.dev": "market",
  "roi.itechsmart.dev": "roi",
  "knowledge-graph.itechsmart.dev": "knowledge-graph",
  "prooflink.itechsmart.dev": "prooflink",
  "pulse.itechsmart.dev": "pulse",
  "connect.itechsmart.dev": "connect",
  "notify.itechsmart.dev": "notify",
  "workflow.itechsmart.dev": "workflow",
  "rpa.itechsmart.dev": "rpa",
  "forge.itechsmart.dev": "forge",
  "edge.itechsmart.dev": "edge",
  "marketplace.itechsmart.dev": "marketplace",
  "signup.itechsmart.dev": "signup",
  "billing.itechsmart.dev": "billing",
  "partner.itechsmart.dev": "partner",
  "docs.itechsmart.dev": "docs",
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase()
  const slug = HOST_TO_SLUG[host]
  if (!slug) return NextResponse.next()

  const { pathname } = req.nextUrl
  // already rewritten or requesting a static asset
  if (pathname.startsWith(`/${slug}`) || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }
  const url = req.nextUrl.clone()
  url.pathname = `/${slug}${pathname === "/" ? "" : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
