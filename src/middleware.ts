import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // Trigger refresh if needed so tokens are kept up to date
  await supabase.auth.getUser().catch(() => undefined);

  return response;
}

// Apply to all paths except static assets and Next internals
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|assets|fonts).*)",
  ],
};

