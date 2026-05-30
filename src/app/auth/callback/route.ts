import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // x-forwarded-host is set by Vercel and other reverse proxies.
      // Prefer it over `origin` so redirects work correctly on production domains.
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isDev = process.env.NODE_ENV === 'development';

      if (isDev) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Exchange failed — redirect to a generic error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
